import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, socialConnections } from "@/db";
import { and, eq } from "drizzle-orm";
import { isZernioConfigured, listZernioAccounts } from "@/lib/zernio";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Zernio can return either `connected=linkedin` or `platform=linkedin`
  const platform =
    searchParams.get("connected") ||
    searchParams.get("platform") ||
    searchParams.get("network") ||
    "unknown";

  let accountId =
    searchParams.get("accountId") ||
    searchParams.get("account_id") ||
    searchParams.get("id");

  const profileId =
    searchParams.get("profileId") ||
    searchParams.get("profile_id");

  let username =
    searchParams.get("username") ||
    searchParams.get("handle") ||
    searchParams.get("name") ||
    "";

  let accountName = searchParams.get("name") || username || "";
  let avatarUrl: string | null = null;

  const uidParam = searchParams.get("uid");
  const returnTo = searchParams.get("returnTo") || "/dashboard/social-connections";
  const error = searchParams.get("error");
  const errorMessage = searchParams.get("error_message");

  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "localhost:3000";
  const proto =
    req.headers.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;

  // If OAuth failed or was cancelled by user
  if (error) {
    console.error("Zernio OAuth callback error:", error, errorMessage);
    return NextResponse.redirect(
      `${baseUrl}${returnTo}?status=error&message=${encodeURIComponent(
        errorMessage || error
      )}&platform=${platform}`
    );
  }

  try {
    // 1. Resolve User ID (from Clerk session, or preserved uidParam from OAuth state)
    let effectiveUserId: string | null = null;
    try {
      const authResult = await auth();
      effectiveUserId = authResult.userId;
    } catch (e) {
      console.warn("Clerk auth session read warning in callback:", e);
    }

    if (!effectiveUserId && uidParam) {
      effectiveUserId = decodeURIComponent(uidParam);
    }

    // 2. If Zernio is configured, retrieve fresh account details from Zernio
    if (isZernioConfigured()) {
      try {
        const liveAccounts = await listZernioAccounts(profileId || undefined);
        const matching = liveAccounts.find(
          (acc: any) =>
            (accountId && (acc._id === accountId || acc.id === accountId)) ||
            (platform && acc.platform?.toLowerCase() === platform.toLowerCase())
        );

        if (matching) {
          accountId = matching._id || matching.id || accountId;
          username = matching.username || matching.handle || username;
          accountName = matching.name || matching.displayName || accountName || username;
          avatarUrl = matching.picture || matching.avatar || matching.profilePictureUrl || null;
        }
      } catch (err: any) {
        console.warn("Could not fetch supplementary account details from Zernio:", err?.message || err);
      }
    }

    // Ensure fallback identifiers
    const finalAccountId = accountId || `acc_${platform}_${Date.now().toString(36)}`;
    const finalUsername = username ? (username.startsWith("@") ? username : `@${username}`) : `@${platform}_creator`;
    const finalAccountName = accountName || `${platform.charAt(0).toUpperCase() + platform.slice(1)} Account`;

    // 3. Save / Upsert to PostgreSQL database if we have a user ID
    if (effectiveUserId) {
      const existing = await db
        .select()
        .from(socialConnections)
        .where(
          and(
            eq(socialConnections.userId, effectiveUserId),
            eq(socialConnections.platform, platform),
            eq(socialConnections.accountId, finalAccountId)
          )
        );

      if (existing.length > 0) {
        await db
          .update(socialConnections)
          .set({
            profileId: profileId || existing[0].profileId,
            username: finalUsername,
            accountName: finalAccountName,
            avatarUrl: avatarUrl || existing[0].avatarUrl,
            status: "connected",
            metadata: JSON.stringify(Object.fromEntries(searchParams.entries())),
            updatedAt: new Date(),
          })
          .where(eq(socialConnections.id, existing[0].id));
      } else {
        await db.insert(socialConnections).values({
          id: `conn_${platform}_${finalAccountId.slice(-8)}_${Date.now().toString(36)}`,
          userId: effectiveUserId,
          platform,
          accountId: finalAccountId,
          profileId: profileId || null,
          username: finalUsername,
          accountName: finalAccountName,
          avatarUrl: avatarUrl || null,
          status: "connected",
          metadata: JSON.stringify(Object.fromEntries(searchParams.entries())),
        });
      }
    }

    // 4. ALWAYS jump back to the main app page (social connection page) and NOT Zernio dashboard!
    return NextResponse.redirect(
      `${baseUrl}${returnTo}?status=connected&platform=${platform}&username=${encodeURIComponent(
        finalUsername
      )}&accountId=${encodeURIComponent(finalAccountId)}`
    );
  } catch (err: any) {
    console.error("Failed to persist connected social account in callback:", err);
    return NextResponse.redirect(
      `${baseUrl}${returnTo}?status=connected&platform=${platform}&warning=db_sync_partial`
    );
  }
}
