import { NextRequest, NextResponse, after } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db, projects } from "@/db";
import { eq } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";
import { generateSignedVideoUrl } from "@/lib/aws/s3";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    let userId = "guest_user";
    try {
      const authResult = await auth();
      if (authResult?.userId) {
        userId = authResult.userId;
      } else {
        const user = await currentUser();
        if (user?.id) userId = user.id;
      }
    } catch (authErr) {
      console.warn("[API:projects/upload/complete] Clerk auth notice:", authErr);
    }

    const body = await req.json();
    const {
      projectId,
      s3Key,
      s3Bucket,
      signedUrl: clientSignedUrl,
      autoAnalyze = true,
      aspectRatio = "9:16",
      clipLength = "30-60s",
      captionPreset = "hormozi",
    } = body;

    if (!projectId) {
      return NextResponse.json({ success: false, error: "Missing projectId" }, { status: 400 });
    }

    // Refresh authentic signed URL if needed
    let signedUrl = clientSignedUrl;
    if (s3Key && (!signedUrl || signedUrl.startsWith("blob:"))) {
      try {
        signedUrl = await generateSignedVideoUrl({ key: s3Key, bucket: s3Bucket });
      } catch (signErr) {
        console.warn("[API:projects/upload/complete] Presign error:", signErr);
      }
    }

    const updatePayload: any = {
      updatedAt: new Date(),
    };
    if (s3Key) updatePayload.s3Key = s3Key;
    if (s3Bucket) updatePayload.s3Bucket = s3Bucket;
    if (signedUrl) {
      updatePayload.signedUrl = signedUrl;
      updatePayload.sourceUrl = signedUrl;
    }

    if (autoAnalyze) {
      updatePayload.status = "processing";
      updatePayload.progress = 20;
      updatePayload.stage = "Video uploaded to AWS S3! Starting Deepgram speech transcription...";
    } else {
      updatePayload.status = "completed";
      updatePayload.progress = 100;
      updatePayload.stage = "Video uploaded successfully to AWS S3 storage";
    }

    await db.update(projects).set(updatePayload).where(eq(projects.id, projectId));

    if (autoAnalyze) {
      after(async () => {
        let dispatchedViaInngest = false;
        if (process.env.INNGEST_EVENT_KEY) {
          try {
            await inngest.send({
              name: "video/process.analyze",
              data: {
                projectId,
                userId,
                videoUrl: signedUrl,
                aspectRatio,
                clipLength,
                captionPreset,
              },
            });
            dispatchedViaInngest = true;
          } catch (inngestErr) {
            console.warn(
              `[API:projects/upload/complete] Inngest send error (${(inngestErr as Error)?.message}). Falling back to direct worker...`
            );
          }
        }

        if (!dispatchedViaInngest) {
          try {
            const { executeDirectAiAnalysis } = await import("@/lib/workers/upload-worker");
            await executeDirectAiAnalysis({
              projectId,
              userId,
              videoUrl: signedUrl,
              aspectRatio,
              clipLength,
              captionPreset,
            });
          } catch (workerErr) {
            console.error("[API:projects/upload/complete] Direct AI analysis worker error:", workerErr);
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      projectId,
      signedUrl,
    });
  } catch (error: unknown) {
    console.error("[API:projects/upload/complete] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || "Failed to complete upload",
      },
      { status: 500 }
    );
  }
}
