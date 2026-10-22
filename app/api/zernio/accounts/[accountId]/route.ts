import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, socialConnections } from "@/db";
import { and, eq } from "drizzle-orm";
import { isZernioConfigured, deleteZernioAccount } from "@/lib/zernio";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountId } = await params;
    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    // 1. Remove from local PostgreSQL database
    await db
      .delete(socialConnections)
      .where(
        and(
          eq(socialConnections.userId, userId),
          eq(socialConnections.accountId, accountId)
        )
      );

    // 2. Also remove by internal connection id if passed as id
    await db
      .delete(socialConnections)
      .where(
        and(
          eq(socialConnections.userId, userId),
          eq(socialConnections.id, accountId)
        )
      );

    // 3. If live Zernio is configured, delete remote account too
    if (isZernioConfigured() && !accountId.startsWith("demo_")) {
      try {
        await deleteZernioAccount(accountId);
      } catch (err: any) {
        console.warn("Failed to delete account on Zernio server:", err?.message || err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Account disconnected successfully",
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/zernio/accounts/[accountId]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to disconnect account" },
      { status: 500 }
    );
  }
}
