import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  isZernioConfigured,
  getOrCreateZernioProfile,
  getPlatformConnectUrl,
  ZernioPlatform,
  ZERNIO_PLATFORMS,
} from "@/lib/zernio";

export async function POST(req: NextRequest) {
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

    const body = await req.json().catch(() => ({}));
    const { platform } = body;

    if (!platform) {
      return NextResponse.json(
        { error: "Platform parameter is required" },
        { status: 400 }
      );
    }

    // Validate platform is supported
    const isValidPlatform = ZERNIO_PLATFORMS.some((p) => p.id === platform);
    if (!isValidPlatform) {
      return NextResponse.json(
        { error: `Platform '${platform}' is not supported by Zernio.` },
        { status: 400 }
      );
    }

    if (!isZernioConfigured()) {
      return NextResponse.json(
        {
          configured: false,
          error:
            "ZERNIO_API_KEY is not configured in .env.local. Please create an API key at https://zernio.com/dashboard/api-keys and add it to .env.local",
        },
        { status: 400 }
      );
    }

    const bodyOrigin = body?.origin;
    // Derive base URL for redirect callback
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const baseUrl = bodyOrigin || `${proto}://${host}`;
    const redirectUrl = `${baseUrl}/api/zernio/callback?uid=${encodeURIComponent(userId)}&returnTo=${encodeURIComponent("/dashboard/social-connections")}`;

    // 1. Get or create Zernio workspace profile for user
    const profile = await getOrCreateZernioProfile(userId, displayName);

    // 2. Request official OAuth Connect URL from Zernio
    const connectData = await getPlatformConnectUrl({
      platform: platform as ZernioPlatform,
      profileId: profile.profileId,
      redirectUrl,
      brandName: "VidShorts AI",
    });

    return NextResponse.json({
      success: true,
      authUrl: connectData.authUrl,
      profileId: profile.profileId,
      platform,
    });
  } catch (error: any) {
    console.error("Error in /api/zernio/connect:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to generate social connection URL",
        code: error?.code,
        details: error?.details,
      },
      { status: 500 }
    );
  }
}
