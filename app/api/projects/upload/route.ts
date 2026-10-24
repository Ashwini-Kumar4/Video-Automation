import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db, projects } from "@/db";
import { eq } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";
import { protectVideoUpload, getUserDailyUploadStats } from "@/lib/arcjet";
import fs from "fs/promises";
import path from "path";
import { executeDirectUploadAndAnalysis } from "@/lib/workers/upload-worker";
import {
  generatePresignedUploadUrl,
  generateSignedVideoUrl,
  getS3Config,
} from "@/lib/aws/s3";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET: Returns the user's current daily video upload quota stats.
 * Max 2 videos per day, resets next day (midnight UTC).
 */
export async function GET(req: NextRequest) {
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
      console.warn("[API:projects/upload:GET] Clerk auth notice:", authErr);
    }

    const stats = await getUserDailyUploadStats(userId);

    return NextResponse.json({
      success: true,
      userId,
      ...stats,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || "Failed to retrieve upload quota",
      },
      { status: 500 }
    );
  }
}

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
      console.warn("[API:projects/upload] Clerk auth notice:", authErr);
    }

    const contentType = req.headers.get("content-type") || "";

    let fileName = "video.mp4";
    let fileType = "video/mp4";
    let fileSize = "0 MB";
    let fileSizeBytes = 0;
    let tempFilePath: string | undefined;
    let videoUrl: string | undefined;
    let duration = "03:45";
    let durationSeconds = 225;
    let resolution = "1920x1080 (HD)";
    let format = "MP4";
    let aspectRatio = "9:16";
    let clipLength = "30-60s";
    let captionPreset = "hormozi";
    let sourceType: "upload" | "sample" | "url" = "upload";
    let title = "Untitled Video";
    let isPresign = false;

    // Generate unique project ID upfront so all staged assets and logs correlate to it
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      title = (formData.get("title") as string) || (file ? file.name : "Untitled Video");
      duration = (formData.get("duration") as string) || duration;
      durationSeconds = parseInt((formData.get("durationSeconds") as string) || "225", 10);
      resolution = (formData.get("resolution") as string) || resolution;
      format = (formData.get("format") as string) || format;
      aspectRatio = (formData.get("aspectRatio") as string) || aspectRatio;
      clipLength = (formData.get("clipLength") as string) || clipLength;
      captionPreset = (formData.get("captionPreset") as string) || captionPreset;
      sourceType = ((formData.get("sourceType") as string) || "upload") as "upload" | "sample" | "url";
      videoUrl = (formData.get("videoUrl") as string) || undefined;

      if (file && file.size > 0) {
        fileName = file.name;
        fileType = file.type || "video/mp4";
        fileSizeBytes = file.size;
        fileSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

        // Stage file in local temp folder for Inngest worker step
        const tempDir = path.join(process.cwd(), ".temp_uploads");
        await fs.mkdir(tempDir, { recursive: true });

        const safeName = `${projectId}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        tempFilePath = path.join(tempDir, safeName);

        const arrayBuffer = await file.arrayBuffer();
        await fs.writeFile(tempFilePath, Buffer.from(arrayBuffer));
      } else if (videoUrl) {
        fileName = title || "Sample_Video.mp4";
      }
    } else {
      // JSON body (e.g. for URL or sample video upload, or direct S3 presigned upload)
      const body = await req.json();
      isPresign = body.action === "presign" || (body.sourceType === "upload" && !body.videoUrl);
      title = body.title || "Untitled Video";
      fileName = body.fileName || title || "video.mp4";
      fileType = body.fileType || "video/mp4";
      fileSize = body.fileSize || "184.5 MB";
      fileSizeBytes = body.fileSizeBytes || 184500000;
      videoUrl = body.videoUrl;
      duration = body.duration || duration;
      durationSeconds = body.durationSeconds || durationSeconds;
      resolution = body.resolution || resolution;
      format = body.format || format;
      aspectRatio = body.aspectRatio || aspectRatio;
      clipLength = body.clipLength || clipLength;
      captionPreset = body.captionPreset || captionPreset;
      sourceType = body.sourceType || "sample";
    }

    // Arcjet Rate Limiting & AI Security (2 videos/day, prompt injection, bot abuse)
    const textToScan = [title, fileName].filter(Boolean).join(" ");
    const securityCheck = await protectVideoUpload(req, {
      userId,
      textToScan,
    });

    if (!securityCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: securityCheck.error,
          reason: securityCheck.reason,
          details: securityCheck.details,
          isArcjetError: true,
        },
        { status: securityCheck.status || 403 }
      );
    }

    // Direct Client-to-S3 Presigned Upload (bypasses Vercel 4.5MB serverless payload limit)
    if (isPresign) {
      const s3Config = getS3Config();
      const safeFileName = (fileName || "video.mp4").replace(/[^a-zA-Z0-9._-]/g, "_");
      const s3Key = `users/${userId}/projects/${projectId}/${Date.now()}_${safeFileName}`;
      const contentTypeToUse = fileType || "video/mp4";

      const { uploadUrl, bucket } = await generatePresignedUploadUrl({
        key: s3Key,
        contentType: contentTypeToUse,
      });

      const signedUrl = await generateSignedVideoUrl({
        key: s3Key,
        bucket,
      });
      const s3Url = `https://${bucket}.s3.${s3Config.region}.amazonaws.com/${s3Key}`;

      const [newProject] = await db
        .insert(projects)
        .values({
          id: projectId,
          userId,
          title: title || fileName,
          originalFileName: fileName,
          fileSize,
          fileSizeBytes,
          duration,
          durationSeconds,
          resolution,
          format,
          aspectRatio,
          clipLength,
          captionPreset,
          sourceType: "upload",
          s3Key,
          s3Bucket: bucket,
          s3Url,
          signedUrl,
          sourceUrl: signedUrl,
          status: "uploading",
          progress: 15,
          stage: "Uploading video directly to AWS S3 storage...",
        })
        .returning();

      return NextResponse.json({
        success: true,
        projectId,
        uploadUrl,
        s3Key,
        s3Bucket: bucket,
        signedUrl,
        s3Url,
        project: newProject,
      });
    }

    // Create project record in Neon PostgreSQL Database
    const [newProject] = await db
      .insert(projects)
      .values({
        id: projectId,
        userId,
        title: title || fileName,
        originalFileName: fileName,
        fileSize,
        fileSizeBytes,
        duration,
        durationSeconds,
        resolution,
        format,
        aspectRatio,
        clipLength,
        captionPreset,
        sourceType,
        sourceUrl: videoUrl || `/api/projects/${projectId}/stream`,
        signedUrl: `/api/projects/${projectId}/stream`,
        status: "queued",
        progress: 10,
        stage: "Queued for AWS S3 upload pipeline...",
      })
      .returning();

    // Trigger Inngest background workflow with direct fallback
    let inngestEventId = "";
    let dispatchedViaInngest = false;
    try {
      const sendResult = await inngest.send({
        name: "video/process.upload",
        data: {
          projectId,
          userId,
          fileName,
          fileType,
          fileSize,
          fileSizeBytes,
          tempFilePath,
          videoUrl,
          duration,
          durationSeconds,
          resolution,
          format,
          aspectRatio,
          clipLength,
          captionPreset,
          sourceType,
        },
      });
      inngestEventId = sendResult?.ids?.[0] || "";
      dispatchedViaInngest = true;

      // Store inngestEventId in DB
      if (inngestEventId) {
        await db
          .update(projects)
          .set({ inngestEventId })
          .where(eq(projects.id, projectId));
      }
    } catch (inngestErr) {
      console.warn(
        `[API:projects/upload] Inngest dev server offline (${(inngestErr as Error)?.message}). Executing direct background upload & AI analysis worker...`
      );
    }

    if (!dispatchedViaInngest) {
      // Execute direct worker in background so user upload never fails
      executeDirectUploadAndAnalysis({
        projectId,
        userId,
        fileName,
        fileType,
        fileSize,
        fileSizeBytes,
        tempFilePath,
        videoUrl,
        duration,
        durationSeconds,
        resolution,
        format,
        aspectRatio,
        clipLength,
        captionPreset,
        sourceType,
      }).catch((workerErr) => {
        console.error(`[API:projects/upload] Direct worker error:`, workerErr);
      });
    }

    return NextResponse.json({
      success: true,
      projectId,
      inngestEventId,
      project: newProject,
    });
  } catch (error: unknown) {
    console.error("[API:projects/upload] Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || "Failed to initiate video upload",
      },
      { status: 500 }
    );
  }
}
