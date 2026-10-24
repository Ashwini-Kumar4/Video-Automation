import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db, scheduledPosts } from "@/db";
import { inngest } from "@/lib/inngest/client";
import { eq, desc, asc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await currentUser();
    const userId = user?.id || "default_user";

    // Fetch scheduled posts
    const posts = await db
      .select()
      .from(scheduledPosts)
      .where(eq(scheduledPosts.userId, userId))
      .orderBy(asc(scheduledPosts.scheduledAt));

    // If user has no posts in DB yet, check if there are any demo posts or return empty
    return NextResponse.json({
      success: true,
      posts,
      count: posts.length,
    });
  } catch (error: any) {
    console.error("[API:schedule/posts:GET] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch scheduled posts",
        stack: error?.stack,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    const userId = user?.id || "default_user";
    const body = await req.json();

    const {
      shortId,
      title,
      caption,
      platforms,
      accountIds,
      videoUrl,
      scheduledDate,
      scheduledTime,
      hashtags,
      thumbnailUrl,
    } = body;

    if (!title || !caption || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        {
          success: false,
          error: "Title, caption, scheduled date, and scheduled time are required.",
        },
        { status: 400 }
      );
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
    const now = new Date();

    // Enforce that scheduled date/time cannot be in the past
    if (scheduledDateTime.getTime() <= now.getTime()) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot schedule a post in the past. Please select a future date and time.",
        },
        { status: 400 }
      );
    }

    const postId = `sched_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const newPost = {
      id: postId,
      userId,
      shortId: shortId || null,
      title: title.trim(),
      caption: caption.trim(),
      platforms: JSON.stringify(platforms || ["youtube", "tiktok", "instagram"]),
      accountIds: JSON.stringify(accountIds || []),
      videoUrl: videoUrl || null,
      scheduledDate,
      scheduledTime,
      scheduledAt: scheduledDateTime,
      status: "scheduled",
      hashtags: hashtags ? (Array.isArray(hashtags) ? hashtags.join(" ") : hashtags) : null,
      thumbnailUrl: thumbnailUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save scheduled post to Database
    await db.insert(scheduledPosts).values(newPost);

    // If scheduled within the next 15 minutes, trigger Inngest check immediately
    const diffMs = scheduledDateTime.getTime() - now.getTime();
    if (diffMs <= 15 * 60 * 1000) {
      try {
        await inngest.send({
          name: "social/posts.check-and-publish",
          data: { postId, scheduledAt: scheduledDateTime.toISOString() },
        });
        console.log(`[Schedule:POST] Inngest event triggered for upcoming post: ${postId}`);
      } catch (inngestErr) {
        console.warn("Failed to dispatch inngest trigger event:", inngestErr);
      }
    }

    return NextResponse.json({
      success: true,
      post: newPost,
      message: "Post successfully scheduled and saved to database!",
    });
  } catch (error: unknown) {
    console.error("[API:schedule/posts:POST] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || "Failed to schedule post",
      },
      { status: 500 }
    );
  }
}
