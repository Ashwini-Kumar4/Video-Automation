"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Sparkles,
  Share2,
  Trash2,
  ExternalLink,
  Film,
  Play,
  CheckCircle2,
  Flame,
  X,
  AlertCircle,
  Eye,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SchedulePostModal } from "@/components/dashboard/SchedulePostModal";

interface ScheduledPostItem {
  id: string;
  userId?: string;
  shortId?: string | null;
  title: string;
  caption: string;
  platforms: string[];
  accountIds?: string[];
  videoUrl?: string | null;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  scheduledAt?: string;
  status: string;
  zernioPostId?: string | null;
  errorMessage?: string | null;
  hashtags?: string | null;
  thumbnailUrl?: string | null;
  createdAt?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SchedulePage() {
  // Calendar viewing date (defaults to current month)
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Posts state
  const [posts, setPosts] = useState<ScheduledPostItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Dialog state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<string>("");

  // Post detail preview state
  const [selectedPostDetail, setSelectedPostDetail] = useState<ScheduledPostItem | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [dayViewModal, setDayViewModal] = useState<{ dateStr: string; posts: ScheduledPostItem[] } | null>(null);

  const handleCopyCaption = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2200);
  };

  // Success / notice alert
  const [notification, setNotification] = useState<string | null>(null);
  const [triggeringInngest, setTriggeringInngest] = useState(false);

  // Zernio configuration state
  const [isZernioConfigured, setIsZernioConfigured] = useState<boolean | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [savingKey, setSavingKey] = useState(false);

  // Check if Zernio API key is set
  const checkZernioStatus = async () => {
    try {
      const res = await fetch("/api/zernio/status");
      const data = await res.json();
      setIsZernioConfigured(Boolean(data.configured));
    } catch {
      setIsZernioConfigured(false);
    }
  };

  // Save Zernio API key directly from UI
  const handleSaveZernioKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!apiKeyInput.trim()) return;
    try {
      setSavingKey(true);
      const res = await fetch("/api/zernio/save-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsZernioConfigured(true);
        setApiKeyInput("");
        setNotification("🎉 Zernio API Key saved! Live publishing to Instagram is now ready.");
        await fetchPosts();
      } else {
        setNotification(`Error: ${data.error || "Failed to save API key"}`);
      }
    } catch (err: any) {
      setNotification(`Failed to save key: ${err?.message || err}`);
    } finally {
      setSavingKey(false);
      setTimeout(() => setNotification(null), 6000);
    }
  };

  // Manual trigger for 15-minute Inngest scheduler
  const handleTriggerInngestCheck = async () => {
    try {
      setTriggeringInngest(true);
      const res = await fetch("/api/schedule/dispatch", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setNotification("⚡ Inngest 15-min background scheduler triggered! Scanned database for upcoming posts.");
        await fetchPosts();
      } else {
        setNotification(`Inngest notice: ${data.message || data.error}`);
      }
    } catch (err: any) {
      console.error("Failed to trigger Inngest:", err);
      setNotification("Failed to trigger Inngest scheduler.");
    } finally {
      setTriggeringInngest(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Fetch scheduled posts from API
  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      const res = await fetch("/api/schedule/posts");
      const data = await res.json();
      if (data.success && Array.isArray(data.posts)) {
        // Parse platforms if stored as JSON string
        const parsedPosts: ScheduledPostItem[] = data.posts.map((p: any) => ({
          ...p,
          platforms: Array.isArray(p.platforms)
            ? p.platforms
            : typeof p.platforms === "string"
            ? JSON.parse(p.platforms)
            : ["youtube", "tiktok", "instagram"],
        }));

        // If no posts in DB yet, show default high-performing demo posts
        if (parsedPosts.length === 0) {
          const year = currentDate.getFullYear();
          const monthStr = String(currentDate.getMonth() + 1).padStart(2, "0");
          parsedPosts.push(
            {
              id: "seed-1",
              title: "The #1 Secret to Scaling AI Apps in 2026",
              caption: "Here is why 99% of developers get stuck on features instead of distribution. Watch till the end! 👇",
              platforms: ["youtube", "tiktok", "instagram"],
              videoUrl: "https://s3.ap-southeast-2.amazonaws.com/remotionlambda-apsoutheast2-12ov6bkohs/renders/ryjmxs8rmm/renders/short_gemini_1792557042027_4_1792594883798.mp4",
              scheduledDate: `${year}-${monthStr}-22`,
              scheduledTime: "18:00",
              status: "scheduled",
              hashtags: "#Shorts #AI #TechStartups #Viral",
            },
            {
              id: "seed-2",
              title: "Why More Information Makes You Slower in Business",
              caption: "Analysis paralysis is real. Focus on high-leverage execution. Drop your thoughts below! ⚡",
              platforms: ["youtube", "tiktok"],
              videoUrl: "https://s3.ap-southeast-2.amazonaws.com/remotionlambda-apsoutheast2-12ov6bkohs/renders/09vdvqov1e/renders/short_gemini_1792557042025_1_1792596059952.mp4",
              scheduledDate: `${year}-${monthStr}-25`,
              scheduledTime: "12:30",
              status: "scheduled",
              hashtags: "#Shorts #Entrepreneurship #Productivity",
            },
            {
              id: "seed-3",
              title: "Your Brain Is Fatigued: The Hidden Cost of Scrolling",
              caption: "Protect your dopamine and focus on what actually moves the needle in life.",
              platforms: ["instagram", "tiktok"],
              videoUrl: "https://s3.ap-southeast-2.amazonaws.com/remotionlambda-apsoutheast2-12ov6bkohs/renders/9ua1wxuh09/renders/short_gemini_1792557042028_5_1792595735699.mp4",
              scheduledDate: `${year}-${monthStr}-28`,
              scheduledTime: "19:00",
              status: "scheduled",
              hashtags: "#Focus #DeepWork #MentalClarity #Shorts",
            }
          );
        }

        setPosts(parsedPosts);
      }
    } catch (err) {
      console.error("Failed to load scheduled posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    checkZernioStatus();
  }, []);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Open modal for a specific day
  const handleOpenScheduleForDay = (dateString: string) => {
    const today = new Date();
    const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (dateString && dateString < todayFormatted) {
      setNotification("Cannot schedule posts for past dates. Please pick today or a future date.");
      setTimeout(() => setNotification(null), 4000);
      return;
    }
    setModalDate(dateString || todayFormatted);
    setIsModalOpen(true);
  };

  // Callback when a post is created in modal
  const handlePostScheduled = (newPost: any) => {
    const formattedPost: ScheduledPostItem = {
      ...newPost,
      platforms: Array.isArray(newPost.platforms)
        ? newPost.platforms
        : typeof newPost.platforms === "string"
        ? JSON.parse(newPost.platforms)
        : ["youtube", "tiktok", "instagram"],
    };
    setPosts((prev) => [...prev, formattedPost]);
    setNotification(`Post scheduled for ${formattedPost.scheduledDate} at ${formattedPost.scheduledTime}! Saved to database.`);
    setTimeout(() => setNotification(null), 5000);
  };

  // Delete post handler
  const handleDeletePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/schedule/posts/${postId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        if (selectedPostDetail?.id === postId) {
          setSelectedPostDetail(null);
        }
        setNotification("Scheduled post removed.");
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  // Build grid days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const today = new Date();
    const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const days = [];

    // 1. Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      days.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayFormatted,
        isPast: dateStr < todayFormatted,
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayFormatted,
        isPast: dateStr < todayFormatted,
      });
    }

    // 3. Next month leading days to complete full grid (35 or 42 slots)
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remainingSlots = totalSlots - days.length;
    for (let d = 1; d <= remainingSlots; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayFormatted,
        isPast: dateStr < todayFormatted,
      });
    }

    return days;
  }, [year, month]);

  // Group posts by dateStr
  const postsByDate = useMemo(() => {
    const map: Record<string, ScheduledPostItem[]> = {};
    for (const post of posts) {
      if (!map[post.scheduledDate]) {
        map[post.scheduledDate] = [];
      }
      map[post.scheduledDate].push(post);
    }
    return map;
  }, [posts]);

  // Platform style helper
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "youtube":
      case "youtube_shorts":
        return <span className="size-2 rounded-full bg-red-500 inline-block" title="YouTube Shorts" />;
      case "tiktok":
        return <span className="size-2 rounded-full bg-cyan-400 inline-block" title="TikTok" />;
      case "instagram":
      case "instagram_reels":
        return <span className="size-2 rounded-full bg-pink-500 inline-block" title="Instagram Reels" />;
      case "facebook":
        return <span className="size-2 rounded-full bg-blue-500 inline-block" title="Facebook" />;
      case "linkedin":
        return <span className="size-2 rounded-full bg-sky-400 inline-block" title="LinkedIn" />;
      default:
        return <span className="size-2 rounded-full bg-violet-400 inline-block" title={platform} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="pb-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-600/30">
              <CalendarIcon className="size-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Content Schedule Calendar</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Auto-Publishing
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Inngest: */15m
              </span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Schedule, preview, and auto-post your rendered vertical video shorts to YouTube Shorts, TikTok, and Instagram Reels simultaneously.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            disabled={triggeringInngest}
            onClick={handleTriggerInngestCheck}
            className="border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 hover:text-white gap-1.5 font-medium text-xs cursor-pointer"
            title="Inngest background job runs every 15 min. Click to trigger an immediate check now."
          >
            <Clock className="size-3.5 text-cyan-400" />
            <span>{triggeringInngest ? "Checking Inngest..." : "Trigger Inngest Job"}</span>
          </Button>

          <Link href="/dashboard/social-connections">
            <Button
              size="sm"
              variant="outline"
              className="border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white gap-2 font-medium text-xs"
            >
              <Share2 className="size-3.5" />
              <span>Social Connections</span>
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={() => handleOpenScheduleForDay(calendarDays.find((d) => d.isToday)?.dateStr || "")}
            className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold gap-1.5 shadow-lg shadow-violet-600/30 text-xs px-4"
          >
            <Plus className="size-4" />
            <span>Schedule Post</span>
          </Button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-emerald-400 hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Missing Zernio API Key Banner */}
      {isZernioConfigured === false && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-400 shrink-0" />
              <span className="font-bold text-sm text-white">
                Connect Zernio API Key to Publish to Real Instagram
              </span>
            </div>
            <p className="text-xs text-amber-200/80">
              Your Instagram is connected in Zernio! Enter your Zernio API Key (from your open Zernio dashboard under <strong className="text-amber-300 font-semibold">API Keys</strong>) to enable live publishing.
            </p>
          </div>

          <form onSubmit={handleSaveZernioKey} className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <input
              type="password"
              placeholder="Paste sk_live_... API key"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="bg-black/50 border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 w-full sm:w-[240px]"
            />
            <Button
              type="submit"
              size="sm"
              disabled={savingKey || !apiKeyInput.trim()}
              className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs h-8 px-3 rounded-xl shrink-0 cursor-pointer"
            >
              {savingKey ? "Saving..." : "Save & Activate"}
            </Button>
          </form>
        </div>
      )}

      {/* 2. Month Controls & View Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0c1222] border border-white/10">
        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl bg-white/5 border border-white/10 p-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1 rounded-lg text-xs font-semibold hover:bg-white/10 text-cyan-400 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <h2 className="text-xl font-black text-white tracking-wide">
            {MONTH_NAMES[month]} <span className="text-violet-400">{year}</span>
          </h2>
        </div>

        {/* Quick Month Metrics & Status Color Legend */}
        <div className="flex items-center gap-4 text-xs flex-wrap">
          {/* Status Color Legend */}
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span>Posted Live</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <span className="size-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <span>Scheduled</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-300 font-medium hidden sm:flex">
              <span className="size-2 rounded-full bg-amber-400" />
              <span>Simulation</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="size-2 rounded-full bg-violet-400" />
            <span>
              <strong className="text-white font-bold">{posts.length}</strong> Total Posts
            </span>
          </div>
        </div>
      </div>

      {/* 3. CALENDAR GRID */}
      <div className="rounded-2xl border border-white/10 bg-[#090d1a] overflow-hidden shadow-2xl">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.03] text-center text-xs font-bold text-zinc-400 py-3">
          {DAY_NAMES.map((day) => (
            <div key={day} className="uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Day Blocks Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-white/5 bg-[#080c18]">
          {calendarDays.map((cell) => {
            const dayPosts = postsByDate[cell.dateStr] || [];
            const isToday = cell.isToday;

            return (
              <div
                key={cell.dateStr}
                onClick={() => {
                  if (cell.isPast) return;
                  handleOpenScheduleForDay(cell.dateStr);
                }}
                className={cn(
                  "group relative min-h-[125px] sm:min-h-[145px] p-2 sm:p-2.5 flex flex-col justify-between transition-all duration-200 select-none",
                  cell.isPast
                    ? "bg-[#050811]/90 opacity-40 cursor-not-allowed hover:bg-[#050811]"
                    : cell.isCurrentMonth
                    ? "bg-[#0a0f1d] hover:bg-[#12192e]/90 cursor-pointer"
                    : "bg-[#060913]/70 hover:bg-[#0b1022] opacity-45 hover:opacity-75 cursor-pointer",
                  isToday && "ring-1 ring-inset ring-cyan-500/60 bg-gradient-to-b from-cyan-950/20 via-[#0a0f1d] to-[#0a0f1d]"
                )}
              >
                {/* Cell Header: Day Number + Add Button on Hover (Disabled on Past dates) */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "text-xs font-bold flex items-center justify-center size-6 rounded-lg",
                        isToday
                          ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md shadow-cyan-500/30"
                          : cell.isPast
                          ? "text-zinc-600"
                          : cell.isCurrentMonth
                          ? "text-zinc-200 group-hover:text-white"
                          : "text-zinc-500"
                      )}
                    >
                      {cell.dayNum}
                    </span>

                    {isToday && (
                      <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Today
                      </span>
                    )}

                    {cell.isPast && (
                      <span className="text-[9px] font-medium text-zinc-600 uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.03]">
                        Past
                      </span>
                    )}
                  </div>

                  {/* HOVER: + Add Post Button (Only for today & future) */}
                  {!cell.isPast && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenScheduleForDay(cell.dateStr);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-[10px] font-semibold shadow-md shadow-violet-600/30 transform scale-95 group-hover:scale-100 cursor-pointer"
                      title={`Schedule post for ${cell.dateStr}`}
                    >
                      <Plus className="size-3" />
                      <span className="hidden sm:inline">Add</span>
                    </button>
                  )}
                </div>

                {/* Scheduled & Published Posts in this day block */}
                <div className="space-y-1.5 my-1.5 overflow-hidden">
                  {dayPosts.slice(0, 2).map((post) => {
                    const isPublished = post.status === "published";
                    const isSimulation = post.status === "simulation" || post.zernioPostId?.startsWith("sim_");
                    const isFailed = post.status === "failed";

                    return (
                      <div
                        key={post.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPostDetail(post);
                        }}
                        className={cn(
                          "p-2 rounded-xl transition-all text-left shadow-sm group/card cursor-pointer border select-none",
                          isPublished
                            ? "bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-emerald-900/50 border-emerald-500/50 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20"
                            : isSimulation
                            ? "bg-gradient-to-r from-amber-950/70 via-orange-950/50 to-amber-900/40 border-amber-500/50 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/20"
                            : isFailed
                            ? "bg-gradient-to-r from-rose-950/70 via-red-950/50 to-rose-900/40 border-rose-500/50 hover:border-rose-400"
                            : "bg-gradient-to-r from-violet-950/60 via-indigo-950/50 to-cyan-950/40 border-violet-500/40 hover:border-cyan-400/70 hover:shadow-lg hover:shadow-cyan-500/20"
                        )}
                      >
                        <div className="flex items-center justify-between gap-1 text-[10px]">
                          {isPublished ? (
                            <span className="font-semibold text-emerald-300 flex items-center gap-1 font-mono">
                              <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                              <span className="uppercase text-[9px] font-extrabold tracking-wide">Posted</span>
                            </span>
                          ) : isSimulation ? (
                            <span className="font-semibold text-amber-300 flex items-center gap-1 font-mono">
                              <AlertCircle className="size-3 text-amber-400 shrink-0" />
                              <span className="uppercase text-[9px] font-bold">Sim</span>
                            </span>
                          ) : isFailed ? (
                            <span className="font-semibold text-rose-300 flex items-center gap-1 font-mono">
                              <AlertCircle className="size-3 text-rose-400 shrink-0" />
                              <span className="uppercase text-[9px] font-bold">Failed</span>
                            </span>
                          ) : (
                            <span className="font-mono text-cyan-300 font-semibold flex items-center gap-1">
                              <Clock className="size-3 text-cyan-400 shrink-0" />
                              {post.scheduledTime}
                            </span>
                          )}

                          <div className="flex items-center gap-1 shrink-0">
                            {post.platforms.map((plat) => (
                              <React.Fragment key={plat}>
                                {getPlatformIcon(plat)}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>

                        <p
                          className={cn(
                            "text-[11px] font-medium line-clamp-1 mt-1 transition-colors",
                            isPublished
                              ? "text-emerald-100 group-hover/card:text-white"
                              : isSimulation
                              ? "text-amber-100 group-hover/card:text-white"
                              : "text-zinc-200 group-hover/card:text-cyan-200"
                          )}
                        >
                          {post.title}
                        </p>
                      </div>
                    );
                  })}

                  {/* If more than 2 posts, show expander chip */}
                  {dayPosts.length > 2 && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setDayViewModal({ dateStr: cell.dateStr, posts: dayPosts });
                      }}
                      className="text-[10px] font-semibold text-center text-cyan-300 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 cursor-pointer transition-all"
                    >
                      +{dayPosts.length - 2} more posts
                    </div>
                  )}
                </div>

                {/* Bottom slot indicator */}
                <div className="text-[10px] text-zinc-600 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  {!cell.isPast ? (
                    <span className="text-[9px] text-zinc-500">+ Click to schedule</span>
                  ) : (
                    <span className="text-[9px] text-zinc-600 italic">Past date (disabled)</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. UPCOMING QUEUE LIST SECTION */}
      <div className="bg-[#0c1222] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Clock className="size-5 text-violet-400" />
            <h3 className="text-base font-bold text-white">
              Upcoming Auto-Post Queue ({posts.length})
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            Click on any post to inspect copy or cancel
          </span>
        </div>

        {posts.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-white/10 text-center text-xs text-muted-foreground space-y-2">
            <CalendarIcon className="size-8 mx-auto text-muted-foreground/60" />
            <p className="font-medium text-white">Your schedule queue is empty</p>
            <p>Hover on any day above and click &quot;+ Add&quot; to schedule your first post.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => setSelectedPostDetail(post)}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-violet-500/40 hover:bg-white/[0.05] transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-cyan-300 font-semibold flex items-center gap-1.5">
                      <Clock className="size-3 text-cyan-400" />
                      {post.scheduledDate} at {post.scheduledTime}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                        (post.status === "simulation" || post.zernioPostId?.startsWith("sim_"))
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : post.status === "published"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                          : post.status === "failed"
                          ? "bg-rose-500/15 text-rose-400 border-rose-500/20"
                          : "bg-cyan-500/15 text-cyan-300 border-cyan-500/20"
                      )}
                    >
                      {post.status === "simulation" || post.zernioPostId?.startsWith("sim_")
                        ? "Simulation (Missing API Key)"
                        : post.status === "published"
                        ? "Published"
                        : post.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white line-clamp-1">
                    {post.title}
                  </h4>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {post.caption}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <div className="flex items-center gap-1.5">
                    {post.platforms.map((p) => (
                      <span
                        key={p}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/5 text-zinc-300 uppercase"
                      >
                        {p}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePost(post.id);
                    }}
                    className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Cancel scheduled post"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. SCHEDULE POST MODAL DIALOG */}
      <SchedulePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialDate={modalDate}
        onPostScheduled={handlePostScheduled}
      />

      {/* 6. POST INFORMATION DIALOG MODAL */}
      {selectedPostDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-gradient-to-b from-[#111827] via-[#0b0f1c] to-[#060812] p-6 text-white shadow-2xl space-y-4">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPostDetail(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="size-4" />
            </button>

            {/* Header: Status & Timing */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span
                className={cn(
                  "text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-sm",
                  selectedPostDetail.status === "published"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-950/40"
                    : selectedPostDetail.status === "simulation" || selectedPostDetail.zernioPostId?.startsWith("sim_")
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-950/40"
                    : selectedPostDetail.status === "failed"
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-950/40"
                )}
              >
                {selectedPostDetail.status === "published" ? (
                  <>
                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                    <span>Posted Live on Instagram</span>
                  </>
                ) : selectedPostDetail.status === "simulation" || selectedPostDetail.zernioPostId?.startsWith("sim_") ? (
                  <>
                    <AlertCircle className="size-3.5 text-amber-400" />
                    <span>Simulation Mode</span>
                  </>
                ) : selectedPostDetail.status === "failed" ? (
                  <>
                    <AlertCircle className="size-3.5 text-rose-400" />
                    <span>Publishing Failed</span>
                  </>
                ) : (
                  <>
                    <Clock className="size-3.5 text-cyan-400" />
                    <span>Scheduled Auto-Post</span>
                  </>
                )}
              </span>

              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 flex items-center gap-1 font-mono">
                <Clock className="size-3 text-zinc-400" />
                {selectedPostDetail.scheduledDate} at {selectedPostDetail.scheduledTime}
              </span>
            </div>

            {/* Title */}
            <div>
              <h3 className="text-lg font-black text-white leading-snug">
                {selectedPostDetail.title}
              </h3>
            </div>

            {/* LIVE POST BANNER (If already published) */}
            {selectedPostDetail.status === "published" && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-emerald-900/50 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">Live on Instagram</p>
                    <p className="text-[11px] text-emerald-200/90 truncate">Account: @best_clip_hub0 (Clip HUB)</p>
                  </div>
                </div>
                <a
                  href="https://www.instagram.com/best_clip_hub0/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer"
                >
                  <span>View on Instagram</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            )}

            {/* Video Player Preview if URL is present */}
            {selectedPostDetail.videoUrl && (
              <div className="relative rounded-2xl overflow-hidden bg-black/90 border border-white/10 aspect-video flex items-center justify-center shadow-inner">
                <video
                  src={selectedPostDetail.videoUrl}
                  controls
                  playsInline
                  className="max-h-full max-w-full rounded-xl"
                />
              </div>
            )}

            {/* Post Caption with Copy Button */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Post Caption</p>
                <button
                  type="button"
                  onClick={() => handleCopyCaption(selectedPostDetail.caption)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  {copiedCaption ? (
                    <>
                      <Check className="size-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                {selectedPostDetail.caption}
              </p>
            </div>

            {/* Hashtags */}
            {selectedPostDetail.hashtags && (
              <div className="space-y-1 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Hashtags</p>
                <p className="text-xs text-violet-400 font-mono break-words leading-relaxed">
                  {selectedPostDetail.hashtags}
                </p>
              </div>
            )}

            {/* Target Social Platforms */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Target Channels</p>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedPostDetail.platforms.map((p) => (
                  <span
                    key={p}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white uppercase flex items-center gap-1.5"
                  >
                    {getPlatformIcon(p)}
                    <span>{p}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Zernio ID transparency */}
            {selectedPostDetail.zernioPostId && (
              <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 font-mono pt-1 border-t border-white/5">
                <span>Zernio Social Post ID:</span>
                <span className="text-zinc-300 font-semibold">{selectedPostDetail.zernioPostId}</span>
              </div>
            )}

            {/* Footer Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleDeletePost(selectedPostDetail.id)}
                className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 gap-1.5 text-xs cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                <span>{selectedPostDetail.status === "published" ? "Delete Record" : "Cancel Post"}</span>
              </Button>

              <div className="flex items-center gap-2">
                {selectedPostDetail.status === "published" ? (
                  <a
                    href="https://www.instagram.com/best_clip_hub0/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button
                      type="button"
                      size="sm"
                      className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-black font-bold gap-1.5 text-xs cursor-pointer"
                    >
                      <span>Open on Instagram</span>
                      <ExternalLink className="size-3.5" />
                    </Button>
                  </a>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    disabled={triggeringInngest}
                    onClick={async () => {
                      await handleTriggerInngestCheck();
                      setSelectedPostDetail(null);
                    }}
                    className="bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white gap-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <Clock className="size-3.5" />
                    <span>{triggeringInngest ? "Dispatching..." : "Dispatch / Publish Now"}</span>
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPostDetail(null)}
                  className="border-white/10 text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. DAY POSTS VIEWER MODAL (When clicking +X more posts on a cell) */}
      {dayViewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-gradient-to-b from-[#111827] via-[#0b0f1c] to-[#060812] p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Posts on {dayViewModal.dateStr}</h3>
                <p className="text-xs text-muted-foreground">{dayViewModal.posts.length} posts scheduled for this day</p>
              </div>
              <button
                onClick={() => setDayViewModal(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {dayViewModal.posts.map((post) => {
                const isPublished = post.status === "published";
                return (
                  <div
                    key={post.id}
                    onClick={() => {
                      setDayViewModal(null);
                      setSelectedPostDetail(post);
                    }}
                    className={cn(
                      "p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3",
                      isPublished
                        ? "bg-emerald-950/40 border-emerald-500/40 hover:bg-emerald-950/60"
                        : "bg-white/[0.04] border-white/10 hover:bg-white/[0.08]"
                    )}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono text-cyan-300">
                          {post.scheduledTime}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                            isPublished
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                          )}
                        >
                          {isPublished ? "Posted Live" : post.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-white line-clamp-1">{post.title}</h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {post.platforms.map((plat) => (
                        <React.Fragment key={plat}>
                          {getPlatformIcon(plat)}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDayViewModal(null)}
                className="border-white/10 text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
