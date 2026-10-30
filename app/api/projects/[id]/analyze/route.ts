import { NextRequest, NextResponse, after } from "next/server";
import { db, projects } from "@/db";
import { eq } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";
import { protectAiEndpoint } from "@/lib/arcjet";
import { executeDirectAiAnalysis } from "@/lib/workers/upload-worker";

export const maxDuration = 300;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Fetch existing project record
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const project = rows[0];

    // Read optional overrides from request body if any
    let bodyData: any = {};
    try {
      bodyData = await req.json();
    } catch {
      // Body may be empty, which is completely fine
    }

    // Arcjet AI Endpoint Abuse Protection & Prompt Injection Detection
    const promptToScan = [
      bodyData.prompt,
      bodyData.instructions,
      bodyData.title,
      project.title,
    ]
      .filter(Boolean)
      .join(" ");

    const aiCheck = await protectAiEndpoint(req, {
      userId: project.userId || "guest_user",
      prompt: promptToScan,
    });

    if (!aiCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: aiCheck.error,
          reason: aiCheck.reason,
          details: aiCheck.details,
        },
        { status: aiCheck.status || 403 }
      );
    }

    let videoUrl = bodyData.videoUrl;
    if (typeof videoUrl === "string" && videoUrl.startsWith("blob:")) {
      videoUrl = undefined;
    }

    // If no external URL provided, generate/retrieve authentic S3 signed URL
    if (!videoUrl) {
      if (project.s3Key && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        try {
          const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
          const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
          const region = process.env.AWS_REGION || "ap-southeast-2";
          const bucket = project.s3Bucket || process.env.AWS_BUCKET_NAME || "vidshorts-uploads-ashwini";
          const s3Client = new S3Client({
            region,
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
          });
          videoUrl = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: bucket,
              Key: project.s3Key,
            }),
            { expiresIn: 604800 }
          );
        } catch (s3Err) {
          console.warn("[API:analyze] Error generating fresh S3 signed URL:", s3Err);
        }
      }

      if (!videoUrl) {
        videoUrl = project.signedUrl || project.s3Url || project.sourceUrl;
      }
    }

    if (!videoUrl && !project.s3Key) {
      if (project.status === "uploading" || project.status === "queued") {
        return NextResponse.json({
          success: true,
          message: "Video upload to S3 is in progress. Analysis will start automatically upon upload completion.",
          projectId,
          status: project.status,
        });
      }
    }

    // Look up local staged video file in .temp_uploads so Deepgram transcribes authentic video
    let tempFilePath: string | undefined;
    try {
      const fs = await import("fs");
      const path = await import("path");
      const tempDir = path.join(process.cwd(), ".temp_uploads");
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        const match = files.find(
          (f: string) =>
            f.includes(projectId) ||
            (project.originalFileName &&
              f.includes(project.originalFileName.replace(/[^a-zA-Z0-9._-]/g, "_")))
        );
        if (match) {
          tempFilePath = path.join(tempDir, match);
        } else if (files.length === 1 && files[0].endsWith(".mp4")) {
          tempFilePath = path.join(tempDir, files[0]);
        }
      }
    } catch (e) {
      console.warn("[API:analyze] Error checking .temp_uploads:", e);
    }

    // Update status in database
    await db
      .update(projects)
      .set({
        aiAnalysisStatus: "queued",
        progress: 10,
        stage: "Dispatched to Inngest: preparing Deepgram transcription pipeline...",
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    let inngestEventId = "";

    after(async () => {
      let dispatchedViaInngest = false;
      const isLocalDevInngest = process.env.INNGEST_DEV === "1";
      const hasValidInngestCloudKeys =
        !!process.env.INNGEST_EVENT_KEY &&
        !process.env.INNGEST_EVENT_KEY.includes("your-") &&
        !!process.env.INNGEST_SIGNING_KEY &&
        !process.env.INNGEST_SIGNING_KEY.includes("your-") &&
        process.env.INNGEST_SIGNING_KEY.length > 10;

      if (isLocalDevInngest || hasValidInngestCloudKeys) {
        try {
          const sendResult = await inngest.send({
            name: "video/process.analyze",
            data: {
              projectId,
              videoUrl,
              tempFilePath,
              userId: project.userId,
              title: project.title,
              aspectRatio: bodyData.aspectRatio || project.aspectRatio || "9:16",
              clipLength: bodyData.clipLength || project.clipLength || "30-60s",
              captionPreset: bodyData.captionPreset || project.captionPreset || "hormozi",
            },
          });

          inngestEventId = sendResult?.ids?.[0] || "";
          dispatchedViaInngest = true;
          console.log(
            `[API:analyze] Dispatched video/process.analyze for project ${projectId}. EventId: ${inngestEventId}`
          );
        } catch (inngestErr) {
          console.warn(
            `[API:analyze] Inngest send error (${(inngestErr as Error)?.message}). Executing direct AI analysis fallback worker...`
          );
        }
      }

      if (!dispatchedViaInngest) {
        try {
          await executeDirectAiAnalysis({
            projectId,
            userId: project.userId,
            videoUrl,
            tempFilePath,
            aspectRatio: bodyData.aspectRatio || project.aspectRatio || "9:16",
            clipLength: bodyData.clipLength || project.clipLength || "30-60s",
            captionPreset: bodyData.captionPreset || project.captionPreset || "hormozi",
          });
        } catch (workerErr) {
          console.error(`[API:analyze] Direct worker error:`, workerErr);
        }
      }
    });

    return NextResponse.json({
      success: true,
      projectId,
      inngestEventId,
      message: "AI analysis & Deepgram transcription workflow triggered successfully",
    });
  } catch (error: unknown) {
    console.error("[API:projects/analyze] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || "Failed to trigger AI analysis",
      },
      { status: 500 }
    );
  }
}
