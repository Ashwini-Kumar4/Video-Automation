import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db, socialConnections } from "@/db";
import { ZERNIO_PLATFORMS, ZernioPlatform } from "@/lib/zernio";

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
      "Creator";

    const body = await req.json().catch(() => ({}));
    const { platform } = body as { platform: ZernioPlatform };

    const platformInfo = ZERNIO_PLATFORMS.find((p) => p.id === platform);
    if (!platformInfo) {
      return NextResponse.json(
        { error: "Invalid platform requested" },
        { status: 400 }
      );
    }

    const demoAccountId = `demo_${platform}_${Date.now().toString(36)}`;
    const demoHandle = `@${displayName.toLowerCase().replace(/\s+/g, "_")}_${platform}`;

    const newConnection = {
      id: `conn_${platform}_${Date.now()}`,
      userId,
      platform,
      accountId: demoAccountId,
      profileId: "demo_profile_default",
      accountName: `${displayName} (${platformInfo.name})`,
      username: demoHandle,
      avatarUrl: user?.imageUrl || null,
      status: "connected",
      metadata: JSON.stringify({
        isDemo: true,
        connectedAt: new Date().toISOString(),
        platformName: platformInfo.name,
      }),
    };

    await db.insert(socialConnections).values(newConnection);

    return NextResponse.json({
      success: true,
      message: `${platformInfo.name} connected successfully!`,
      connection: newConnection,
    });
  } catch (error: any) {
    console.error("Error in /api/zernio/demo-connect:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create demo connection" },
      { status: 500 }
    );
  }
}
