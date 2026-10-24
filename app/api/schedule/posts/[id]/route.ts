import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db, scheduledPosts } from "@/db";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await currentUser();
    const userId = user?.id;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Post ID is required" },
        { status: 400 }
      );
    }

    if (userId) {
      await db
        .delete(scheduledPosts)
        .where(
          and(eq(scheduledPosts.id, id), eq(scheduledPosts.userId, userId))
        );
    } else {
      await db.delete(scheduledPosts).where(eq(scheduledPosts.id, id));
    }

    return NextResponse.json({
      success: true,
      message: "Scheduled post removed successfully.",
    });
  } catch (error: unknown) {
    console.error("[API:schedule/posts/[id]:DELETE] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || "Failed to delete scheduled post",
      },
      { status: 500 }
    );
  }
}
