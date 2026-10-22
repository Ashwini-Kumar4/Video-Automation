import { NextRequest, NextResponse } from "next/server";
import { db, projects } from "@/db";
import { eq } from "drizzle-orm";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Finds the local staged video file for a project in .temp_uploads.
 */
function findLocalFileForProject(projectId: string, originalFileName?: string | null): string | null {
  const tempDir = path.join(process.cwd(), ".temp_uploads");
  if (!fs.existsSync(tempDir)) return null;

  const files = fs.readdirSync(tempDir);
  // 1. Direct match with projectId
  const projectMatch = files.find((f) => f.includes(projectId));
  if (projectMatch) return path.join(tempDir, projectMatch);

  // 2. Match sanitized original file name
  if (originalFileName) {
    const safeName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const nameMatch = files.find((f) => f.includes(safeName));
    if (nameMatch) return path.join(tempDir, nameMatch);
  }

  // 3. Single .mp4 fallback if only one file exists in .temp_uploads
  const mp4Files = files.filter((f) => f.endsWith(".mp4"));
  if (mp4Files.length === 1) {
    return path.join(tempDir, mp4Files[0]);
  }

  return null;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return new NextResponse("Project ID required", { status: 400 });
    }

    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (rows.length === 0) {
      return new NextResponse("Project not found", { status: 404 });
    }

    const project = rows[0];

    // 1. Check if the authentic uploaded video is available locally in .temp_uploads
    const localFilePath = findLocalFileForProject(id, project.originalFileName);
    if (localFilePath && fs.existsSync(localFilePath)) {
      const stat = fs.statSync(localFilePath);
      const fileSize = stat.size;
      const range = req.headers.get("range");

      if (range) {
        // HTTP 206 Partial Content for video seeking and smooth scrubbing
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize || end >= fileSize) {
          return new NextResponse("Requested range not satisfiable", {
            status: 416,
            headers: {
              "Content-Range": `bytes */${fileSize}`,
            },
          });
        }

        const chunkSize = end - start + 1;
        const nodeStream = fs.createReadStream(localFilePath, { start, end });
        const webStream = Readable.toWeb(nodeStream) as ReadableStream;

        return new Response(webStream, {
          status: 206,
          headers: {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunkSize.toString(),
            "Content-Type": "video/mp4",
            "Cache-Control": "public, max-age=3600",
          },
        });
      } else {
        // HTTP 200 Full Content
        const nodeStream = fs.createReadStream(localFilePath);
        const webStream = Readable.toWeb(nodeStream) as ReadableStream;

        return new Response(webStream, {
          status: 200,
          headers: {
            "Accept-Ranges": "bytes",
            "Content-Length": fileSize.toString(),
            "Content-Type": "video/mp4",
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    }

    // 2. If not local, try AWS S3 presigned redirect
    const s3Key = project.s3Key;
    const bucket = project.s3Bucket || process.env.AWS_BUCKET_NAME || "vidshorts-uploads-ashwini";
    const region = process.env.AWS_REGION || "ap-southeast-2";
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (s3Key && accessKeyId && secretAccessKey) {
      const s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: s3Key,
      });

      try {
        const presignedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 7200 });
        return NextResponse.redirect(presignedUrl, {
          status: 307,
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (s3Err) {
        console.warn("[Stream API] S3 presign failed, falling back to signed/source URL:", s3Err);
      }
    }

    // 3. Fallback: If signedUrl or sourceUrl exists (and is not self), redirect
    let targetUrl: string | null | undefined = project.signedUrl || project.s3Url || project.sourceUrl;
    if (targetUrl && targetUrl.includes(`/api/projects/${id}/stream`)) {
      targetUrl = null;
    }

    if (!targetUrl) {
      targetUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    }

    return NextResponse.redirect(targetUrl, 307);
  } catch (error: any) {
    console.error("[Stream API] Error streaming video:", error);
    return new NextResponse(error?.message || "Internal streaming error", { status: 500 });
  }
}

