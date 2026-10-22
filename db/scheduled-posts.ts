import {
  pgTable,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Scheduled Posts table storing video posts queued for distribution
 * across YouTube Shorts, TikTok, Instagram Reels, and other social channels.
 */
export const scheduledPosts = pgTable("scheduled_posts", {
  id: varchar("id", { length: 128 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  shortId: varchar("short_id", { length: 128 }),
  title: text("title").notNull(),
  caption: text("caption").notNull(),
  platforms: text("platforms").notNull(), // JSON array string e.g. ["youtube", "tiktok"]
  accountIds: text("account_ids"), // JSON array string of selected social_connections IDs
  videoUrl: text("video_url"), // Exported MP4 URL
  scheduledDate: varchar("scheduled_date", { length: 32 }).notNull(), // YYYY-MM-DD
  scheduledTime: varchar("scheduled_time", { length: 32 }).notNull(), // HH:mm
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: varchar("status", { length: 32 }).default("scheduled").notNull(), // scheduled | published | failed | cancelled
  hashtags: text("hashtags"),
  thumbnailUrl: text("thumbnail_url"),
  zernioPostId: varchar("zernio_post_id", { length: 128 }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type NewScheduledPost = typeof scheduledPosts.$inferInsert;
