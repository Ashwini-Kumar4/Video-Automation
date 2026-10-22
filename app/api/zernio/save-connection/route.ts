import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, socialConnections } from "@/db";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { platform, accountId, username, profileId, accountName, avatarUrl } = body;

    if (!platform || !accountId) {
      return NextResponse.json(
        { error: "Platform and AccountId are required" },
        { status: 400 }
      );
    }

    const formattedUsername = username
      ? username.startsWith("@")
        ? username
        : `@${username}`
      : `@${platform}_user`;

    const existing = await db
      .select()
      .from(socialConnections)
      .where(
        and(
          eq(socialConnections.userId, userId),
          eq(socialConnections.platform, platform),
          eq(socialConnections.accountId, accountId)
        )
      );

    if (existing.length > 0) {
      await db
        .update(socialConnections)
        .set({
          profileId: profileId || existing[0].profileId,
          username: formattedUsername,
          accountName: accountName || existing[0].accountName,
          avatarUrl: avatarUrl || existing[0].avatarUrl,
          status: "connected",
          updatedAt: new Date(),
        })
        .where(eq(socialConnections.id, existing[0].id));
    } else {
      await db.insert(socialConnections).values({
        id: `conn_${platform}_${accountId.slice(-8)}_${Date.now().toString(36)}`,
        userId,
        platform,
        accountId,
        profileId: profileId || null,
        username: formattedUsername,
        accountName: accountName || `${platform} Account`,
        avatarUrl: avatarUrl || null,
        status: "connected",
        metadata: JSON.stringify(body),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Account connection saved to database",
    });
  } catch (error: any) {
    console.error("Error in /api/zernio/save-connection:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save connection" },
      { status: 500 }
    );
  }
}
