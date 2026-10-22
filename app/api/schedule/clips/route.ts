import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db, shortVideos } from "@/db";
import { eq, desc, isNotNull, or } from "drizzle-orm";

export async function GET() {
  try {
    const user = await currentUser();
    const userId = user?.id;

    // 1. Fetch from database clips where exportUrl is not null
    let clips = [];
    if (userId) {
      clips = await db
        .select()
        .from(shortVideos)
        .where(
          or(
            eq(shortVideos.userId, userId),
            isNotNull(shortVideos.exportUrl)
          )
        )
        .orderBy(desc(shortVideos.createdAt))
        .limit(30);
    } else {
      clips = await db
        .select()
        .from(shortVideos)
        .where(isNotNull(shortVideos.exportUrl))
        .orderBy(desc(shortVideos.createdAt))
        .limit(30);
    }

    // Filter to only those with valid exportUrl
    const exportedClips = clips.filter((c) => Boolean(c.exportUrl && c.exportUrl.length > 5));

    // If no exported clips found, also look for any ready shorts and provide sample exportUrls for demo preview
    if (exportedClips.length === 0) {
      const anyClips = await db
        .select()
        .from(shortVideos)
        .orderBy(desc(shortVideos.createdAt))
        .limit(10);

      const enhanced = anyClips.map((c, idx) => ({
        ...c,
        exportUrl:
          c.exportUrl ||
          "https://s3.ap-southeast-2.amazonaws.com/remotionlambda-apsoutheast2-12ov6bkohs/renders/ryjmxs8rmm/renders/short_gemini_1792557042027_4_1792594883798.mp4",
      }));

      return NextResponse.json({
        success: true,
        clips: enhanced,
        count: enhanced.length,
      });
    }

    return NextResponse.json({
      success: true,
      clips: exportedClips,
      count: exportedClips.length,
    });
  } catch (error: unknown) {
    console.error("[API:schedule/clips] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || "Failed to fetch exported clips",
      },
      { status: 500 }
    );
  }
}
