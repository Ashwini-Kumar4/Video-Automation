import { NextResponse, connection } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db, socialConnections } from "@/db";
import { eq } from "drizzle-orm";
import {
  isZernioConfigured,
  getOrCreateZernioProfile,
  listZernioAccounts,
  ZERNIO_PLATFORMS,
} from "@/lib/zernio";

export async function GET() {
  await connection();
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const displayName =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.username ||
      user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
      "Creator";

    const configured = isZernioConfigured();

    // 1. Fetch any locally saved connections from PostgreSQL
    const localConnections = await db
      .select()
      .from(socialConnections)
      .where(eq(socialConnections.userId, userId));

    let zernioProfile: { profileId: string; name: string } | null = null;
    let liveAccounts: any[] = [];
    let apiError: string | null = null;

    // 2. If Zernio is configured, fetch live workspace profile and accounts
    if (configured) {
      try {
        zernioProfile = await getOrCreateZernioProfile(userId, displayName);
        liveAccounts = await listZernioAccounts(zernioProfile.profileId);

        // Auto-sync any live accounts from Zernio into Neon DB
        if (Array.isArray(liveAccounts) && liveAccounts.length > 0) {
          for (const live of liveAccounts) {
            const accId = live._id || live.id;
            const platform = live.platform;
            if (!accId || !platform) continue;

            const existsLocally = localConnections.some(
              (c) => c.accountId === accId || c.platform.toLowerCase() === platform.toLowerCase()
            );

            if (!existsLocally) {
              const username = live.username || live.handle || `@${platform}_user`;
              const formattedUsername = username.startsWith("@") ? username : `@${username}`;
              const newRec = {
                id: `conn_${platform}_${accId.slice(-8)}_${Date.now().toString(36)}`,
                userId,
                platform,
                accountId: accId,
                profileId: live.profileId || zernioProfile.profileId,
                username: formattedUsername,
                accountName: live.name || live.displayName || `${platform} Account`,
                avatarUrl: live.picture || live.avatar || live.profilePictureUrl || null,
                status: "connected",
                metadata: JSON.stringify(live),
              };

              try {
                await db.insert(socialConnections).values(newRec);
                localConnections.push(newRec as any);
              } catch (insertErr) {
                console.warn("Failed to auto-insert live account to DB:", insertErr);
              }
            }
          }
        }
      } catch (err: any) {
        console.warn("Zernio status query warning:", err?.message || err);
        apiError = err?.message || "Could not connect to Zernio API";
      }
    }

    return NextResponse.json({
      success: true,
      configured,
      profile: zernioProfile,
      localConnections,
      liveAccounts,
      apiError,
      supportedPlatformsCount: ZERNIO_PLATFORMS.length,
    });
  } catch (error: any) {
    console.error("Error in /api/zernio/status:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
