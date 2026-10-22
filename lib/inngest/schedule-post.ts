import { inngest } from "./client";
import { db, scheduledPosts, socialConnections } from "@/db";
import { eq, and, lte, gte } from "drizzle-orm";
import {
  scheduleZernioPost,
  isZernioConfigured,
  listZernioAccounts,
} from "@/lib/zernio";

export interface ScheduledPostRunResult {
  postId: string;
  title: string;
  status: "published" | "simulation" | "failed";
  zernioPostId?: string;
  error?: string;
}

/**
 * Inngest Background Function: Runs every 15 minutes.
 *
 * 1. Checks Neon Database for any video posts scheduled within the next 15 minutes (or due now).
 * 2. Fetches connected accounts for YouTube, TikTok, Instagram Reels, LinkedIn, etc.
 * 3. Uses Zernio Social API to schedule / post the video clip and viral copy on target platforms.
 * 4. Updates database post status to "published" with zernioPostId (or logs failure).
 */
export const checkAndSchedulePostsEvery15Min = inngest.createFunction(
  {
    id: "check-and-schedule-posts-every-15-min",
    name: "Check & Schedule Social Media Posts (Every 15 min)",
    triggers: [
      { cron: "*/15 * * * *" }, // Runs every 15 minutes automatically
      { event: "schedule/posts.run-check" }, // Manual / API trigger
      { event: "social/posts.check-and-publish" }, // Real-time upcoming trigger
    ],
  },
  async ({ step }) => {
    // Step 1: Query upcoming posts from Neon Database
    const duePosts = await step.run("query-due-posts-next-15-min", async () => {
      const now = new Date();
      // Look 15 minutes ahead for all due or overdue scheduled posts
      const next15Min = new Date(now.getTime() + 15 * 60 * 1000);

      console.log(
        `[Inngest 15-min Scheduler] Scanning for scheduled posts due on or before ${next15Min.toISOString()}`
      );

      const posts = await db
        .select()
        .from(scheduledPosts)
        .where(
          and(
            eq(scheduledPosts.status, "scheduled"),
            lte(scheduledPosts.scheduledAt, next15Min)
          )
        );

      console.log(`[Inngest 15-min Scheduler] Found ${posts.length} posts due to schedule/publish.`);
      return posts;
    });

    if (duePosts.length === 0) {
      return {
        success: true,
        message: "No posts scheduled within the next 15 minutes window.",
        dispatchedCount: 0,
        timestamp: new Date().toISOString(),
      };
    }

    const results: ScheduledPostRunResult[] = [];

    // Step 2: Schedule and publish each post to target social media platforms via Zernio API
    for (const post of duePosts) {
      const result = await step.run(`schedule-post-to-social-${post.id}`, async () => {
        try {
          // Parse target platforms (e.g. ["youtube", "tiktok", "instagram"])
          let targetPlatforms: string[] = [];
          try {
            targetPlatforms = Array.isArray(post.platforms)
              ? post.platforms
              : JSON.parse(post.platforms);
          } catch {
            targetPlatforms = ["youtube", "tiktok", "instagram"];
          }

          // Parse account IDs if specified
          let selectedAccountIds: string[] = [];
          try {
            selectedAccountIds = post.accountIds ? JSON.parse(post.accountIds) : [];
          } catch {
            selectedAccountIds = [];
          }

          // Look up connected accounts for this user from social_connections table
          const userConnections = await db
            .select()
            .from(socialConnections)
            .where(eq(socialConnections.userId, post.userId));

          // If Zernio API is configured, also list live accounts directly from Zernio
          let liveZernioAccounts: any[] = [];
          if (isZernioConfigured()) {
            try {
              liveZernioAccounts = await listZernioAccounts();
            } catch (err) {
              console.warn("[Inngest] Could not list live accounts from Zernio:", err);
            }
          }

          // Map each platform to an account ID
          const platformTargets: Array<{ platform: string; accountId: string }> = [];

          for (const plat of targetPlatforms) {
            // Priority 1: Match live Zernio account (e.g. real Instagram account)
            const liveMatch = liveZernioAccounts.find(
              (a: any) =>
                a.platform?.toLowerCase() === plat.toLowerCase() ||
                (plat.toLowerCase() === "instagram" && (a.platform === "instagram" || a.platform === "facebook"))
            );

            // Priority 2: Match local DB connection
            const localMatch =
              userConnections.find(
                (c) =>
                  (selectedAccountIds.includes(c.id) || selectedAccountIds.includes(c.accountId)) &&
                  c.platform.toLowerCase() === plat.toLowerCase()
              ) ||
              userConnections.find(
                (c) => c.platform.toLowerCase() === plat.toLowerCase()
              );

            const accountId =
              liveMatch?._id ||
              liveMatch?.id ||
              localMatch?.accountId ||
              localMatch?.id ||
              `acc_${plat.toLowerCase()}_${post.userId.slice(-6)}`;

            platformTargets.push({
              platform: plat.toLowerCase(),
              accountId,
            });
          }

          // Construct full content (caption + hashtags)
          let fullContent = post.caption;
          if (post.hashtags && !fullContent.includes(post.hashtags)) {
            fullContent = `${fullContent}\n\n${post.hashtags}`;
          }

          const scheduledDateObj = new Date(post.scheduledAt);
          const isDueNow = scheduledDateObj.getTime() <= Date.now();

          console.log(
            `[Inngest:Zernio] Scheduling post "${post.title}" (ID: ${post.id}) for platforms:`,
            platformTargets.map((p) => p.platform)
          );

          // Call Zernio API to schedule or publish the post with attached video URL
          const zernioRes = await scheduleZernioPost({
            title: post.title,
            content: fullContent,
            mediaUrl: post.videoUrl,
            scheduledFor: scheduledDateObj,
            publishNow: isDueNow,
            platforms: platformTargets,
          });

          if (!zernioRes.success) {
            throw new Error(zernioRes.error || "Zernio API post creation failed");
          }

          // Check if request was in simulation mode due to missing ZERNIO_API_KEY
          if (zernioRes.isMock) {
            const warningMsg =
              "ZERNIO_API_KEY is not configured in .env.local. Post ran in local simulation mode and was NOT dispatched to live Instagram. Please add your Zernio API key.";
            console.warn(`[Inngest:Zernio] Warning for post ${post.id}: ${warningMsg}`);

            await db
              .update(scheduledPosts)
              .set({
                status: "simulation",
                zernioPostId: zernioRes.postId || null,
                errorMessage: warningMsg,
                updatedAt: new Date(),
              })
              .where(eq(scheduledPosts.id, post.id));

            return {
              postId: post.id,
              title: post.title,
              status: "simulation" as const,
              zernioPostId: zernioRes.postId,
              error: warningMsg,
            };
          }

          // Update post record in Neon database to "published"
          await db
            .update(scheduledPosts)
            .set({
              status: "published",
              zernioPostId: zernioRes.postId || null,
              errorMessage: null,
              updatedAt: new Date(),
            })
            .where(eq(scheduledPosts.id, post.id));

          console.log(
            `[Inngest:Zernio] Post ${post.id} successfully processed! Zernio Post ID: ${zernioRes.postId}`
          );

          return {
            postId: post.id,
            title: post.title,
            status: "published" as const,
            zernioPostId: zernioRes.postId,
          };
        } catch (error: any) {
          console.error(`[Inngest:Zernio] Failed scheduling post ${post.id}:`, error);

          await db
            .update(scheduledPosts)
            .set({
              status: "failed",
              errorMessage: error?.message || "Failed to schedule on social media",
              updatedAt: new Date(),
            })
            .where(eq(scheduledPosts.id, post.id));

          return {
            postId: post.id,
            title: post.title,
            status: "failed" as const,
            error: error?.message || "Scheduling error",
          };
        }
      });

      results.push(result);
    }

    return {
      success: true,
      processedCount: results.length,
      results,
      timestamp: new Date().toISOString(),
    };
  }
);

// Alias export for backward compatibility
export const checkAndPublishScheduledPosts = checkAndSchedulePostsEvery15Min;
