"use client";

import {
  Sparkles,
  Play,
  Download,
  Share2,
  TrendingUp,
  Clock,
  Flame,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoUploadHero } from "@/components/dashboard/VideoUploadHero";

interface DashboardWorkspaceProps {
  userEmail?: string | null;
  userFirstName?: string | null;
}

export function DashboardWorkspace({
  userEmail,
  userFirstName,
}: DashboardWorkspaceProps) {

  const recentClips = [
    {
      id: "clip-1",
      title: "The #1 Secret to Scaling AI Apps in 2026",
      source: "Podcast Episode #42 (1h 14m)",
      virality: 96,
      duration: "0:44",
      aspect: "9:16",
      hook: "High retention hook detected at 14:22",
      badge: "Trending Hot",
      color: "from-amber-500/20 to-rose-500/20 border-amber-500/30",
    },
    {
      id: "clip-2",
      title: "Why Most Startups Fail at Product-Market Fit",
      source: "Tech Keynote Livestream (48m)",
      virality: 92,
      duration: "0:58",
      aspect: "9:16",
      hook: "Emotional climax identified at 28:10",
      badge: "High Virality",
      color: "from-violet-500/20 to-purple-500/20 border-violet-500/30",
    },
    {
      id: "clip-3",
      title: "3 Productivity Hacks You Never Knew",
      source: "Masterclass Workshop (2h 05m)",
      virality: 88,
      duration: "0:32",
      aspect: "9:16",
      hook: "Curiosity loop detected at 04:15",
      badge: "Ready",
      color: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-violet-950/40 via-background to-cyan-950/40 p-6 sm:p-8">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-semibold mb-3">
              <Sparkles className="size-3 text-cyan-400" />
              <span>Clerk Authenticated Session Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome back, {userFirstName || "Creator"}! 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Turn any long-form video or podcast into high-converting short clips for
              TikTok, Instagram Reels, and YouTube Shorts in minutes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 hover:bg-white/10 text-xs"
              onClick={() => alert("VidShorts Documentation: Auto Scene Cut, Voice AI & Reframe")}
            >
              API & Docs
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold text-xs shadow-lg shadow-violet-600/25"
            >
              <Flame className="size-3.5 mr-1 text-amber-300" />
              Upgrade Plan
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Videos Processed
            </p>
            <p className="text-2xl font-black text-white mt-1">12</p>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <TrendingUp className="size-3" /> +4 this week
            </span>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Viral Clips Created
            </p>
            <p className="text-2xl font-black bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mt-1">
              48
            </p>
            <span className="text-[11px] text-muted-foreground mt-0.5">
              Avg 4 clips / video
            </span>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Estimated Views
            </p>
            <p className="text-2xl font-black text-white mt-1">2.4M</p>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <TrendingUp className="size-3" /> 84% above avg
            </span>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Editing Time Saved
            </p>
            <p className="text-2xl font-black text-white mt-1">38 hrs</p>
            <span className="text-[11px] text-violet-300 flex items-center gap-1 mt-0.5">
              <Clock className="size-3" /> 95% faster
            </span>
          </div>
        </div>
      </div>

      {/* Hero Video Upload Studio */}
      <VideoUploadHero
        userFirstName={userFirstName}
        onGenerateClips={() => {
          const clipsSection = document.getElementById("clips");
          if (clipsSection) {
            clipsSection.scrollIntoView({ behavior: "smooth" });
          }
        }}
      />

      {/* Engine Specs & System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-2xl border border-white/10 bg-[#0c1222]/80 backdrop-blur-xl p-6 space-y-4 shadow-xl shadow-black/40">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="size-4 text-cyan-400" />
              AI Intelligence Engine v2.5
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300">
              Active Pipeline Online
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            VidShorts uses multimodal visual attention analysis to identify high-retention moments, laughter peaks, key soundbites, and dramatic pauses automatically.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[11px] text-muted-foreground">Scene Detection</p>
              <p className="text-xs font-bold text-emerald-400 mt-1">Gemini 2.5 Flash</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[11px] text-muted-foreground">Face Tracking</p>
              <p className="text-xs font-bold text-cyan-400 mt-1">Active Speaker 9:16</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[11px] text-muted-foreground">Subtitle Engine</p>
              <p className="text-xs font-bold text-violet-400 mt-1">Whisper 99.2% Acc</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[11px] text-muted-foreground">B-Roll Auto Insert</p>
              <p className="text-xs font-bold text-white mt-1">Enabled</p>
            </div>
          </div>
        </div>

        {/* User Account Info card */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-xl p-6 text-xs text-muted-foreground space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-white">Active Session</p>
              <span className="px-2 py-0.5 rounded text-[10px] bg-violet-500/20 text-violet-300 font-semibold">
                Clerk Verified
              </span>
            </div>
            <p className="truncate text-violet-300 font-mono text-xs">
              {userEmail || "user@vidshorts.ai"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              Unlimited uploads included in Studio tier. All files processed via encrypted cloud buckets.
            </p>
          </div>
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Cloud Storage Used</span>
            <span className="font-bold text-white">1.8 GB / 100 GB</span>
          </div>
        </div>
      </div>

      {/* Generated Clips Showcase */}
      <div id="clips" className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Film className="size-5 text-violet-400" />
              Ready Viral Clips
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review, fine-tune captions, and export directly to TikTok, Reels, or YouTube Shorts.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">Showing 3 latest clips</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentClips.map((clip) => (
            <div
              key={clip.id}
              className={`rounded-xl border bg-gradient-to-b ${clip.color} bg-[#0c1222]/90 backdrop-blur-xl p-4 space-y-3 hover:border-violet-500/50 transition-all duration-300 group shadow-md`}
            >
              {/* Fake Video Preview Thumbnail */}
              <div className="relative aspect-[9/11] w-full rounded-lg bg-black/80 border border-white/10 overflow-hidden flex flex-col justify-between p-3 group-hover:scale-[1.01] transition-transform">
                <div className="flex items-center justify-between z-10">
                  <span className="px-2 py-0.5 rounded-full bg-violet-600/80 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-wider">
                    {clip.aspect}
                  </span>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                    <TrendingUp className="size-2.5" />
                    {clip.virality}% Score
                  </div>
                </div>

                {/* Center play icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="size-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:bg-violet-600 transition-colors shadow-lg">
                    <Play className="size-4 text-white fill-current translate-x-0.5" />
                  </div>
                </div>

                {/* Subtitle simulation in bottom of preview */}
                <div className="z-10 text-center">
                  <span className="inline-block bg-black/80 px-2 py-0.5 rounded text-[10px] font-black text-amber-300 uppercase tracking-wide border border-amber-400/30">
                    &ldquo;THIS IS HOW YOU SCALE!&rdquo;
                  </span>
                  <p className="text-[9px] text-white/70 mt-0.5 font-mono">{clip.duration}</p>
                </div>
              </div>

              {/* Clip Metadata */}
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-violet-300 transition-colors leading-snug">
                  {clip.title}
                </h4>
                <p className="text-[10px] text-muted-foreground truncate">{clip.source}</p>
                <p className="text-[10px] text-cyan-400/90 font-medium">{clip.hook}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-white/15 hover:bg-white/10 text-[11px] h-8 rounded-lg"
                  onClick={() => alert(`Downloading "${clip.title}" (1080x1920 MP4)`)}
                >
                  <Download className="size-3 mr-1" />
                  Download
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-[11px] h-8 rounded-lg font-semibold"
                  onClick={() => alert(`Publishing "${clip.title}" to connected social channels.`)}
                >
                  <Share2 className="size-3 mr-1" />
                  Publish
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
