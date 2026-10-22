import { db, shortVideos, projects } from "@/db";
import { eq } from "drizzle-orm";
import { generateSignedVideoUrl } from "@/lib/aws/s3";
import { parseCaptionStyleFromDb } from "@/config/caption-styles";
import {
  renderShortVideoOnLambda,
  getShortRenderProgress,
} from "@/lib/remotion/lambda";
import {
  ShortCompositionProps,
  CaptionSegment,
} from "@/components/remotion/ShortVideoComposition";

export interface DirectRenderParams {
  shortId: string;
  projectId: string;
  userId?: string;
}

/**
 * Robust standalone render worker for Remotion Lambda short videos.
 * Handles the end-to-end rendering workflow:
 * 1. Resolves source video URL and signed S3 links
 * 2. Parses captions, custom styling, and composition properties
 * 3. Triggers Remotion Lambda execution
 * 4. Polls real-time progress, updating Neon database
 * 5. Saves completed export URL to database
 * 
 * Can be called directly by API routes or by Inngest workflows.
 */
export async function executeDirectRenderShortVideo({
  shortId,
  projectId,
}: DirectRenderParams): Promise<{ success: boolean; exportUrl: string }> {
  console.log(`[RenderWorker] Starting render execution for short: ${shortId} (project: ${projectId})`);

  try {
    // 1. Fetch short and project details
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

    if (shortRows.length === 0) {
      throw new Error(`Short video record not found: ${shortId}`);
    }
    if (projectRows.length === 0) {
      throw new Error(`Project record not found: ${projectId}`);
    }

    const short = shortRows[0];
    const project = projectRows[0];

    // If already exported, return early
    if (short.exportUrl) {
      console.log(`[RenderWorker] Short ${shortId} is already exported: ${short.exportUrl}`);
      return { success: true, exportUrl: short.exportUrl };
    }

    // 2. Set DB progress to 10%
    await db
      .update(shortVideos)
      .set({
        renderStatus: "rendering",
        renderProgress: 10,
        renderStage: "Preparing clip composition & resolving high-res S3 video source...",
        updatedAt: new Date(),
      })
      .where(eq(shortVideos.id, shortId));

    // 3. Resolve source video URL
    let sourceVideoUrl = "";
    if (project.s3Key) {
      sourceVideoUrl = await generateSignedVideoUrl({
        key: project.s3Key,
        bucket: project.s3Bucket || undefined,
        expiresInSeconds: 86400, // 24 hours
      });
    } else if (project.signedUrl) {
      sourceVideoUrl = project.signedUrl;
    } else if (project.s3Url) {
      sourceVideoUrl = project.s3Url;
    } else {
      sourceVideoUrl = project.sourceUrl || "";
    }

    if (!sourceVideoUrl) {
      throw new Error("Unable to resolve source video stream for rendering.");
    }

    // 4. Parse captions and style presets
    let captions: CaptionSegment[] = [];
    if (typeof short.captions === "string") {
      try {
        captions = JSON.parse(short.captions);
      } catch {
        captions = [];
      }
    } else if (Array.isArray(short.captions)) {
      captions = short.captions as CaptionSegment[];
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

    // 5. Update DB to 20%
    await db
      .update(shortVideos)
      .set({
        renderProgress: 20,
        renderStage: "Connecting to Remotion Lambda cluster...",
        updatedAt: new Date(),
      })
      .where(eq(shortVideos.id, shortId));

    // 6. Trigger Remotion Lambda renderMediaOnLambda
    const renderResult = await renderShortVideoOnLambda({
      shortId,
      title: short.title,
      inputProps,
    });

    console.log(`[RenderWorker] Lambda render started: ${renderResult.renderId}`);

    // 7. Update DB to 30% with renderId and renderBucket
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

    // 8. Poll render progress every 3s
    let isDone = false;
    let finalOutputFile: string | null = null;
    let pollCount = 0;
    const maxPolls = 200; // 200 * 3s = 600s max

    while (!isDone && pollCount < maxPolls) {
      pollCount++;
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const progress = await getShortRenderProgress(
        renderResult.renderId,
        renderResult.bucketName
      );

      if (progress.fatalErrorEncountered) {
        throw new Error(
          `Remotion Lambda fatal error: ${progress.errors.join(", ") || "Unknown render error"}`
        );
      }

      const dbProgress = Math.min(
        95,
        Math.max(30, Math.round(30 + progress.percent * 0.65))
      );
      const stageMsg = progress.done
        ? "Finalizing short video output..."
        : `Rendering frames (${progress.renderedFrames}/${progress.totalFrames || "?"})...`;

      await db
        .update(shortVideos)
        .set({
          renderProgress: dbProgress,
          renderStage: stageMsg,
          updatedAt: new Date(),
        })
        .where(eq(shortVideos.id, shortId));

      if (progress.done) {
        isDone = true;
        finalOutputFile = progress.outputFile;
        break;
      }
    }

    if (!finalOutputFile) {
      throw new Error("Render timed out or produced no output URL.");
    }

    // 9. Save final export URL to DB
    console.log(`[RenderWorker] Render complete! Final video: ${finalOutputFile}`);
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
      success: true,
      exportUrl: finalOutputFile,
    };
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`[RenderWorker] Error rendering short ${shortId}:`, error);

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
