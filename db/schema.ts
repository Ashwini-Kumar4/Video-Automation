import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  bigint,
  real,
} from "drizzle-orm/pg-core";

/**
 * Users table storing registered user information synced from Clerk.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

/**
 * Projects table storing video upload projects, metadata, Inngest processing status,
 * and AWS S3 storage URLs.
 */
export const projects = pgTable("projects", {
  id: varchar("id", { length: 128 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  originalFileName: text("original_file_name"),
  fileSize: varchar("file_size", { length: 64 }),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
  duration: varchar("duration", { length: 64 }),
  durationSeconds: integer("duration_seconds"),
  resolution: varchar("resolution", { length: 64 }),
  format: varchar("format", { length: 32 }),
  aspectRatio: varchar("aspect_ratio", { length: 32 }).default("9:16"),
  clipLength: varchar("clip_length", { length: 32 }).default("30-60s"),
  captionPreset: varchar("caption_preset", { length: 64 }).default("hormozi"),
  sourceType: varchar("source_type", { length: 32 }).default("upload"),
  sourceUrl: text("source_url"),
  status: varchar("status", { length: 64 }).default("queued").notNull(),
  progress: integer("progress").default(0).notNull(),
  stage: text("stage").default("Initializing upload..."),
  errorMessage: text("error_message"),
  s3Bucket: text("s3_bucket"),
  s3Key: text("s3_key"),
  s3Url: text("s3_url"),
  signedUrl: text("signed_url"),
  signedUrlExpiresAt: timestamp("signed_url_expires_at"),
  inngestEventId: text("inngest_event_id"),
  transcript: text("transcript"),
  transcriptData: text("transcript_data"),
  captions: text("captions"),
  captionsSrt: text("captions_srt"),
  captionsVtt: text("captions_vtt"),
  aiAnalysisStatus: varchar("ai_analysis_status", { length: 64 }).default("idle"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

/**
 * Short Videos table storing all viral shorts generated from a long-form video:
 * Includes Start Time, End Time, Virality Reasoning ("why best short video"),
 * SEO ranking score out of 100, and isolated captions corresponding to the clip window.
 */
export const shortVideos = pgTable("short_videos", {
  id: varchar("id", { length: 128 }).primaryKey(),
  projectId: varchar("project_id", { length: 128 })
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 255 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: real("start_time").notNull(),
  endTime: real("end_time").notNull(),
  durationSeconds: real("duration_seconds").notNull(),
  duration: varchar("duration", { length: 32 }).notNull(),
  whyReason: text("why_reason").notNull(),
  seoScore: integer("seo_score").notNull(),
  seoKeywords: text("seo_keywords"),
  hook: text("hook"),
  captions: text("captions").notNull(),
  captionsSrt: text("captions_srt"),
  captionsVtt: text("captions_vtt"),
  status: varchar("status", { length: 64 }).default("ready").notNull(),
  videoUrl: text("video_url"),
  aspectRatio: varchar("aspect_ratio", { length: 32 }).default("9:16"),
  aiModelUsed: varchar("ai_model_used", { length: 64 }).default("gemini-1.5-flash"),
  captionPreset: varchar("caption_preset", { length: 64 }).default("hormozi"),
  captionStyle: text("caption_style"),
  exportUrl: text("export_url"),
  renderStatus: varchar("render_status", { length: 64 }).default("idle"),
  renderProgress: integer("render_progress").default(0),
  renderStage: text("render_stage"),
  renderId: text("render_id"),
  renderBucket: text("render_bucket"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const shorts = shortVideos;
export type ShortVideo = typeof shortVideos.$inferSelect;
export type NewShortVideo = typeof shortVideos.$inferInsert;

/**
 * Social Connections table storing connected social media platforms synced via Zernio API.
 */
export const socialConnections = pgTable("social_connections", {
  id: varchar("id", { length: 128 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  platform: varchar("platform", { length: 64 }).notNull(),
  accountId: varchar("account_id", { length: 128 }).notNull(),
  profileId: varchar("profile_id", { length: 128 }),
  accountName: text("account_name"),
  username: text("username"),
  avatarUrl: text("avatar_url"),
  status: varchar("status", { length: 32 }).default("connected").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SocialConnection = typeof socialConnections.$inferSelect;
export type NewSocialConnection = typeof socialConnections.$inferInsert;

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

