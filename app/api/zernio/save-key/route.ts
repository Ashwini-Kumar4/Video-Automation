import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const apiKey = (body.apiKey || "").trim();

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key cannot be empty" },
        { status: 400 }
      );
    }

    if (!apiKey.startsWith("sk_")) {
      return NextResponse.json(
        { error: "Invalid Zernio API key format. A valid key starts with 'sk_'" },
        { status: 400 }
      );
    }

    if (apiKey.includes("...")) {
      return NextResponse.json(
        {
          error:
            "You copied a masked preview key containing dots '...'. In your Zernio dashboard, click '+ Create API Key' and copy the full key from the popup modal before closing it.",
        },
        { status: 400 }
      );
    }

    // Verify key with Zernio live API
    try {
      const verifyRes = await fetch("https://zernio.com/api/v1/accounts", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (verifyRes.status === 401) {
        return NextResponse.json(
          {
            error:
              "Zernio returned 401: Invalid, revoked or expired API key. Please generate a new key in Zernio and copy it.",
          },
          { status: 400 }
        );
      }
    } catch (e: any) {
      console.warn("Could not verify key live with Zernio:", e?.message);
    }

    // Update in memory for immediate use
    process.env.ZERNIO_API_KEY = apiKey;

    // Update in .env.local file
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, "utf-8");
      if (/ZERNIO_API_KEY=.*/.test(envContent)) {
        envContent = envContent.replace(
          /ZERNIO_API_KEY=.*/,
          `ZERNIO_API_KEY=${apiKey}`
        );
      } else {
        envContent += `\nZERNIO_API_KEY=${apiKey}\n`;
      }
      fs.writeFileSync(envPath, envContent, "utf-8");
    }

    return NextResponse.json({
      success: true,
      message: "Zernio API Key saved and activated successfully!",
    });
  } catch (error: any) {
    console.error("Error saving Zernio API key:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save API key" },
      { status: 500 }
    );
  }
}
