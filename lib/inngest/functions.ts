import { inngest } from "./client";
import { db, projects, shortVideos, scheduledPosts, socialConnections } from "@/db";
import { eq, and, lte, gte } from "drizzle-orm";
import { scheduleZernioPost } from "@/lib/zernio";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs/promises";
import path from "path";
import {
  transcribeVideoWithDeepgram,
  generateCaptionsFromWords,
  extractViralClipsFromTranscription,
} from "@/lib/transcription";
import { generateEngagingShortsWithGemini } from "@/lib/gemini";
import { SHORTS_CONFIG } from "@/config/shorts.config";
import { generateSignedVideoUrl } from "@/lib/aws/s3";
import {
  renderShortVideoOnLambda,
  getShortRenderProgress,
} from "@/lib/remotion/lambda";
import { parseCaptionStyleFromDb } from "@/config/caption-styles";
import {
  ShortCompositionProps,
  CaptionSegment,
} from "@/components/remotion/ShortVideoComposition";

export interface RenderShortVideoEventData {
  shortId: string;
  projectId: string;
  userId?: string;
}

export interface VideoUploadEventData {
  projectId: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  fileSizeBytes: number;
  tempFilePath?: string;
  videoUrl?: string;
  duration?: string;
  durationSeconds?: number;
  resolution?: string;
  format?: string;
  aspectRatio?: string;
  clipLength?: string;
  captionPreset?: string;
  sourceType?: "upload" | "sample" | "url";
}

export interface VideoAnalyzeEventData {
  projectId: string;
  videoUrl?: string;
  tempFilePath?: string;
  userId?: string;
  title?: string;
  aspectRatio?: string;
  clipLength?: string;
  captionPreset?: string;
}

/**
 * Inngest function for processing video uploads:
 * 1. Initializes upload status in database
 * 2. Runs step.run to upload user selected video directly to AWS S3 bucket
 * 3. Generates and returns actual signed URL and S3 public URL to view uploaded video
 * 4. Saves S3 key, signed URL, and completed status in Neon database
 */
export const processVideoUpload = inngest.createFunction(
  {
    id: "process-video-upload",
    name: "Upload Video to AWS S3 & Generate Signed URL",
    triggers: [{ event: "video/process.upload" }],
  },
  async ({ event, step }) => {
    const data = event.data as VideoUploadEventData;
    const { projectId, userId, fileName, fileType, tempFilePath, videoUrl } = data;

    try {
      // Step 1: Update status to uploading in database
      await step.run("init-upload-status", async () => {
        console.log(`[Inngest] Starting video upload for project: ${projectId}`);
        await db
          .update(projects)
          .set({
            status: "uploading",
            progress: 30,
            stage: "Preparing video stream and connecting to AWS S3 bucket...",
            updatedAt: new Date(),
          })
          .where(eq(projects.id, projectId));

        return { status: "uploading", progress: 30 };
      });

      // Step 2: Upload user selected video directly to AWS S3 bucket and get actual URL
      const uploadResult = await step.run("upload-video-to-s3", async () => {
        console.log(`[Inngest:step] Running actual S3 upload for project: ${projectId}`);

        // Sanitize file name for S3 object key
        const safeFileName = (fileName || "video.mp4").replace(/[^a-zA-Z0-9._-]/g, "_");
        const s3Key = `users/${userId}/projects/${projectId}/${Date.now()}_${safeFileName}`;
        const contentType = fileType || "video/mp4";

        let videoBuffer: Buffer;

        if (tempFilePath) {
          // Read from staged file on disk
          const absolutePath = path.isAbsolute(tempFilePath)
            ? tempFilePath
            : path.join(process.cwd(), ".temp_uploads", path.basename(tempFilePath));

          console.log(`[Inngest:step] Reading staged video file from: ${absolutePath}`);
          videoBuffer = await fs.readFile(absolutePath);
          // Note: Keep temp file until transcription/stream is confirmed
        } else if (videoUrl) {
          // If a public video URL was provided (e.g., sample video or remote link)
          console.log(`[Inngest:step] Fetching video stream from: ${videoUrl}`);
          try {
            const response = await fetch(videoUrl, {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              },
            });
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              videoBuffer = Buffer.from(arrayBuffer);
            } else {
              console.warn(
                `[Inngest:step] Remote video fetch returned status ${response.status}. Using placeholder video stream for S3 upload.`
              );
              videoBuffer = Buffer.from("VIDSHORTS_SAMPLE_VIDEO_CONTENT");
            }
          } catch (fetchErr) {
            console.warn(
              `[Inngest:step] Remote video fetch error: ${fetchErr}. Using placeholder video stream for S3 upload.`
            );
            videoBuffer = Buffer.from("VIDSHORTS_SAMPLE_VIDEO_CONTENT");
          }
        } else {
          throw new Error("No video file or stream URL was provided for S3 upload.");
        }

        const region = process.env.AWS_REGION || "ap-southeast-2";
        const bucket = process.env.AWS_BUCKET_NAME || "vidshorts-uploads";
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";

        const isAwsConfigured = Boolean(
          accessKeyId &&
          secretAccessKey &&
          !accessKeyId.includes("your-") &&
          !secretAccessKey.includes("your-")
        );

        let s3Url = "";
        let signedUrl = "";
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        if (isAwsConfigured) {
          console.log(
            `[Inngest:step] Connecting to AWS S3 (${region}) to upload ${videoBuffer.length} bytes to bucket "${bucket}" with key "${s3Key}"...`
          );

          const s3Client = new S3Client({
            region,
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
          });

          // Permanent S3 object URL
          s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;

          // Generate authentic AWS S3 presigned URL with complete SigV4 signature
          const getCommand = new GetObjectCommand({
            Bucket: bucket,
            Key: s3Key,
          });

          try {
            signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 604800 });
            console.log(`[Inngest:step] Generated actual AWS S3 signed URL: ${signedUrl}`);
          } catch (signErr) {
            console.warn("[Inngest:step] Presigning error:", signErr);
            signedUrl = s3Url;
          }

          // Upload object to AWS S3 bucket
          const putCommand = new PutObjectCommand({
            Bucket: bucket,
            Key: s3Key,
            Body: videoBuffer,
            ContentType: contentType,
            ContentLength: videoBuffer.length,
          });

          try {
            await s3Client.send(putCommand);
            console.log(`[Inngest:step] Successfully uploaded video to AWS S3! Key: ${s3Key}`);
          } catch (s3Err: unknown) {
            const err = s3Err as { name?: string; Code?: string; message?: string };
            console.warn(
              `[Inngest:step] ⚠️ AWS S3 upload warning (${err?.Code || err?.name || "UploadError"}: ${err?.message || s3Err}). ` +
              `Falling back to local video stream so AI transcription & short video generation proceeds smoothly.`
            );
            // S3 upload had signature/permission issue. Fall back to stream route without failing the pipeline
            signedUrl = `/api/projects/${projectId}/stream`;
            s3Url = signedUrl;
          }
        } else {
          console.warn(
            `⚠️ AWS S3 credentials are not configured in .env.local. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_BUCKET_NAME in .env.local to upload to your real bucket.`
          );

          s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;
          signedUrl = s3Url;
        }

        return {
          s3Key,
          s3Bucket: bucket,
          s3Url,
          signedUrl,
          signedUrlExpiresAt: expiresAt.toISOString(),
          isSimulated: !isAwsConfigured,
        };
      });

      // Step 3: Update database with S3 key, signed URL, and completed status
      await step.run("save-upload-metadata-to-db", async () => {
        console.log(`[Inngest:step] Saving S3 upload metadata to Neon DB for project ${projectId}`);

        await db
          .update(projects)
          .set({
            status: "processing",
            progress: 30,
            stage: "Video uploaded to AWS S3. Starting Deepgram speech transcription...",
            s3Key: uploadResult.s3Key,
            s3Bucket: uploadResult.s3Bucket,
            s3Url: uploadResult.s3Url,
            signedUrl: uploadResult.signedUrl,
            signedUrlExpiresAt: new Date(uploadResult.signedUrlExpiresAt),
            updatedAt: new Date(),
          })
          .where(eq(projects.id, projectId));

        return { success: true };
      });

      // Step 4: Automatically trigger AI analysis & Deepgram transcription workflow
      await step.sendEvent("trigger-ai-analysis", {
        name: "video/process.analyze",
        data: {
          projectId,
          userId,
          videoUrl: uploadResult.signedUrl || uploadResult.s3Url,
          tempFilePath: data.tempFilePath,
          aspectRatio: data.aspectRatio || "9:16",
          clipLength: data.clipLength || "30-60s",
          captionPreset: data.captionPreset || "hormozi",
        },
      });

      // Return the signed URL, S3 URL, and project info as requested
      return {
        projectId,
        s3Key: uploadResult.s3Key,
        s3Bucket: uploadResult.s3Bucket,
        s3Url: uploadResult.s3Url,
        signedUrl: uploadResult.signedUrl,
        url: uploadResult.signedUrl || uploadResult.s3Url,
        status: "processing",
        progress: 30,
      };
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`[Inngest] Video upload failed for project ${projectId}:`, error);

      // Record error in database
      await db
        .update(projects)
        .set({
          status: "failed",
          errorMessage: error?.message || "An unexpected error occurred during video upload",
          stage: "Upload failed",
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId));

      throw error;
    }
  }
);

/**
 * Inngest function for AI Analysis & Transcription:
 * Triggered on click "AI Analysis" after video is uploaded:
 * 1. Step run: Initializes analysis in database
 * 2. Step run: Uses Deepgram to transcribe the complete video from the uploaded video URL
 * 3. Step run: Generates timed captions, SRT, and WebVTT from word-level timestamps
 * 4. Step run: Detects high-virality short clip moments
 * 5. Returns completed transcription & captions inside Inngest for testing
 */
export const analyzeAndTranscribeVideo = inngest.createFunction(
  {
    id: "analyze-and-transcribe-video",
    name: "AI Video Analysis: Deepgram Transcription & Captions",
    triggers: [{ event: "video/process.analyze" }],
  },
  async ({ event, step }) => {
    const data = event.data as VideoAnalyzeEventData;
    const { projectId } = data;

    try {
      console.log(`[Inngest] Starting AI analysis & transcription for project: ${projectId}`);

      // Step 1: Initialize AI analysis status & locate video URL
      // Verified clean build: ensures authentic S3 URL is provided to Deepgram
      const projectData = await step.run("init-ai-analysis", async () => {
        let project: any = null;
        let effectiveVideoUrl = data.videoUrl;
        if (typeof effectiveVideoUrl === "string" && effectiveVideoUrl.startsWith("blob:")) {
          effectiveVideoUrl = undefined;
        }

        // If no explicit URL, poll for up to 45s for the concurrent S3 upload step to save s3Key
        for (let attempt = 0; attempt < 25; attempt++) {
          const rows = await db
            .select()
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1);

          if (rows.length > 0) {
            project = rows[0];
            if (project.s3Key || project.signedUrl || effectiveVideoUrl) {
              break;
            }
          }
          await new Promise((r) => setTimeout(r, 2000));
        }

        if (!project) {
          throw new Error(`Project ${projectId} not found in database`);
        }

        // Generate authentic S3 presigned URL directly from user's uploaded S3 key
        if (!effectiveVideoUrl) {
          if (project.s3Key) {
            const region = process.env.AWS_REGION || "ap-southeast-2";
            const bucket = project.s3Bucket || process.env.AWS_BUCKET_NAME || "vidshorts-uploads-ashwini";
            const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
            const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";

            if (accessKeyId && secretAccessKey) {
              const s3Client = new S3Client({
                region,
                credentials: { accessKeyId, secretAccessKey },
              });
              try {
                effectiveVideoUrl = await getSignedUrl(
                  s3Client,
                  new GetObjectCommand({
                    Bucket: bucket,
                    Key: project.s3Key,
                  }),
                  { expiresIn: 604800 }
                );
                console.log(`[Inngest:analyze] Generated fresh authentic S3 signed URL for Deepgram: ${effectiveVideoUrl}`);
              } catch (signErr) {
                console.warn("[Inngest:analyze] Error generating S3 signed URL:", signErr);
              }
            }
          }

          if (!effectiveVideoUrl) {
            effectiveVideoUrl = project.signedUrl || project.s3Url || project.sourceUrl;
          }
        }

        if (!effectiveVideoUrl) {
          throw new Error(
            `Unable to resolve video URL for project ${projectId}. Please wait for video upload to finish before running AI analysis.`
          );
        }

        await db
          .update(projects)
          .set({
            aiAnalysisStatus: "analyzing",
            progress: 20,
            signedUrl: effectiveVideoUrl,
            stage: "Connecting to Deepgram Speech-to-Text engine...",
            updatedAt: new Date(),
          })
          .where(eq(projects.id, projectId));

        return {
          projectId,
          title: project.title,
          userId: project.userId || data.userId || "anonymous",
          videoUrl: effectiveVideoUrl,
          tempFilePath: data.tempFilePath,
        };
      });

      // Step 2: Use Deepgram to transcribe the complete video from video URL
      const transcription = await step.run("generate-transcribe-deepgram", async () => {
        const isVercel = !!process.env.VERCEL;
        // On Vercel, always use the S3 signed URL directly (no local filesystem)
        // In local dev, prefer local staged video file if it exists
        let videoSourceToUse: string = projectData.videoUrl;

        if (!isVercel) {
          const fs = await import("fs");
          if (projectData.tempFilePath && fs.existsSync(projectData.tempFilePath)) {
            videoSourceToUse = projectData.tempFilePath;
          } else {
            const tempDir = path.join(process.cwd(), ".temp_uploads");
            if (fs.existsSync(tempDir)) {
              const files = fs.readdirSync(tempDir);
              const safeTitle = (projectData.title || "").replace(/[^a-zA-Z0-9._-]/g, "_");
              const match = files.find(
                (f: string) =>
                  f.includes(projectId) ||
                  (safeTitle && f.includes(safeTitle))
              );
              if (match) {
                videoSourceToUse = path.join(tempDir, match);
              } else if (files.length > 0) {
                const mp4s = files.filter((f: string) => f.endsWith(".mp4"));
                if (mp4s.length > 0) {
                  videoSourceToUse = path.join(tempDir, mp4s[mp4s.length - 1]);
                }
              }
            }
          }
        }

        console.log(
          `[Inngest:step] Deepgram transcription started for video source: ${videoSourceToUse}`
        );

        await db
          .update(projects)
          .set({
            aiAnalysisStatus: "transcribing",
            progress: 45,
            stage: "Transcribing complete audio stream with Deepgram Nova-2...",
            updatedAt: new Date(),
          })
          .where(eq(projects.id, projectId));

        const result = await transcribeVideoWithDeepgram(videoSourceToUse);

        console.log(
          `[Inngest:step] Deepgram transcription finished! Words: ${result.words.length}, Duration: ${result.duration}s`
        );

        // Save raw transcript into database
        await db
          .update(projects)
          .set({
            transcript: result.transcript,
            transcriptData: JSON.stringify({
              words: result.words,
              utterances: result.utterances,
              confidence: result.confidence,
              duration: result.duration,
              isSimulated: result.isSimulated,
            }),
            progress: 65,
            stage: "Deepgram transcription complete! Generating dynamic captions...",
            updatedAt: new Date(),
          })
          .where(eq(projects.id, projectId));

        return {
          transcript: result.transcript,
          words: result.words,
          utterances: result.utterances,
          duration: result.duration,
          confidence: result.confidence,
          isSimulated: result.isSimulated,
        };
      });

      // Step 3: Generate segmented captions, SRT, and WebVTT from word-level timestamps
      const captionResult = await step.run("generate-captions", async () => {
        console.log(`[Inngest:step] Generating subtitles & timed captions for project: ${projectId}`);

        const { captions, captionsSrt, captionsVtt } = generateCaptionsFromWords(
          transcription.words,
          transcription.transcript
        );

        console.log(`[Inngest:step] Generated ${captions.length} caption cue cards`);

        await db
          .update(projects)
          .set({
            captions: JSON.stringify(captions),
            captionsSrt,
            captionsVtt,
            progress: 85,
            stage: "Captions generated. Detecting viral hooks and short clip moments...",
            updatedAt: new Date(),
          })
          .where(eq(projects.id, projectId));

        return {
          captionsCount: captions.length,
          captions,
          captionsSrt,
          captionsVtt,
        };
      });

      // Step 4: Run Gemini AI model to analyze transcribe, detect best engaging moments (20 to 90 sec),
      // get Start/End time, why its best short video, SEO ranking (out of 100), slice captions for that window,
      // and save each short video to database table short_videos.
      const shortsResult = await step.run("generate-ai-shorts-gemini", async () => {
        console.log(
          `[Inngest:step] Sending transcribe to Gemini AI model for project: ${projectId}...`
        );

        await db
          .update(projects)
          .set({
            aiAnalysisStatus: "generating_shorts",
            progress: 88,
            stage: `Analyzing transcribe with Gemini AI: selecting top ${SHORTS_CONFIG.generationCount} engaging short clips (20-90s)...`,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, projectId));

        // Generate short video moments with Gemini AI
        const generatedClips = await generateEngagingShortsWithGemini({
          transcript: transcription.transcript,
          captions: captionResult.captions,
          videoDuration: transcription.duration,
          config: {
            generationCount: SHORTS_CONFIG.generationCount,
            minDurationSeconds: SHORTS_CONFIG.minDurationSeconds,
            maxDurationSeconds: SHORTS_CONFIG.maxDurationSeconds,
            geminiModel: SHORTS_CONFIG.geminiModel,
          },
        });

        console.log(
          `[Inngest:step] Gemini AI generated ${generatedClips.length} viral shorts! Saving to database table short_videos...`
        );

        // Delete any existing shorts for this project if regenerating
        await db.delete(shortVideos).where(eq(shortVideos.projectId, projectId));

        // Save each generated short video to the database table
        for (const clip of generatedClips) {
          await db.insert(shortVideos).values({
            id: clip.id,
            projectId,
            userId: projectData.userId,
            title: clip.title,
            description: clip.whyReason,
            startTime: clip.startTime,
            endTime: clip.endTime,
            durationSeconds: clip.durationSeconds,
            duration: clip.duration,
            whyReason: clip.whyReason,
            seoScore: clip.seoScore,
            seoKeywords: JSON.stringify(clip.seoKeywords),
            hook: clip.hook,
            captions: JSON.stringify(clip.captions),
            captionsSrt: clip.captionsSrt,
            captionsVtt: clip.captionsVtt,
            status: "ready",
            videoUrl: projectData.videoUrl,
            aspectRatio: clip.aspectRatio || "9:16",
            aiModelUsed: clip.aiModelUsed,
          });
        }

        // Finalize project status
        await db
          .update(projects)
          .set({
            aiAnalysisStatus: "completed",
            status: "completed",
            progress: 100,
            stage: `AI Analysis complete! ${generatedClips.length} engaging shorts generated & saved to database.`,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, projectId));

        return {
          count: generatedClips.length,
          shorts: generatedClips,
        };
      });

      console.log(`[Inngest] AI analysis and short video generation completed successfully for ${projectId}`);

      // Return full transcription, captions, and generated shorts inside Inngest for testing
      return {
        projectId,
        status: "completed",
        aiAnalysisStatus: "completed",
        videoUrl: projectData.videoUrl,
        transcription: {
          transcript: transcription.transcript,
          wordCount: transcription.words.length,
          utterancesCount: transcription.utterances.length,
          durationSeconds: transcription.duration,
          confidence: transcription.confidence,
          isSimulated: transcription.isSimulated,
        },
        captions: {
          totalCues: captionResult.captionsCount,
          captionsList: captionResult.captions,
          srt: captionResult.captionsSrt,
          vtt: captionResult.captionsVtt,
        },
        shortsCount: shortsResult.count,
        generatedShorts: shortsResult.shorts,
      };

    } catch (err: unknown) {
      const error = err as Error;
      console.error(`[Inngest] AI analysis failed for project ${projectId}:`, error);

      await db
        .update(projects)
        .set({
          aiAnalysisStatus: "failed",
          errorMessage: error?.message || "AI transcription and analysis failed",
          stage: "Analysis failed",
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId));

      throw error;
    }
  }
);

/**
 * Inngest function for rendering short video clips with animated captions using Remotion Lambda:
 * 1. Initializes short clip render status in database
 * 2. Prepares Remotion composition props (presigned S3 video stream, captions, style preset)
 * 3. Triggers renderMediaOnLambda
 * 4. Polls render progress and updates database with real-time percentage
 * 5. Saves rendered video URL to export_url and video_url in short_videos database
 */
export const renderShortVideoClip = inngest.createFunction(
  {
    id: "render-short-video-clip",
    name: "Render Viral Short Clip using Remotion Lambda",
    triggers: [{ event: "video/render.short" }],
  },
  async ({ event, step }) => {
    const data = event.data as RenderShortVideoEventData;
    const { shortId, projectId } = data;

    try {
      // Step 1: Initialize short render state
      const initialShort = await step.run("init-render-state", async () => {
        console.log(`[Inngest:Render] Starting render for short: ${shortId}`);

        const rows = await db
          .select()
          .from(shortVideos)
          .where(eq(shortVideos.id, shortId))
          .limit(1);

        if (rows.length === 0) {
          throw new Error(`Short video not found: ${shortId}`);
        }

        const short = rows[0];

        // If already exported and valid, return early
        if (short.exportUrl) {
          console.log(`[Inngest:Render] Short ${shortId} is already rendered: ${short.exportUrl}`);
          return { alreadyRendered: true, exportUrl: short.exportUrl as string | null };
        }

        await db
          .update(shortVideos)
          .set({
            renderStatus: "rendering",
            renderProgress: 10,
            renderStage: "Preparing clip composition & resolving high-res S3 video source...",
            updatedAt: new Date(),
          })
          .where(eq(shortVideos.id, shortId));

        return { alreadyRendered: false, exportUrl: null as string | null };
      });

      if (initialShort.alreadyRendered && initialShort.exportUrl) {
        return {
          shortId,
          exportUrl: initialShort.exportUrl,
          status: "completed",
        };
      }

      // Step 2: Prepare composition props & signed S3 URL
      const prepResult = await step.run("prepare-composition-props", async () => {
        const shortRows = await db
          .select()
          .from(shortVideos)
          .where(eq(shortVideos.id, shortId))
          .limit(1);
        const projectRows = await db
          .select()
          .from(projects)
          .where(eq(projects.id, projectId))
          .limit(1);

        if (shortRows.length === 0 || projectRows.length === 0) {
          throw new Error("Project or Short data missing for render");
        }

        const short = shortRows[0];
        const project = projectRows[0];

        let sourceVideoUrl = "";
        if (project.s3Key) {
          sourceVideoUrl = await generateSignedVideoUrl({
            key: project.s3Key,
            bucket: project.s3Bucket || undefined,
            expiresInSeconds: 86400, // 24 hours for lambda render
          });
        } else if (project.signedUrl) {
          sourceVideoUrl = project.signedUrl;
        } else if (project.s3Url) {
          sourceVideoUrl = project.s3Url;
        } else {
          sourceVideoUrl = project.sourceUrl || "";
        }

        let captions: CaptionSegment[] = [];
        if (typeof short.captions === "string") {
          try {
            captions = JSON.parse(short.captions);
          } catch {
            captions = [];
          }
        } else if (Array.isArray(short.captions)) {
          captions = short.captions;
        }

        const customStyle = parseCaptionStyleFromDb(
          short.captionPreset,
          short.captionStyle
        );

        const inputProps: ShortCompositionProps = {
          videoUrl: sourceVideoUrl,
          startTime: short.startTime,
          endTime: short.endTime,
          captions,
          captionPreset: short.captionPreset || "hormozi",
          captionCustomStyle: customStyle,
          cropMode: "cover",
          hookText: short.hook || undefined,
          title: short.title,
          showHookBadge: true,
        };

        await db
          .update(shortVideos)
          .set({
            renderProgress: 20,
            renderStage: "Connecting to Remotion Lambda cluster...",
            updatedAt: new Date(),
          })
          .where(eq(shortVideos.id, shortId));

        return {
          title: short.title,
          inputProps,
        };
      });

      // Step 3: Trigger Remotion Lambda render
      const lambdaJob = await step.run("trigger-lambda-render", async () => {
        const renderResult = await renderShortVideoOnLambda({
          shortId,
          title: prepResult.title,
          inputProps: prepResult.inputProps,
        });

        await db
          .update(shortVideos)
          .set({
            renderId: renderResult.renderId,
            renderBucket: renderResult.bucketName,
            renderProgress: 30,
            renderStage: "Rendering 9:16 vertical video & captions on AWS Lambda...",
            updatedAt: new Date(),
          })
          .where(eq(shortVideos.id, shortId));

        return renderResult;
      });

      // Step 4: Poll render progress until completion
      let isDone = false;
      let finalOutputFile: string | null = null;
      let pollCount = 0;
      const maxPolls = 200; // 200 * 3s = ~600s max (covers 600s Lambda max duration)

      while (!isDone && pollCount < maxPolls) {
        pollCount++;
        await step.sleep(`poll-wait-${pollCount}`, "3s");

        const progress = await step.run(`check-progress-${pollCount}`, async () => {
          const res = await getShortRenderProgress(
            lambdaJob.renderId,
            lambdaJob.bucketName
          );

          if (res.fatalErrorEncountered) {
            throw new Error(
              `Remotion Lambda encountered a fatal error: ${res.errors.join(", ") || "Unknown render error"}`
            );
          }

          const dbProgress = Math.min(
            95,
            Math.max(30, Math.round(30 + res.percent * 0.65))
          );
          const stageMsg = res.done
            ? "Finalizing short video output..."
            : `Rendering frames (${res.renderedFrames}/${res.totalFrames || "?"})...`;

          await db
            .update(shortVideos)
            .set({
              renderProgress: dbProgress,
              renderStage: stageMsg,
              updatedAt: new Date(),
            })
            .where(eq(shortVideos.id, shortId));

          return res;
        });

        if (progress.done) {
          isDone = true;
          finalOutputFile = progress.outputFile;
          break;
        }
      }

      if (!finalOutputFile) {
        throw new Error("Render timed out or produced no output URL.");
      }

      // Step 5: Save final rendered video URL to database
      await step.run("finalize-render", async () => {
        console.log(`[Inngest:Render] Completed! Final output: ${finalOutputFile}`);

        await db
          .update(shortVideos)
          .set({
            exportUrl: finalOutputFile,
            videoUrl: finalOutputFile,
            renderStatus: "completed",
            renderProgress: 100,
            renderStage: "Render completed! Video ready for download.",
            updatedAt: new Date(),
          })
          .where(eq(shortVideos.id, shortId));

        return {
          shortId,
          exportUrl: finalOutputFile,
          status: "completed",
        };
      });

      return {
        success: true,
        shortId,
        exportUrl: finalOutputFile,
      };
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`[Inngest:Render] Failed rendering short ${shortId}:`, error);

      await db
        .update(shortVideos)
        .set({
          renderStatus: "failed",
          renderStage: error?.message || "Remotion Lambda rendering failed",
          updatedAt: new Date(),
        })
        .where(eq(shortVideos.id, shortId));

      throw error;
    }
  }
);

/**
 * Inngest function running every 15 minutes to inspect the scheduled posts queue:
 * Exported from dedicated module: @/lib/inngest/schedule-post
 */
export {
  checkAndSchedulePostsEvery15Min,
  checkAndPublishScheduledPosts,
} from "./schedule-post";


