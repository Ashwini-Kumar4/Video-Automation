"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Check,
  Film,
  Play,
  Share2,
  X,
  Flame,
  Wand2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Eye,
  CheckCircle2,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  PenLine,
  Search,
  ArrowRight,
  Layers,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface ExportedClip {
  id: string;
  title: string;
  description?: string | null;
  duration?: string | null;
  durationSeconds?: number | null;
  exportUrl?: string | null;
  videoUrl?: string | null;
  aspectRatio?: string | null;
  seoScore?: number | null;
  hook?: string | null;
  whyReason?: string | null;
  seoKeywords?: string | null;
  createdAt?: string | null;
}

export interface ConnectedSocial {
  id: string;
  platform: string;
  accountId: string;
  accountName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  status: string;
}

export interface SchedulePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string; // YYYY-MM-DD
  onPostScheduled: (post: any) => void;
  initialClipId?: string;
}

// Brand SVG Icons for Social Platforms
function PlatformIcon({ platform, className = "size-4" }: { platform: string; className?: string }) {
  const p = platform.toLowerCase();
  if (p.includes("youtube")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path
          fill="#FF0000"
          d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
        />
        <path fill="#FFFFFF" d="m9.545 15.568 6.273-3.568-6.273-3.568z" />
      </svg>
    );
  }
  if (p.includes("tiktok")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path
          fill="#25F4EE"
          d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.97v7.69c-.01 1.78-.63 3.55-1.78 4.93-1.47 1.77-3.71 2.84-6.02 2.86-2.31.02-4.57-.96-6.1-2.67-1.53-1.72-2.26-4.08-2.01-6.38.25-2.31 1.5-4.4 3.44-5.69 1.94-1.29 4.41-1.63 6.66-.94v4.14c-1.07-.44-2.31-.41-3.34.12-.99.5-1.69 1.48-1.89 2.58-.2 1.1.18 2.25.98 3.05.81.8 1.98 1.19 3.12 1.02 1.14-.17 2.11-.94 2.56-1.99.23-.53.33-1.11.33-1.69V.02h.02z"
        />
        <path
          fill="#FE2C55"
          d="M16.435 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v2.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.97v7.69c-.01 1.78-.63 3.55-1.78 4.93-1.47 1.77-3.71 2.84-6.02 2.86v-2.03c1.78-.02 3.55-.63 4.93-1.78 1.38-1.15 2.18-2.84 2.22-4.63V0h.48z"
        />
      </svg>
    );
  }
  if (p.includes("instagram")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path
          fill="url(#ig-grad)"
          d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
        />
        <defs>
          <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fdf497" />
            <stop offset="25%" stopColor="#fd5949" />
            <stop offset="50%" stopColor="#d6249f" />
            <stop offset="100%" stopColor="#285AEB" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (p.includes("facebook")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }
  if (p.includes("linkedin")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#0A66C2">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
      </svg>
    );
  }
  return <Share2 className={cn("text-violet-400", className)} />;
}

export function SchedulePostModal({
  isOpen,
  onClose,
  initialDate,
  onPostScheduled,
  initialClipId,
}: SchedulePostModalProps) {
  // Clips data & picker dialog state
  const [clips, setClips] = useState<ExportedClip[]>([]);
  const [loadingClips, setLoadingClips] = useState(true);
  const [selectedClipId, setSelectedClipId] = useState<string>("");
  const [isClipPickerOpen, setIsClipPickerOpen] = useState(false);
  const [clipSearch, setClipSearch] = useState("");

  // Social accounts
  const [accounts, setAccounts] = useState<ConnectedSocial[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

  // AI Content Generation state & modes
  const [aiMode, setAiMode] = useState<"auto" | "refine">("auto");
  const [userDraft, setUserDraft] = useState("");
  const [selectedTone, setSelectedTone] = useState<"viral" | "educational" | "founder" | "bold">("viral");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [newHashtagInput, setNewHashtagInput] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiSource, setAiSource] = useState<string | null>(null);

  const getTodayStr = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  };

  const getCurrentTimeStr = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };

  const getDefaultFutureTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    return `${String(now.getHours()).padStart(2, "0")}:00`;
  };

  // Timing state
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const today = getTodayStr();
    if (initialDate && initialDate >= today) return initialDate;
    return today;
  });
  const [scheduledTime, setScheduledTime] = useState<string>(getDefaultFutureTime);

  // Interaction state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successScheduled, setSuccessScheduled] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Sync initial date (guard against past dates)
  useEffect(() => {
    if (initialDate) {
      const today = getTodayStr();
      setScheduledDate(initialDate < today ? today : initialDate);
    }
  }, [initialDate]);

  // Load Exported Clips
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingClips(true);

    fetch("/api/schedule/clips")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.clips)) {
          setClips(data.clips);
          if (data.clips.length > 0) {
            const defaultId = initialClipId || data.clips[0].id;
            setSelectedClipId(defaultId);
            const foundClip = data.clips.find((c: ExportedClip) => c.id === defaultId) || data.clips[0];
            generateAiContentForClip(foundClip, "auto", "");
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load clips:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingClips(false);
      });

    // Load Connected Accounts
    setLoadingAccounts(true);
    fetch("/api/zernio/status")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const list: ConnectedSocial[] = [];
        if (data.localConnections && Array.isArray(data.localConnections)) {
          list.push(...data.localConnections);
        }
        if (data.liveAccounts && Array.isArray(data.liveAccounts)) {
          for (const live of data.liveAccounts) {
            if (!list.some((a) => a.accountId === live._id || a.platform === live.platform)) {
              list.push({
                id: live._id,
                platform: live.platform,
                accountId: live._id,
                accountName: live.name || live.platform,
                username: live.username ? (live.username.startsWith("@") ? live.username : `@${live.username}`) : `@${live.platform}`,
                status: live.status || "connected",
              });
            }
          }
        }

        // If no accounts exist in DB or live, provide default connected accounts
        if (list.length === 0) {
          list.push(
            {
              id: "demo-yt",
              platform: "youtube",
              accountId: "yt-1",
              accountName: "YouTube Shorts Channel",
              username: "@vidshorts_creator",
              status: "connected",
            },
            {
              id: "demo-tt",
              platform: "tiktok",
              accountId: "tt-1",
              accountName: "TikTok FYP Channel",
              username: "@viralshorts_ai",
              status: "connected",
            },
            {
              id: "demo-ig",
              platform: "instagram",
              accountId: "ig-1",
              accountName: "Instagram Reels Studio",
              username: "@reels_growth_hub",
              status: "connected",
            },
            {
              id: "demo-li",
              platform: "linkedin",
              accountId: "li-1",
              accountName: "LinkedIn Professional",
              username: "@tech_founder",
              status: "connected",
            }
          );
        }

        setAccounts(list);
        setSelectedAccountIds(list.slice(0, 3).map((a) => a.id));
      })
      .catch((err) => {
        console.error("Failed to load accounts:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingAccounts(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialClipId]);

  // Selected Clip Object
  const selectedClip = clips.find((c) => c.id === selectedClipId);

  // Trigger AI generation or refinement
  const generateAiContentForClip = async (
    clipToUse?: ExportedClip,
    mode: "auto" | "refine" = aiMode,
    customDraft: string = userDraft
  ) => {
    const clip = clipToUse || selectedClip;
    if (!clip) return;

    setIsAiGenerating(true);
    setErrorMessage(null);

    try {
      const selectedPlatforms = accounts
        .filter((a) => selectedAccountIds.includes(a.id))
        .map((a) => a.platform);

      const res = await fetch("/api/schedule/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipTitle: clip.title,
          clipHook: clip.hook || "",
          whyReason: clip.whyReason || "",
          seoKeywords: clip.seoKeywords || [],
          platforms: selectedPlatforms.length > 0 ? selectedPlatforms : ["youtube", "tiktok", "instagram"],
          userDraft: mode === "refine" ? customDraft : "",
          tone: selectedTone,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTitle(data.title || `${clip.title} 🚀`);
        setCaption(data.caption || "");
        setHashtags(Array.isArray(data.hashtags) ? data.hashtags : ["#Shorts", "#Viral", "#AI"]);
        setAiSource(data.source);
      }
    } catch (err: any) {
      console.warn("AI generation fallback:", err);
      setTitle(`${clip.title} 🚀`);
      setCaption(customDraft || clip.hook || "Watch till the end! What do you think about this? Drop your thoughts below 👇");
      setHashtags(["#Shorts", "#Viral", "#CreatorEconomy", "#Trending"]);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSelectClipFromPicker = (clip: ExportedClip) => {
    setSelectedClipId(clip.id);
    setIsClipPickerOpen(false);
    generateAiContentForClip(clip, aiMode, userDraft);
  };

  const toggleAccount = (accountId: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleAddHashtag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    if (!newHashtagInput.trim()) return;
    let tag = newHashtagInput.trim();
    if (!tag.startsWith("#")) tag = `#${tag}`;
    if (!hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
    }
    setNewHashtagInput("");
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter((t) => t !== tagToRemove));
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedClip) {
      setErrorMessage("Please select a video clip to schedule.");
      return;
    }

    if (selectedAccountIds.length === 0) {
      setErrorMessage("Please select at least one social media account to post to.");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Please enter or generate a post title.");
      return;
    }

    if (!caption.trim()) {
      setErrorMessage("Please enter or generate a post caption.");
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
    const now = new Date();
    if (scheduledDateTime.getTime() <= now.getTime()) {
      setErrorMessage("Cannot schedule post in the past. Please select a future date and time.");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedPlatforms = accounts
        .filter((a) => selectedAccountIds.includes(a.id))
        .map((a) => a.platform);

      const payload = {
        shortId: selectedClip.id,
        title: title.trim(),
        caption: caption.trim(),
        platforms: selectedPlatforms,
        accountIds: selectedAccountIds,
        videoUrl: selectedClip.exportUrl || selectedClip.videoUrl,
        scheduledDate,
        scheduledTime,
        hashtags: hashtags.join(" "),
        thumbnailUrl: null,
      };

      const res = await fetch("/api/schedule/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to schedule post");
      }

      setSuccessScheduled(true);
      onPostScheduled(data.post);

      setTimeout(() => {
        setSuccessScheduled(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Error submitting post schedule:", err);
      setErrorMessage(err?.message || "An error occurred while scheduling the post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter clips for search in picker modal
  const filteredClips = clips.filter((c) =>
    c.title.toLowerCase().includes(clipSearch.toLowerCase()) ||
    (c.hook && c.hook.toLowerCase().includes(clipSearch.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-white/15 bg-gradient-to-b from-[#0f172a] via-[#090d1a] to-[#05070f] text-white shadow-2xl shadow-violet-950/40 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-0.5 shadow-md shadow-violet-600/30 flex items-center justify-center">
              <div className="size-full bg-[#0b0f19] rounded-[14px] flex items-center justify-center">
                <CalendarIcon className="size-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Schedule Short Video Post</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold flex items-center gap-1">
                  <Sparkles className="size-3 text-cyan-400" /> AI Auto-Scheduler
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Target Date: <strong className="text-white font-semibold">{scheduledDate}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Success Banner */}
          {successScheduled && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-3 animate-in zoom-in-95">
              <CheckCircle2 className="size-6 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-base">Short Video Post Scheduled!</p>
                <p className="text-xs text-emerald-300/80">
                  Your post has been scheduled on {scheduledDate} at {scheduledTime}. It will be automatically distributed to your selected platforms.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="size-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. SELECT VIDEO CLIP SECTION (NO DROPDOWNS: LIST PICKER + INLINE PREVIEW) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <span className="size-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[11px]">1</span>
                <span>Selected Video Clip</span>
              </label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsClipPickerOpen(true)}
                className="h-8 px-3 text-xs border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 gap-1.5 rounded-xl font-semibold cursor-pointer"
              >
                <Film className="size-3.5 text-cyan-400" />
                <span>{selectedClip ? "Change Clip from List" : "Select Clip from List"}</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>

            {/* Video Clip Preview Card & Player on Form */}
            {selectedClip ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-950/40 via-indigo-950/30 to-[#0a0f1e] border border-violet-500/40 shadow-xl flex flex-col md:flex-row gap-5 items-start">
                {/* 9:16 Video Player Preview */}
                <div className="relative w-full sm:w-44 aspect-[9/16] rounded-xl overflow-hidden bg-black shrink-0 border border-white/20 shadow-2xl group/player">
                  {selectedClip.exportUrl || selectedClip.videoUrl ? (
                    <video
                      src={selectedClip.exportUrl || selectedClip.videoUrl || ""}
                      controls
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="size-full flex flex-col items-center justify-center bg-zinc-900 text-muted-foreground p-3 text-center">
                      <Film className="size-8 mb-2 text-violet-400" />
                      <span className="text-xs">No video source</span>
                    </div>
                  )}

                  {/* Top pill */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                    9:16 Short
                  </div>
                </div>

                {/* Clip Meta & Details */}
                <div className="flex-1 space-y-2.5 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-mono">
                      <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Rendered & Exported MP4
                    </span>

                    {selectedClip.seoScore && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <Flame className="size-3" />
                        {selectedClip.seoScore}% Virality
                      </span>
                    )}

                    <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                      Duration: {selectedClip.duration || "0:45"}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">
                    {selectedClip.title}
                  </h3>

                  {selectedClip.hook && (
                    <p className="text-xs text-zinc-300 italic bg-white/[0.04] p-2.5 rounded-xl border border-white/5">
                      <strong className="text-cyan-400 not-italic font-semibold">Hook: </strong>
                      &ldquo;{selectedClip.hook}&rdquo;
                    </p>
                  )}

                  {selectedClip.whyReason && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      <strong className="text-violet-300 font-semibold">Virality Factor: </strong>
                      {selectedClip.whyReason}
                    </p>
                  )}

                  {/* Actions row */}
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setIsClipPickerOpen(true)}
                      className="h-8 text-xs border-white/15 bg-white/5 hover:bg-white/10 text-white gap-1.5 rounded-lg"
                    >
                      <RefreshCw className="size-3" />
                      <span>Switch Video Clip</span>
                    </Button>

                    {selectedClip.exportUrl && (
                      <a
                        href={selectedClip.exportUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 hover:underline ml-2"
                      >
                        <span>Open raw video</span>
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* If no clip selected yet: prominent Call-To-Action to browse */
              <div
                onClick={() => setIsClipPickerOpen(true)}
                className="p-8 rounded-2xl border-2 border-dashed border-violet-500/40 bg-violet-950/10 hover:bg-violet-950/20 hover:border-violet-400 transition-all cursor-pointer text-center space-y-3 group"
              >
                <div className="size-12 rounded-2xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center mx-auto text-violet-400 group-hover:scale-110 transition-transform">
                  <Film className="size-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    Click to Select Short Video Clip from List
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                    Choose from your rendered high-retention clips. We'll automatically load the preview and generate your social copy.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-xs font-semibold px-4 pointer-events-none"
                >
                  Browse Video Clips List
                </Button>
              </div>
            )}
          </div>

          {/* 2. SELECT CONNECTED SOCIAL MEDIA ACCOUNTS (NO DROPDOWNS: MULTI-SELECTION TILES WITH ICONS & NAMES) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <span className="size-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[11px]">2</span>
                <span>Select Social Media Destinations ({selectedAccountIds.length} Selected)</span>
              </label>
              <a
                href="/dashboard/social-connections"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
              >
                <span>Manage Accounts</span>
                <ExternalLink className="size-3" />
              </a>
            </div>

            {loadingAccounts ? (
              <div className="py-4 text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin text-violet-400" />
                <span>Checking connected social profiles...</span>
              </div>
            ) : (
              /* Multi-Selection Options with Icon, Name & Handle */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {accounts.map((acc) => {
                  const isChecked = selectedAccountIds.includes(acc.id);
                  const platName = acc.platform.toLowerCase();

                  return (
                    <div
                      key={acc.id}
                      onClick={() => toggleAccount(acc.id)}
                      className={cn(
                        "p-3 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 select-none",
                        isChecked
                          ? "bg-gradient-to-r from-violet-900/40 via-indigo-900/30 to-cyan-900/20 border-violet-500 shadow-md shadow-violet-600/20 ring-1 ring-violet-500"
                          : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06] opacity-70 hover:opacity-100"
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {/* Platform Icon */}
                        <div className="size-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 p-1.5">
                          <PlatformIcon platform={acc.platform} className="size-5" />
                        </div>

                        {/* Name & Handle */}
                        <div className="truncate">
                          <p className="text-xs font-bold text-white capitalize truncate">
                            {acc.accountName || acc.platform}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {acc.username || `@${acc.platform}`}
                          </p>
                        </div>
                      </div>

                      {/* Multi-Select Checkbox Indicator */}
                      <div
                        className={cn(
                          "size-5 rounded-lg border flex items-center justify-center transition-all shrink-0",
                          isChecked
                            ? "bg-gradient-to-r from-violet-600 to-cyan-500 border-cyan-400 text-white shadow-sm"
                            : "border-white/20 bg-white/5"
                        )}
                      >
                        {isChecked && <Check className="size-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. AI POST GENERATOR (OPTION FOR USER TO ENTER/REFINE OR AUTO GENERATE) */}
          <div className="space-y-4 p-5 rounded-2xl bg-[#0b0f1c] border border-white/10">
            {/* AI Mode Selector Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <span className="size-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[11px]">3</span>
                <span>AI Post Content Generator</span>
              </label>

              {/* 2 Mode Tabs */}
              <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setAiMode("auto")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
                    aiMode === "auto"
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
                      : "text-muted-foreground hover:text-white"
                  )}
                >
                  <Sparkles className="size-3.5 text-cyan-400" />
                  <span>Auto-Generate from Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAiMode("refine")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
                    aiMode === "refine"
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
                      : "text-muted-foreground hover:text-white"
                  )}
                >
                  <PenLine className="size-3.5 text-amber-400" />
                  <span>Enter Draft & AI Refine</span>
                </button>
              </div>
            </div>

            {/* If in "Enter Draft & AI Refine" Mode */}
            {aiMode === "refine" && (
              <div className="space-y-3 p-3.5 rounded-xl bg-violet-950/20 border border-violet-500/30 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <PenLine className="size-3.5" />
                    <span>Your Custom Notes / Draft / Angle:</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">AI will elevate this into a viral post</span>
                </div>

                <Textarea
                  rows={2}
                  value={userDraft}
                  onChange={(e) => setUserDraft(e.target.value)}
                  placeholder="e.g. Talk about the biggest mistake in scaling, ask viewers if they agree, keep it punchy and casual..."
                  className="bg-black/40 border-white/15 text-xs text-white rounded-xl placeholder:text-zinc-500 focus:border-violet-500"
                />

                {/* Tone Selectors */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground">Tone:</span>
                    {(
                      [
                        { id: "viral", label: "🔥 Viral & Hooky" },
                        { id: "educational", label: "💡 Value & Tips" },
                        { id: "founder", label: "🚀 Founder Story" },
                        { id: "bold", label: "⚡ Contrarian" },
                      ] as const
                    ).map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setSelectedTone(t.id)}
                        className={cn(
                          "px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer",
                          selectedTone === t.id
                            ? "bg-violet-600/30 border-violet-500 text-violet-300"
                            : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    disabled={isAiGenerating || !selectedClip}
                    onClick={() => generateAiContentForClip(selectedClip, "refine", userDraft)}
                    className="h-7 text-xs bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold gap-1 rounded-lg shadow-sm"
                  >
                    {isAiGenerating ? (
                      <>
                        <Loader2 className="size-3 animate-spin" />
                        <span>Refining...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="size-3" />
                        <span>AI Refine & Polish Draft</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* If in "Auto-Generate" Mode: Quick trigger button */}
            {aiMode === "auto" && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                <span className="text-muted-foreground">
                  AI analyzes clip hook, reasoning, and keywords to write title, caption, and hashtags.
                </span>

                <Button
                  type="button"
                  size="sm"
                  disabled={isAiGenerating || !selectedClip}
                  onClick={() => generateAiContentForClip(selectedClip, "auto", "")}
                  className="h-8 text-xs bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold gap-1.5 rounded-xl shrink-0 cursor-pointer"
                >
                  {isAiGenerating ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin text-white" />
                      <span>Generating Copy...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5 text-cyan-300" />
                      <span>Auto-Generate Viral Copy</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Result: Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">
                  Video Post Title (Optimized for YouTube Shorts, Reels, LinkedIn)
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">{title.length}/70 chars</span>
              </div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Catchy viral short title with hook..."
                className="bg-white/5 border-white/10 rounded-xl text-white text-xs focus:border-violet-500"
              />
            </div>

            {/* Result: Caption */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-zinc-300">
                Post Caption & Description
              </span>
              <Textarea
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="High engagement hook, question, and CTA..."
                className="bg-white/5 border-white/10 rounded-xl text-white text-xs resize-none focus:border-violet-500"
              />
            </div>

            {/* Result: Hashtags */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">
                  Hashtags ({hashtags.length})
                </span>
                <span className="text-[10px] text-cyan-400">Click any tag to remove</span>
              </div>

              <div className="flex flex-wrap gap-1.5 items-center">
                {hashtags.map((tag) => (
                  <span
                    key={tag}
                    onClick={() => handleRemoveHashtag(tag)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-medium cursor-pointer hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300 transition-colors"
                    title="Click to remove"
                  >
                    <span>{tag}</span>
                    <X className="size-2.5 opacity-60 hover:opacity-100" />
                  </span>
                ))}

                {/* Add Custom Tag */}
                <div className="inline-flex items-center gap-1">
                  <Input
                    value={newHashtagInput}
                    onChange={(e) => setNewHashtagInput(e.target.value)}
                    onKeyDown={handleAddHashtag}
                    placeholder="#AddTag + Enter"
                    className="h-7 w-28 bg-white/5 border-white/10 rounded-lg text-xs text-white px-2 py-0"
                  />
                  {newHashtagInput && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddHashtag}
                      className="h-7 px-2 text-[10px] bg-violet-600 hover:bg-violet-500 text-white rounded-lg"
                    >
                      Add
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. DATE AND TIME SELECTOR (DISALLOW PAST DATES & TIMES) */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="size-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[11px]">4</span>
                <span>Publish Date & Time (Future Only)</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-medium">
                Auto-dispatches via Inngest every 15 min
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] text-muted-foreground block mb-1">Date (Today or Future)</span>
                <div className="relative">
                  <Input
                    type="date"
                    min={getTodayStr()}
                    value={scheduledDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      const today = getTodayStr();
                      if (val < today) {
                        setErrorMessage("Cannot schedule on a past date. Date has been reset to today.");
                        setScheduledDate(today);
                      } else {
                        setErrorMessage(null);
                        setScheduledDate(val);
                      }
                    }}
                    className="bg-white/5 border-white/10 rounded-xl text-white text-xs pl-9 focus:border-violet-500"
                  />
                  <CalendarIcon className="size-4 text-violet-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <span className="text-[11px] text-muted-foreground block mb-1">Time</span>
                <div className="relative">
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => {
                      const val = e.target.value;
                      setScheduledTime(val);
                      if (scheduledDate === getTodayStr() && val <= getCurrentTimeStr()) {
                        setErrorMessage("For today, please select a future time.");
                      } else {
                        setErrorMessage(null);
                      }
                    }}
                    className="bg-white/5 border-white/10 rounded-xl text-white text-xs pl-9 focus:border-violet-500"
                  />
                  <Clock className="size-4 text-cyan-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Quick Time Slots (Disable past times for today) */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-muted-foreground">Peak Engagement Times:</span>
              {[
                { label: "⚡ 12:00 PM (Lunch)", time: "12:00" },
                { label: "🔥 6:00 PM (Peak FYP)", time: "18:00" },
                { label: "🌟 7:30 PM (Prime Time)", time: "19:30" },
                { label: "🌙 9:00 PM (Late Night)", time: "21:00" },
              ].map((slot) => {
                const isPastSlot =
                  scheduledDate === getTodayStr() && slot.time <= getCurrentTimeStr();

                return (
                  <button
                    type="button"
                    key={slot.time}
                    disabled={isPastSlot}
                    onClick={() => {
                      if (!isPastSlot) {
                        setScheduledTime(slot.time);
                        setErrorMessage(null);
                      }
                    }}
                    title={isPastSlot ? "Time has already passed today" : slot.label}
                    className={cn(
                      "text-[10px] font-medium px-2.5 py-1 rounded-lg border transition-all select-none",
                      isPastSlot
                        ? "opacity-30 cursor-not-allowed line-through bg-white/[0.02] border-white/5 text-zinc-600"
                        : scheduledTime === slot.time
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 cursor-pointer"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white cursor-pointer"
                    )}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-white text-xs cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={
              isSubmitting ||
              !selectedClip ||
              selectedAccountIds.length === 0 ||
              (scheduledDate === getTodayStr() && scheduledTime <= getCurrentTimeStr())
            }
            onClick={handleScheduleSubmit}
            className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-violet-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin text-white" />
                <span>Saving to Database & Scheduling...</span>
              </>
            ) : (
              <>
                <CalendarIcon className="size-4" />
                <span>Save to Database & Schedule Post</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* DEDICATED DIALOG TO SELECT SHORT VIDEO CLIPS FROM LIST */}
      {isClipPickerOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-white/20 bg-gradient-to-b from-[#131b2e] to-[#090d1a] text-white shadow-2xl overflow-hidden">
            {/* Picker Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Film className="size-5 text-cyan-400" />
                  <span>Select Video Clip from Library</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pick any rendered 9:16 short video clip to schedule and preview.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsClipPickerOpen(false)}
                className="size-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Picker Search Bar */}
            <div className="p-4 border-b border-white/5 bg-white/[0.02]">
              <div className="relative">
                <Search className="size-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
                <Input
                  value={clipSearch}
                  onChange={(e) => setClipSearch(e.target.value)}
                  placeholder="Search short clips by title or hook..."
                  className="bg-white/5 border-white/10 text-xs text-white rounded-xl pl-9"
                />
              </div>
            </div>

            {/* Picker Clips List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {filteredClips.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                  <Film className="size-8 mx-auto text-zinc-600" />
                  <p>No matching video clips found.</p>
                </div>
              ) : (
                filteredClips.map((clip) => {
                  const isCurrent = clip.id === selectedClipId;
                  return (
                    <div
                      key={clip.id}
                      onClick={() => handleSelectClipFromPicker(clip)}
                      className={cn(
                        "p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex items-center justify-between gap-4 group",
                        isCurrent
                          ? "bg-gradient-to-r from-violet-900/40 to-cyan-900/30 border-cyan-400 shadow-md ring-1 ring-cyan-400"
                          : "bg-white/[0.03] border-white/10 hover:border-violet-500/40 hover:bg-white/[0.06]"
                      )}
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        {/* 9:16 Video Icon / Thumbnail Indicator */}
                        <div className="size-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0 text-cyan-400 group-hover:scale-105 transition-transform">
                          <Play className="size-5 fill-current" />
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                              9:16 Short
                            </span>
                            {clip.seoScore && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                                <Flame className="size-2.5" />
                                {clip.seoScore}% Virality
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-zinc-400">
                              {clip.duration || "0:45"}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                            {clip.title}
                          </h4>

                          {clip.hook && (
                            <p className="text-[11px] text-muted-foreground truncate italic">
                              &ldquo;{clip.hook}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Select Action Button */}
                      <Button
                        type="button"
                        size="sm"
                        className={cn(
                          "h-8 text-xs font-semibold px-3 rounded-xl shrink-0 gap-1",
                          isCurrent
                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                            : "bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:from-violet-500 hover:to-cyan-400"
                        )}
                      >
                        {isCurrent ? (
                          <>
                            <Check className="size-3.5 stroke-[3]" />
                            <span>Selected</span>
                          </>
                        ) : (
                          <>
                            <span>Select Clip</span>
                            <ArrowRight className="size-3.5" />
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Picker Footer */}
            <div className="p-4 border-t border-white/10 flex justify-end bg-white/[0.02]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsClipPickerOpen(false)}
                className="text-xs border-white/10"
              >
                Close List
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
