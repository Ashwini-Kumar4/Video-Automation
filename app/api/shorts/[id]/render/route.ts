import { NextRequest, NextResponse } from "next/server";
import { db, shortVideos } from "@/db";
import { eq } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";
import { executeDirectRenderShortVideo } from "@/lib/remotion/render-worker";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/shorts/[id]/render
 * Returns current rendering progress, status, and export URL for polling
 */
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
      .select({
        id: shortVideos.id,
        projectId: shortVideos.projectId,
        title: shortVideos.title,
        status: shortVideos.status,
        exportUrl: shortVideos.exportUrl,
        videoUrl: shortVideos.videoUrl,
        renderStatus: shortVideos.renderStatus,
        renderProgress: shortVideos.renderProgress,
        renderStage: shortVideos.renderStage,
        captionPreset: shortVideos.captionPreset,
        updatedAt: shortVideos.updatedAt,
      })
      .from(shortVideos)
      .where(eq(shortVideos.id, id))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Short video not found" },
        { status: 404 }
      );
    }

    const short = rows[0];

    // Auto-recovery: If render has been stuck at <= 5% for more than 10 seconds,
    // trigger direct background render worker to unblock the UI!
    if (
      short.renderStatus === "rendering" &&
      (short.renderProgress || 0) <= 5 &&
      short.updatedAt &&
      Date.now() - new Date(short.updatedAt).getTime() > 10000
    ) {
      console.log(
        `[API:render] Short ${short.id} was stuck at ${short.renderProgress}%. Rescuing with direct worker...`
      );
      executeDirectRenderShortVideo({
        shortId: short.id,
        projectId: short.projectId,
      }).catch((err) => {
        console.error(`[API:render] Rescue worker error:`, err);
      });
    }

    return NextResponse.json({
      success: true,
      shortId: short.id,
      exportUrl: short.exportUrl,
      renderStatus: short.renderStatus || "idle",
      renderProgress: short.renderProgress || 0,
      renderStage: short.renderStage || "Ready",
      isRendered: Boolean(short.exportUrl),
    });
  } catch (error: unknown) {
    console.error("[API:shorts/[id]/render] GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || "Failed to check render status",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shorts/[id]/render
 * Triggers Remotion Lambda rendering workflow via Inngest with direct worker fallback.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
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

    const short = rows[0];

    // If exportUrl already exists, return immediately
    if (short.exportUrl) {
      return NextResponse.json({
        success: true,
        alreadyRendered: true,
        exportUrl: short.exportUrl,
        message: "Video is already rendered and ready for download.",
      });
    }

    // Check if an active render job is currently making real progress (> 5%)
    const isActivelyRendering =
      short.renderStatus === "rendering" &&
      (short.renderProgress || 0) > 5 &&
      short.updatedAt &&
      Date.now() - new Date(short.updatedAt).getTime() < 3 * 60 * 1000;

    if (isActivelyRendering) {
      return NextResponse.json({
        success: true,
        alreadyRunning: true,
        renderStatus: short.renderStatus,
        renderProgress: short.renderProgress || 10,
        renderStage: short.renderStage || "Rendering video frames on Lambda...",
      });
    }

    // Update state to rendering
    await db
      .update(shortVideos)
      .set({
        renderStatus: "rendering",
        renderProgress: 10,
        renderStage: "Connecting to Remotion Lambda rendering engine...",
        updatedAt: new Date(),
      })
      .where(eq(shortVideos.id, id));

    // Try sending event to Inngest first
    let dispatchedViaInngest = false;
    try {
      const sendResult = await inngest.send({
        name: "video/render.short",
        data: {
          shortId: short.id,
          projectId: short.projectId,
          userId: short.userId,
        },
      });
      console.log(`[API:shorts/render] Inngest event dispatched:`, sendResult);
      dispatchedViaInngest = true;
    } catch (inngestErr) {
      console.warn(
        `[API:shorts/render] Inngest Dev Server unavailable (${(inngestErr as Error)?.message}). Executing direct Lambda render worker fallback...`
      );
    }

    // If Inngest is offline or couldn't receive event, execute direct worker immediately
    if (!dispatchedViaInngest) {
      executeDirectRenderShortVideo({
        shortId: short.id,
        projectId: short.projectId,
        userId: short.userId,
      }).catch((err) => {
        console.error(`[API:shorts/render] Direct render error:`, err);
      });
    }

    return NextResponse.json({
      success: true,
      message: "Rendering job queued successfully",
      renderStatus: "rendering",
      renderProgress: 10,
      renderStage: "Connecting to Remotion Lambda rendering engine...",
    });
  } catch (error: unknown) {
    console.error("[API:shorts/[id]/render] POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || "Failed to initiate video render",
      },
      { status: 500 }
    );
  }
}
