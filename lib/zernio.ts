import { Zernio } from "@zernio/node";

/**
 * All 16 official platforms supported by the Zernio Social API.
 */
export type ZernioPlatform =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "linkedin"
  | "twitter"
  | "threads"
  | "reddit"
  | "pinterest"
  | "bluesky"
  | "googlebusiness"
  | "telegram"
  | "snapchat"
  | "discord"
  | "slack"
  | "whatsapp";

export interface SocialPlatformInfo {
  id: ZernioPlatform;
  name: string;
  tagline: string;
  category: "video" | "social" | "messaging";
  categoryLabel: string;
  badge: string;
  accentColor: string;
  bgGlow: string;
  borderColor: string;
  textColor: string;
  iconBg: string;
  supportedFormats: string[];
  capabilities: string[];
  requiresSpecialSetup?: boolean;
  setupHint?: string;
  docUrl?: string;
}

export const ZERNIO_PLATFORMS: SocialPlatformInfo[] = [
  // 1. YouTube
  {
    id: "youtube",
    name: "YouTube",
    tagline: "Publish viral YouTube Shorts and channel videos",
    category: "video",
    categoryLabel: "Video & Shorts",
    badge: "Shorts 9:16",
    accentColor: "#FF0000",
    bgGlow: "from-red-600/20 via-rose-600/10 to-transparent",
    borderColor: "hover:border-red-500/40 border-red-500/20",
    textColor: "text-red-400",
    iconBg: "bg-red-600",
    supportedFormats: ["YouTube Shorts (9:16)", "Full HD", "4K Video"],
    capabilities: ["Instant & Scheduled Shorts", "SEO Titles & Tags", "Custom Playlists"],
    docUrl: "https://docs.zernio.com/platforms/youtube",
  },
  // 2. TikTok
  {
    id: "tiktok",
    name: "TikTok",
    tagline: "Distribute high-retention clips to your TikTok FYP",
    category: "video",
    categoryLabel: "Video & Shorts",
    badge: "FYP Viral",
    accentColor: "#FE2C55",
    bgGlow: "from-pink-600/20 via-cyan-600/10 to-transparent",
    borderColor: "hover:border-pink-500/40 border-pink-500/20",
    textColor: "text-pink-400",
    iconBg: "bg-gradient-to-r from-[#25F4EE] to-[#FE2C55]",
    supportedFormats: ["Vertical Video (9:16)", "1080x1920", "Captions"],
    capabilities: ["Direct Feed Posting", "Commercial Music", "Hashtag Presets"],
    docUrl: "https://docs.zernio.com/platforms/tiktok",
  },
  // 3. Instagram
  {
    id: "instagram",
    name: "Instagram",
    tagline: "Post high-impact Reels and Feed carousels",
    category: "video",
    categoryLabel: "Video & Shorts",
    badge: "Reels & Feed",
    accentColor: "#E1306C",
    bgGlow: "from-purple-600/20 via-rose-600/15 to-amber-600/10",
    borderColor: "hover:border-rose-500/40 border-rose-500/20",
    textColor: "text-rose-400",
    iconBg: "bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#833AB4]",
    supportedFormats: ["Reels (9:16)", "Feed Video (4:5)", "Stories"],
    capabilities: ["Creator & Business Profiles", "Viral Reels Distribution", "Cover Selection"],
    docUrl: "https://docs.zernio.com/platforms/instagram",
  },
  // 4. Facebook
  {
    id: "facebook",
    name: "Facebook",
    tagline: "Publish Reels to Facebook Pages and audiences",
    category: "video",
    categoryLabel: "Video & Shorts",
    badge: "Pages & Reels",
    accentColor: "#1877F2",
    bgGlow: "from-blue-600/20 via-indigo-600/10 to-transparent",
    borderColor: "hover:border-blue-500/40 border-blue-500/20",
    textColor: "text-blue-400",
    iconBg: "bg-[#1877F2]",
    supportedFormats: ["Facebook Reels", "Feed Video", "HD Clips"],
    capabilities: ["Page Selection", "Cross-Posting", "Audience Engagement"],
    docUrl: "https://docs.zernio.com/platforms/facebook",
  },
  // 5. LinkedIn
  {
    id: "linkedin",
    name: "LinkedIn",
    tagline: "Professional video thought-leadership & company posts",
    category: "social",
    categoryLabel: "Social & Professional",
    badge: "B2B Creator",
    accentColor: "#0A66C2",
    bgGlow: "from-sky-600/20 via-blue-600/10 to-transparent",
    borderColor: "hover:border-sky-500/40 border-sky-500/20",
    textColor: "text-sky-400",
    iconBg: "bg-[#0A66C2]",
    supportedFormats: ["Native Video", "Company Updates", "Document Carousels"],
    capabilities: ["Personal Profiles", "Company Pages", "High Authority Reach"],
    docUrl: "https://docs.zernio.com/platforms/linkedin",
  },
  // 6. X (Twitter)
  {
    id: "twitter",
    name: "X (Twitter)",
    tagline: "Share punchy video clips, viral hooks, and threads",
    category: "social",
    categoryLabel: "Social & Professional",
    badge: "Video & Threads",
    accentColor: "#000000",
    bgGlow: "from-neutral-700/30 via-neutral-800/20 to-transparent",
    borderColor: "hover:border-white/30 border-white/10",
    textColor: "text-zinc-200",
    iconBg: "bg-black border border-white/20",
    supportedFormats: ["Native Video", "Video Threads", "Polls"],
    capabilities: ["OAuth 2.0 Direct", "Automatic Engagement", "Idempotent Posting"],
    docUrl: "https://docs.zernio.com/platforms/twitter",
  },
  // 7. Threads
  {
    id: "threads",
    name: "Threads",
    tagline: "Micro-video clips and fast conversational updates",
    category: "social",
    categoryLabel: "Social & Professional",
    badge: "Meta Threads",
    accentColor: "#000000",
    bgGlow: "from-violet-600/15 via-zinc-700/15 to-transparent",
    borderColor: "hover:border-violet-500/40 border-white/15",
    textColor: "text-violet-300",
    iconBg: "bg-zinc-900 border border-white/20",
    supportedFormats: ["Short Video Clips", "Text + Media", "Carousels"],
    capabilities: ["Auto-Publishing", "Meta Graph API", "Conversational Growth"],
    docUrl: "https://docs.zernio.com/platforms/threads",
  },
  // 8. Pinterest
  {
    id: "pinterest",
    name: "Pinterest",
    tagline: "Evergreen Idea Pins and video boards for long-term discovery",
    category: "social",
    categoryLabel: "Social & Professional",
    badge: "Idea Pins",
    accentColor: "#BD081C",
    bgGlow: "from-rose-600/20 via-red-600/10 to-transparent",
    borderColor: "hover:border-red-500/40 border-red-500/20",
    textColor: "text-red-400",
    iconBg: "bg-[#BD081C]",
    supportedFormats: ["Idea Pins (9:16)", "Standard Video Pins"],
    capabilities: ["Board Selection", "Destination Link URL", "Visual Search Traffic"],
    docUrl: "https://docs.zernio.com/platforms/pinterest",
  },
  // 9. Reddit
  {
    id: "reddit",
    name: "Reddit",
    tagline: "Post clips to niche subreddits with custom flair",
    category: "social",
    categoryLabel: "Social & Professional",
    badge: "Community Video",
    accentColor: "#FF4500",
    bgGlow: "from-orange-600/20 via-amber-600/10 to-transparent",
    borderColor: "hover:border-orange-500/40 border-orange-500/20",
    textColor: "text-orange-400",
    iconBg: "bg-[#FF4500]",
    supportedFormats: ["Native Video Upload", "Subreddit Video Post"],
    capabilities: ["Subreddit Verification", "Flair Selection", "Organic Viral Discussion"],
    docUrl: "https://docs.zernio.com/platforms/reddit",
  },
  // 10. Bluesky
  {
    id: "bluesky",
    name: "Bluesky",
    tagline: "Decentralized AT Protocol video and post publishing",
    category: "social",
    categoryLabel: "Social & Professional",
    badge: "AT Protocol",
    accentColor: "#0285FF",
    bgGlow: "from-sky-500/20 via-cyan-600/10 to-transparent",
    borderColor: "hover:border-sky-400/40 border-sky-400/20",
    textColor: "text-sky-300",
    iconBg: "bg-[#0285FF]",
    supportedFormats: ["Native Video (up to 60s)", "Text Posts"],
    capabilities: ["App Password / OAuth", "Decentralized Graph", "Zero Algorithm Suppression"],
    docUrl: "https://docs.zernio.com/platforms/bluesky",
  },
  // 11. Snapchat
  {
    id: "snapchat",
    name: "Snapchat",
    tagline: "Post to Snapchat Spotlight & Public Profile Stories",
    category: "social",
    categoryLabel: "Social & Professional",
    badge: "Spotlight (Beta)",
    accentColor: "#FFFC00",
    bgGlow: "from-yellow-500/20 via-amber-500/10 to-transparent",
    borderColor: "hover:border-amber-400/40 border-amber-400/20",
    textColor: "text-amber-300",
    iconBg: "bg-[#FFFC00] text-black",
    supportedFormats: ["Spotlight (9:16)", "Public Stories", "Saved Stories"],
    capabilities: ["Public Profile Selection", "High Gen-Z Reach", "Direct Spotlight Video"],
    docUrl: "https://docs.zernio.com/platforms/snapchat",
  },
  // 12. Google Business Profile
  {
    id: "googlebusiness",
    name: "Google Business",
    tagline: "Video updates and offers on Google Maps and Local Search",
    category: "social",
    categoryLabel: "Social & Professional",
    badge: "Local SEO",
    accentColor: "#34A853",
    bgGlow: "from-emerald-600/20 via-blue-600/10 to-transparent",
    borderColor: "hover:border-emerald-500/40 border-emerald-500/20",
    textColor: "text-emerald-400",
    iconBg: "bg-gradient-to-tr from-[#EA4335] via-[#FBBC05] to-[#34A853]",
    supportedFormats: ["Business Video Updates", "Photos", "Call-to-Action Offers"],
    capabilities: ["Location Selection", "Search & Maps Visibility", "Customer Reviews Sync"],
    docUrl: "https://docs.zernio.com/platforms/google-business",
  },
  // 13. Discord
  {
    id: "discord",
    name: "Discord",
    tagline: "Automated community broadcasts and webhook alerts",
    category: "messaging",
    categoryLabel: "Messaging & Community",
    badge: "Community Bot",
    accentColor: "#5865F2",
    bgGlow: "from-indigo-600/20 via-violet-600/10 to-transparent",
    borderColor: "hover:border-indigo-500/40 border-indigo-500/20",
    textColor: "text-indigo-400",
    iconBg: "bg-[#5865F2]",
    supportedFormats: ["Rich Video Embeds", "Channel Posts", "Threads"],
    capabilities: ["Server & Channel Binding", "Custom Bot Messages", "Member Ping Options"],
    docUrl: "https://docs.zernio.com/platforms/discord",
  },
  // 14. Slack
  {
    id: "slack",
    name: "Slack",
    tagline: "Broadcast video announcements directly to company channels",
    category: "messaging",
    categoryLabel: "Messaging & Community",
    badge: "Workspace Bot",
    accentColor: "#4A154B",
    bgGlow: "from-purple-600/20 via-fuchsia-600/10 to-transparent",
    borderColor: "hover:border-purple-500/40 border-purple-500/20",
    textColor: "text-purple-300",
    iconBg: "bg-[#4A154B]",
    supportedFormats: ["Channel Video Posts", "Block Kit Messages", "Thread Replies"],
    capabilities: ["Channel Picker", "Workspace Bot", "Internal Marketing Sync"],
    docUrl: "https://docs.zernio.com/platforms/slack",
  },
  // 15. Telegram
  {
    id: "telegram",
    name: "Telegram",
    tagline: "Push video shorts to Telegram Broadcast Channels and Groups",
    category: "messaging",
    categoryLabel: "Messaging & Community",
    badge: "Channels & Bot",
    accentColor: "#229ED9",
    bgGlow: "from-cyan-600/20 via-sky-600/10 to-transparent",
    borderColor: "hover:border-cyan-500/40 border-cyan-500/20",
    textColor: "text-cyan-400",
    iconBg: "bg-[#229ED9]",
    supportedFormats: ["Direct Video MP4", "Captioned Media", "Channel Broadcast"],
    capabilities: ["Bot Access-Code Pairing", "Instant Channel Push", "Discussion Groups"],
    docUrl: "https://docs.zernio.com/platforms/telegram",
  },
  // 16. WhatsApp
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    tagline: "Broadcast video templates or test via Zernio shared sandbox",
    category: "messaging",
    categoryLabel: "Messaging & Community",
    badge: "Meta Cloud API",
    accentColor: "#25D366",
    bgGlow: "from-emerald-600/20 via-teal-600/10 to-transparent",
    borderColor: "hover:border-emerald-500/40 border-emerald-500/20",
    textColor: "text-emerald-400",
    iconBg: "bg-[#25D366]",
    supportedFormats: ["Video Template Messages", "Sandbox Free Testing", "Direct Alerts"],
    capabilities: ["Embedded Signup", "Coexistence Mode", "Shared Sandbox Included"],
    docUrl: "https://docs.zernio.com/platforms/whatsapp",
  },
];

/**
 * Returns a configured Zernio SDK instance or null if the API key is missing.
 */
export function getZernioClient(): Zernio | null {
  const apiKey = process.env.ZERNIO_API_KEY?.trim();
  if (!apiKey || !apiKey.startsWith("sk_") || apiKey.includes("...")) {
    return null;
  }
  return new Zernio({ apiKey });
}

export function isZernioConfigured(): boolean {
  const apiKey = process.env.ZERNIO_API_KEY?.trim();
  return Boolean(apiKey && apiKey.startsWith("sk_") && !apiKey.includes("..."));
}

/**
 * Gets or creates a Zernio profile for a user.
 * Profiles group accounts: one per brand, or one per user of your app.
 */
export async function getOrCreateZernioProfile(
  userId: string,
  userDisplayName?: string
): Promise<{ profileId: string; name: string }> {
  const client = getZernioClient();
  if (!client) {
    throw new Error("ZERNIO_API_KEY environment variable is not configured.");
  }

  const profileTargetName = userDisplayName
    ? `${userDisplayName.trim()}'s Studio`
    : `User_${userId.slice(-8)}`;

  try {
    const listRes = await client.profiles.listProfiles();
    const existing = listRes.data?.profiles?.find(
      (p: { name?: string; _id?: string }) =>
        p.name === profileTargetName || p.name?.includes(userId.slice(-6))
    );

    if (existing && existing._id) {
      return { profileId: existing._id, name: existing.name || profileTargetName };
    }

    // If none found, create a new profile
    const createRes = await client.profiles.createProfile({
      body: { name: profileTargetName },
    });

    const newProfile = createRes.data?.profile;
    if (!newProfile?._id) {
      throw new Error("Zernio profile creation succeeded but returned no _id.");
    }

    return { profileId: newProfile._id, name: newProfile.name || profileTargetName };
  } catch (error: any) {
    console.error("Zernio profile resolution failed:", error?.message || error);
    throw error;
  }
}

/**
 * Generates an OAuth connect URL for a given platform.
 */
export async function getPlatformConnectUrl(options: {
  platform: ZernioPlatform;
  profileId: string;
  redirectUrl: string;
  brandName?: string;
}): Promise<{ authUrl: string; state?: string }> {
  const client = getZernioClient();
  if (!client) {
    throw new Error("ZERNIO_API_KEY environment variable is not configured.");
  }

  const queryParams: any = {
    profileId: options.profileId,
    redirect_url: options.redirectUrl,
    redirectUrl: options.redirectUrl,
    brandName: options.brandName || "VidShorts AI",
  };

  const res = await client.connect.getConnectUrl({
    path: { platform: options.platform },
    query: queryParams,
  });

  const authUrl = res.data?.authUrl;
  if (!authUrl) {
    throw new Error(`Zernio did not return an authUrl for platform: ${options.platform}`);
  }

  return { authUrl, state: res.data?.state };
}

/**
 * Fetches connected accounts from Zernio.
 */
export async function listZernioAccounts(profileId?: string) {
  const client = getZernioClient();
  if (!client) {
    return [];
  }

  try {
    const res = await client.accounts.listAccounts({
      query: profileId ? { perProfile: 20 } : undefined,
    });
    return res.data?.accounts || [];
  } catch (err: any) {
    console.error("Failed to list accounts from Zernio:", err?.message || err);
    return [];
  }
}

/**
 * Disconnects (deletes) a connected account in Zernio.
 */
export async function deleteZernioAccount(accountId: string) {
  const client = getZernioClient();
  if (!client) {
    throw new Error("ZERNIO_API_KEY environment variable is not configured.");
  }

  const res = await client.accounts.deleteAccount({
    path: { accountId },
  });

  return res.data;
}

export interface ScheduleZernioPostOptions {
  title?: string;
  content: string;
  mediaUrl?: string | null;
  scheduledFor?: Date | string | null;
  publishNow?: boolean;
  timezone?: string;
  platforms: Array<{
    platform: string;
    accountId: string;
  }>;
}

export interface ScheduleZernioPostResult {
  success: boolean;
  postId?: string;
  status?: string;
  isMock?: boolean;
  error?: string;
  raw?: any;
}

/**
 * Schedules or immediately publishes a social media post using the official Zernio API.
 * Attaches video media via public URL and distributes across the user's connected platforms.
 */
export async function scheduleZernioPost(
  options: ScheduleZernioPostOptions
): Promise<ScheduleZernioPostResult> {
  const client = getZernioClient();

  if (!client) {
    console.warn(
      "[Zernio] ZERNIO_API_KEY is not configured. Running in sandbox/simulation mode."
    );
    return {
      success: true,
      postId: `sim_zernio_${Date.now()}`,
      status: options.publishNow ? "published" : "scheduled",
      isMock: true,
    };
  }

  try {
    const postBody: any = {
      content: options.content,
      platforms: options.platforms.map((p) => ({
        platform: p.platform,
        accountId: p.accountId,
      })),
    };

    if (options.title) {
      postBody.title = options.title;
    }

    if (options.mediaUrl) {
      postBody.mediaItems = [
        {
          url: options.mediaUrl,
          type: "video",
        },
      ];
    }

    if (options.publishNow) {
      postBody.publishNow = true;
    } else if (options.scheduledFor) {
      const scheduledIso =
        options.scheduledFor instanceof Date
          ? options.scheduledFor.toISOString()
          : options.scheduledFor;
      postBody.scheduledFor = scheduledIso;
      if (options.timezone) {
        postBody.timezone = options.timezone;
      }
    } else {
      postBody.publishNow = true;
    }

    const res = await client.posts.createPost({
      body: postBody,
    });

    const postData = res.data?.post || (res.data as any);
    const postId = postData?._id || postData?.id || `zernio_${Date.now()}`;
    const status = postData?.status || (options.publishNow ? "published" : "scheduled");

    return {
      success: true,
      postId,
      status,
      raw: res.data,
    };
  } catch (error: any) {
    console.error("[Zernio] Failed to schedule post via Zernio API:", error?.message || error);
    return {
      success: false,
      error: error?.message || "Failed to schedule post on Zernio",
      raw: error,
    };
  }
}
