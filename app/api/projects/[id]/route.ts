import { NextRequest, NextResponse } from "next/server";
import { db, projects, shortVideos } from "@/db";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Project ID is required" },
        { status: 400 }
      );
    }

    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const project = rows[0];

    // Fetch all generated shorts for this project from short_videos table
    const projectShorts = await db
      .select()
      .from(shortVideos)
      .where(eq(shortVideos.projectId, id));

    return NextResponse.json(
      {
        success: true,
        project,
        shorts: projectShorts,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: unknown) {
    console.error("[API:projects/[id]] Error fetching project:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || "Failed to fetch project status",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Delete associated short videos and the project
    await db.delete(shortVideos).where(eq(shortVideos.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error: any) {
    console.error("[API:projects/[id]:DELETE] Error deleting project:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete project" },
      { status: 500 }
    );
  }
}
