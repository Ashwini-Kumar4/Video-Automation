import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db, projects, shortVideos } from "@/db";
import { eq, or, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await currentUser();
    const userId = user?.id;

    const userProjects = await db
      .select()
      .from(projects)
      .where(
        userId
          ? or(eq(projects.userId, userId), eq(projects.userId, "guest_user"))
          : undefined
      )
      .orderBy(desc(projects.createdAt));

    // Fetch all short clips to map count to each project
    const allShorts = await db
      .select({
        id: shortVideos.id,
        projectId: shortVideos.projectId,
        title: shortVideos.title,
        videoUrl: shortVideos.videoUrl,
        duration: shortVideos.duration,
        seoScore: shortVideos.seoScore,
      })
      .from(shortVideos);

    const shortsByProject = allShorts.reduce<Record<string, typeof allShorts>>((acc, s) => {
      if (!acc[s.projectId]) acc[s.projectId] = [];
      acc[s.projectId].push(s);
      return acc;
    }, {});

    const enrichedProjects = userProjects.map((p) => {
      const pShorts = shortsByProject[p.id] || [];
      return {
        ...p,
        clipsCount: pShorts.length,
        previewClips: pShorts.slice(0, 3),
      };
    });

    return NextResponse.json({
      success: true,
      projects: enrichedProjects,
      total: enrichedProjects.length,
    });
  } catch (error: unknown) {
    console.error("[API:projects] Error listing projects:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || "Failed to list projects",
      },
      { status: 500 }
    );
  }
}
