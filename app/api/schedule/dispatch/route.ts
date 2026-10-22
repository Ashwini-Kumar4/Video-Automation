import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { inngest } from "@/lib/inngest/client";
import { db, scheduledPosts } from "@/db";
import { eq, and, lte, gte } from "drizzle-orm";

/**
 * Endpoint to manually trigger or inspect the 15-minute Inngest social post scheduler.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    const userId = user?.id;

    // Trigger Inngest function
    await inngest.send({
      name: "social/posts.check-and-publish",
      data: {
        triggeredBy: userId || "manual_trigger",
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Inngest social media post check-and-publish function triggered successfully.",
    });
  } catch (error: any) {
    console.error("[API:schedule/dispatch:POST] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to trigger Inngest function",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const now = new Date();
    const next15Min = new Date(now.getTime() + 15 * 60 * 1000);
    const upcomingPosts = await db
      .select()
      .from(scheduledPosts)
      .where(
        and(
          eq(scheduledPosts.status, "scheduled"),
          lte(scheduledPosts.scheduledAt, next15Min)
        )
      );

    return NextResponse.json({
      success: true,
      window: {
        now: now.toISOString(),
        next15Min: next15Min.toISOString(),
      },
      upcomingPostsCount: upcomingPosts.length,
      upcomingPosts,
    });
  } catch (error: any) {
    console.error("[API:schedule/dispatch:GET] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to query upcoming posts",
      },
      { status: 500 }
    );
  }
}
