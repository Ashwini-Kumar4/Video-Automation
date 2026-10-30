import arcjet, {
  shield,
  detectBot,
  fixedWindow,
  detectPromptInjection,
  sensitiveInfo,
} from "@arcjet/next";
import { NextRequest } from "next/server";
import { db, projects } from "@/db";
import { and, eq, gte, sql } from "drizzle-orm";

/**
 * Rate limit toggle for video uploads.
 * Trial mode: Set to false so limits are not enforced during testing/trial.
 * Whenever the user asks to enforce a limit, set ENFORCE_DAILY_LIMIT = true.
 */
export const ENFORCE_DAILY_LIMIT = false;

/**
 * Maximum video uploads allowed per user per day when ENFORCE_DAILY_LIMIT is true.
 * Resets each new calendar day (midnight UTC).
 */
export const DAILY_UPLOAD_LIMIT = 2;

const ARCJET_KEY =
  process.env.ARCJET_KEY ||
  process.env.NEXT_PUBLIC_ARCJET_KEY ||
  "ajkey_placeholder_dev";

/**
 * Arcjet client for video upload endpoints.
 * Protects against:
 * 1. AI Abuse & Web Attacks via Shield WAF
 * 2. Automated bots inflating infrastructure & AI costs
 * 3. Daily Rate Limiting: Max 2 video uploads per day per user (only when enabled)
 * 4. Prompt Injection detection in video title, prompts, and instructions
 * 5. Sensitive PII leaks (e.g. Credit Card Numbers)
 */
export const videoUploadArcjet = arcjet({
  key: ARCJET_KEY,
  characteristics: ["userId"],
  rules: [
    // 1. Shield WAF: Guards against common web attacks, XSS, and SQL injection
    shield({
      mode: "LIVE",
    }),

    // 2. Bot Protection: Blocks automated scrapers and bots in production
    detectBot({
      mode: process.env.NODE_ENV === "production" ? "LIVE" : "DRY_RUN",
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW", "CATEGORY:MONITOR"],
    }),

    // 3. Fixed Window Rate Limiting: Active only when ENFORCE_DAILY_LIMIT is true
    ...(ENFORCE_DAILY_LIMIT
      ? [
          fixedWindow({
            mode: "LIVE",
            window: "1d",
            max: DAILY_UPLOAD_LIMIT,
          }),
        ]
      : []),

    // 4. Prompt Injection Detection: Set to DRY_RUN on upload so video titles do not cause false-positive blocks.
    // Live detection is strictly enforced downstream on actual AI prompt endpoints (aiEndpointArcjet).
    detectPromptInjection({
      mode: "DRY_RUN",
    }),

    // 5. Sensitive Information redaction/block
    sensitiveInfo({
      mode: "LIVE",
      deny: ["CREDIT_CARD_NUMBER"],
    }),
  ],
});

/**
 * Arcjet client for dedicated AI endpoints (e.g. short generation, analysis).
 * Enforces Prompt Injection Detection, Shield WAF, and Bot Abuse Protection.
 */
export const aiEndpointArcjet = arcjet({
  key: ARCJET_KEY,
  characteristics: ["userId"],
  rules: [
    shield({
      mode: "LIVE",
    }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR"],
    }),
    detectPromptInjection({
      mode: "LIVE",
    }),
  ],
});

/**
 * Lightweight Arcjet client for App Middleware.
 * Provides application-wide Shield WAF and Bot Detection across pages & API routes.
 */
export const appMiddlewareArcjet = arcjet({
  key: ARCJET_KEY,
  rules: [
    shield({
      mode: "LIVE",
    }),
    detectBot({
      mode: process.env.NODE_ENV === "production" ? "LIVE" : "DRY_RUN",
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW", "CATEGORY:MONITOR"],
    }),
  ],
});

/**
 * Computes user's daily upload count from database since 00:00:00 UTC today.
 */
export async function getUserDailyUploadStats(userId: string): Promise<{
  uploadsToday: number;
  remaining: number;
  maxAllowed: number;
  resetsAt: Date;
  canUpload: boolean;
  enforceLimit: boolean;
}> {
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const resetsAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));

  try {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(
        and(
          eq(projects.userId, userId),
          gte(projects.createdAt, startOfDay)
        )
      );

    const uploadsToday = result[0]?.count || 0;
    const remaining = ENFORCE_DAILY_LIMIT ? Math.max(0, DAILY_UPLOAD_LIMIT - uploadsToday) : 9999;

    return {
      uploadsToday,
      remaining,
      maxAllowed: ENFORCE_DAILY_LIMIT ? DAILY_UPLOAD_LIMIT : 9999,
      resetsAt,
      canUpload: ENFORCE_DAILY_LIMIT ? remaining > 0 : true,
      enforceLimit: ENFORCE_DAILY_LIMIT,
    };
  } catch (error) {
    console.warn("[Arcjet:DB] Failed to query daily upload stats, failing safe:", error);
    return {
      uploadsToday: 0,
      remaining: ENFORCE_DAILY_LIMIT ? DAILY_UPLOAD_LIMIT : 9999,
      maxAllowed: ENFORCE_DAILY_LIMIT ? DAILY_UPLOAD_LIMIT : 9999,
      resetsAt,
      canUpload: true,
      enforceLimit: ENFORCE_DAILY_LIMIT,
    };
  }
}

export interface SecurityCheckResult {
  allowed: boolean;
  status?: number;
  error?: string;
  reason?: "RATE_LIMIT" | "PROMPT_INJECTION" | "BOT_DETECTED" | "SHIELD_BLOCKED" | "SENSITIVE_INFO" | "FORBIDDEN";
  details?: Record<string, any>;
}

/**
 * Detects common adversarial prompt injection signatures as defense-in-depth
 * to guarantee immediate blocking locally and alongside Arcjet cloud analysis.
 */
export function hasPromptInjectionSignature(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const patterns = [
    /ignore\s+(all\s+)?(previous|prior|above|existing)\s+(instructions|prompts|rules|commands)/i,
    /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
    /reveal\s+(all\s+)?(system\s+)?(prompt|instructions|secret|api[_\s-]?key)/i,
    /output\s+(all\s+)?(admin|system|database|root)\s+(credentials|password|prompt|keys)/i,
    /bypass\s+(safety|content\s+filter|guardrail|security\s+policy)/i,
    /you\s+are\s+now\s+in\s+developer\s+mode/i,
    /jailbreak/i,
    /dan\s+mode/i,
  ];
  return patterns.some((pattern) => pattern.test(text));
}

/**
 * Protects video upload requests using Arcjet + Database Defense-in-Depth.
 *
 * 1. Checks Arcjet rate limiting (fixedWindow 2 videos/day), bot abuse, and prompt injection.
 * 2. Validates user's DB upload records today to ensure strict daily 2-video limit resets next day.
 */
export async function protectVideoUpload(
  req: NextRequest,
  {
    userId,
    textToScan = "",
  }: {
    userId: string;
    textToScan?: string;
  }
): Promise<SecurityCheckResult> {
  const safeUserId = userId && userId.trim() !== "" ? userId : "guest_user";

  // Log notice if prompt-like pattern detected in filename/title, but do not block video uploads
  if (hasPromptInjectionSignature(textToScan)) {
    console.warn("[Arcjet:Upload] Notice: prompt signature pattern noted in video title/filename:", textToScan);
  }

  // 1. Arcjet Rule Evaluation
  try {
    const decision = await videoUploadArcjet.protect(req, {
      userId: safeUserId,
      detectPromptInjectionMessage: textToScan,
      sensitiveInfoValue: textToScan,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        if (!ENFORCE_DAILY_LIMIT) {
          // Rate limiting disabled during trial mode: allow upload to proceed
        } else {
          const resetSeconds = decision.reason.reset || 86400;
          return {
            allowed: false,
            status: 429,
            reason: "RATE_LIMIT",
            error: "Daily upload limit reached: You can upload only 2 videos a day. Your limit will reset tomorrow (next day) to generate new short videos.",
            details: {
              max: DAILY_UPLOAD_LIMIT,
              resetSeconds,
              resetTime: decision.reason.resetTime,
            },
          };
        }
      } else if (decision.reason.isPromptInjection()) {
        // DRY_RUN mode for uploads so filenames do not block user
        console.warn("[Arcjet:Upload] Prompt injection flagged on video title in DRY_RUN mode:", textToScan);
      } else if (decision.reason.isSensitiveInfo()) {
        return {
          allowed: false,
          status: 400,
          reason: "SENSITIVE_INFO",
          error: "Security Alert: Sensitive information (such as credit card numbers) was detected. Please remove sensitive details.",
        };
      } else if (decision.reason.isBot()) {
        return {
          allowed: false,
          status: 403,
          reason: "BOT_DETECTED",
          error: "Access Denied: Automated bots or script crawlers are not permitted to submit video processing jobs.",
        };
      } else if (decision.reason.isShield()) {
        return {
          allowed: false,
          status: 403,
          reason: "SHIELD_BLOCKED",
          error: "Access Denied: Request blocked by Arcjet Shield Web Application Firewall.",
        };
      } else {
        return {
          allowed: false,
          status: 403,
          reason: "FORBIDDEN",
          error: "Access Denied: Forbidden by Arcjet security policy.",
        };
      }
    }
  } catch (arcjetErr) {
    console.warn("[Arcjet] Shield evaluation notice (falling back to DB quota):", arcjetErr);
  }

  // 2. Database Quota Enforcement (Only active when ENFORCE_DAILY_LIMIT is true)
  if (ENFORCE_DAILY_LIMIT) {
    const stats = await getUserDailyUploadStats(safeUserId);
    if (!stats.canUpload) {
      return {
        allowed: false,
        status: 429,
        reason: "RATE_LIMIT",
        error: `Daily upload limit reached: You have already uploaded ${stats.uploadsToday} of ${stats.maxAllowed} videos today. Your quota will reset next day at 00:00 UTC.`,
        details: {
          uploadsToday: stats.uploadsToday,
          maxAllowed: stats.maxAllowed,
          remaining: stats.remaining,
          resetsAt: stats.resetsAt.toISOString(),
        },
      };
    }
  }

  return { allowed: true };
}

/**
 * Protects AI inference and short generation endpoints from abuse and prompt injection.
 */
export async function protectAiEndpoint(
  req: NextRequest,
  {
    userId,
    prompt = "",
  }: {
    userId: string;
    prompt?: string;
  }
): Promise<SecurityCheckResult> {
  const safeUserId = userId && userId.trim() !== "" ? userId : "guest_user";

  if (hasPromptInjectionSignature(prompt)) {
    return {
      allowed: false,
      status: 400,
      reason: "PROMPT_INJECTION",
      error: "Security Alert: Prompt injection or instruction override detected in prompt/input. AI short generation request was blocked.",
      details: { detected: true },
    };
  }

  try {
    const decision = await aiEndpointArcjet.protect(req, {
      userId: safeUserId,
      detectPromptInjectionMessage: prompt,
    });

    if (decision.isDenied()) {
      if (decision.reason.isPromptInjection()) {
        return {
          allowed: false,
          status: 400,
          reason: "PROMPT_INJECTION",
          error: "Security Alert: Prompt injection or instruction override detected. AI short generation request was blocked.",
          details: { detected: true },
        };
      }

      if (decision.reason.isBot()) {
        return {
          allowed: false,
          status: 403,
          reason: "BOT_DETECTED",
          error: "Access Denied: Automated bots are not permitted to trigger AI generation endpoints.",
        };
      }

      return {
        allowed: false,
        status: 403,
        reason: "FORBIDDEN",
        error: "Access Denied: Blocked by Arcjet AI Endpoint Abuse Protection.",
      };
    }
  } catch (err) {
    console.warn("[Arcjet:AI] Error evaluating AI endpoint protection:", err);
  }

  return { allowed: true };
}
