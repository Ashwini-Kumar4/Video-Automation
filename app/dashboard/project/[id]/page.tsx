import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { db, projects, shortVideos } from "@/db";
import { eq } from "drizzle-orm";
import { ProjectDetailView } from "@/components/dashboard/ProjectDetailView";
import { Loader2, Sparkles } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}


export const metadata = {
  title: "AI Video Clips & Deepgram Transcription — VidShorts",
  description: "View AI generated short clips, Deepgram transcription, and timed kinetic captions.",
};

function ProjectLoadingSkeleton() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="size-14 rounded-2xl bg-gradient-to-tr from-violet-600/30 to-cyan-500/20 border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-500/10 backdrop-blur-md">
          <Loader2 className="size-7 text-cyan-400 animate-spin" />
        </div>
        <div className="absolute -top-1 -right-1 size-3 bg-violet-400 rounded-full animate-ping" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground tracking-wide flex items-center justify-center gap-1.5">
          <Sparkles className="size-4 text-violet-400" />
          Loading AI Studio Project...
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Fetching video details, transcription, and generated short clips
        </p>
      </div>
    </div>
  );
}

async function ProjectContent({ params }: PageProps) {
  await connection();
  const { id } = await params;

  if (!id) {
    notFound();
  }

  // Fetch project record from Neon Database
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  if (rows.length === 0) {
    // If not found in DB yet, construct default initial project state
    const placeholderProject = {
      id,
      userId: "guest_user",
      title: "Viral Video Short Clips Generation",
      originalFileName: "sample_video.mp4",
      fileSize: "184.5 MB",
      duration: "09:56",
      durationSeconds: 596,
      resolution: "1920x1080 Full HD",
      format: "MP4",
      aspectRatio: "9:16",
      clipLength: "30-60s",
      captionPreset: "hormozi",
      sourceType: "upload",
      sourceUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      status: "completed",
      progress: 100,
      stage: "AI analysis & transcription complete!",
      aiAnalysisStatus: "completed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return (
      <ProjectDetailView
        initialProject={placeholderProject as any}
        initialShorts={[]}
      />
    );
  }

  const project = rows[0];

  // Auto-refresh S3 signed URL if expired or missing
  let activeSignedUrl = project.signedUrl;
  const isExpired =
    !project.signedUrl ||
    !project.signedUrlExpiresAt ||
    new Date(project.signedUrlExpiresAt).getTime() < Date.now() + 60000;

  if (
    isExpired &&
    project.s3Key &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  ) {
    try {
      const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

      const s3Client = new S3Client({
        region: process.env.AWS_REGION || "ap-southeast-2",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });

      const getCommand = new GetObjectCommand({
        Bucket:
          project.s3Bucket ||
          process.env.AWS_BUCKET_NAME ||
          "vidshorts-uploads-ashwini",
        Key: project.s3Key,
      });

      activeSignedUrl = await getSignedUrl(s3Client, getCommand, {
        expiresIn: 604800,
      });
      const expiresAt = new Date(Date.now() + 604800 * 1000);

      await db
        .update(projects)
        .set({
          signedUrl: activeSignedUrl,
          signedUrlExpiresAt: expiresAt,
        })
        .where(eq(projects.id, id));

      project.signedUrl = activeSignedUrl;
      project.signedUrlExpiresAt = expiresAt;
    } catch (e) {
      console.warn("[ProjectPage] Failed to refresh signed URL:", e);
    }
  }

  // Fetch all saved shorts for this project from short_videos table
  const rawShorts = await db
    .select()
    .from(shortVideos)
    .where(eq(shortVideos.projectId, id));

  const serializedProject = {
    ...project,
    signedUrl: activeSignedUrl || project.signedUrl,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    signedUrlExpiresAt: project.signedUrlExpiresAt
      ? project.signedUrlExpiresAt.toISOString()
      : undefined,
  };

  const serializedShorts = rawShorts.map((s) => ({
    ...s,
    videoUrl: activeSignedUrl || s.videoUrl,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return (
    <ProjectDetailView
      initialProject={serializedProject as any}
      initialShorts={serializedShorts}
    />
  );
}

export default function ProjectPage({ params }: PageProps) {
  return (
    <Suspense fallback={<ProjectLoadingSkeleton />}>
      <ProjectContent params={params} />
    </Suspense>
  );
}
