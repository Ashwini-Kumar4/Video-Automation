import { NextRequest, NextResponse } from "next/server";
import { db, shortVideos } from "@/db";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Short ID is required" },
        { status: 400 }
      );
    }

    const rows = await db
      .select()
      .from(shortVideos)
      .where(eq(shortVideos.id, id))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Short video not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      short: rows[0],
    });
  } catch (error: unknown) {
    console.error("[API:shorts/[id]] Error fetching short:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || "Failed to fetch short video",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Short ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { captionPreset, captionStyle, title, hook, captions } = body;

    const updateData: {
      captionPreset?: string;
      captionStyle?: string;
      title?: string;
      hook?: string;
      captions?: string;
      exportUrl: null;
      renderStatus: string;
      renderProgress: number;
      renderStage: null;
      renderId: null;
      updatedAt: Date;
    } = {
      // Invalidate existing rendered export since the clip has been edited
      exportUrl: null,
      renderStatus: "idle",
      renderProgress: 0,
      renderStage: null,
      renderId: null,
      updatedAt: new Date(),
    };

    if (captionPreset !== undefined) {
      updateData.captionPreset = captionPreset;
    }

    if (captionStyle !== undefined) {
      updateData.captionStyle =
        typeof captionStyle === "string"
          ? captionStyle
          : JSON.stringify(captionStyle);
    }

    if (title !== undefined) {
      updateData.title = title;
    }

    if (hook !== undefined) {
      updateData.hook = hook;
    }

    if (captions !== undefined) {
      updateData.captions =
        typeof captions === "string" ? captions : JSON.stringify(captions);
    }

    const updated = await db
      .update(shortVideos)
      .set(updateData)
      .where(eq(shortVideos.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { success: false, error: "Short video not found to update" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Caption style saved successfully to database",
      short: updated[0],
    });
  } catch (error: unknown) {
    console.error("[API:shorts/[id]] Error updating short:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || "Failed to update caption style",
      },
      { status: 500 }
    );
  }
}
