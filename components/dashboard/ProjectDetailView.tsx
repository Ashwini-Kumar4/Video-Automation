"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Sparkles,
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle,
  Copy,
  Check,
  Download,
  Flame,
  FileText,
  Subtitles,
  Scissors,
  Share2,
  ExternalLink,
  Layers,
  Search,
  Code2,
  CheckCheck,
  RefreshCw,
  Sliders,
  Calendar,
  Send,
  Video as VideoIcon,
  Cpu,
  TrendingUp,
  Tag,
  Hash,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScheduleModal } from "@/components/dashboard/ScheduleModal";
import { EditShortCaptionModal } from "@/components/dashboard/EditShortCaptionModal";
import { RenderProgressModal } from "@/components/dashboard/RenderProgressModal";
import { parseCaptionStyleFromDb } from "@/config/caption-styles";
import { CaptionSegment } from "@/components/remotion/ShortVideoComposition";

// Dynamic Client-Only Import of Remotion Player to avoid SSR hydration issues
const RemotionShortPlayer = dynamic(
  () =>
    import("@/components/remotion/RemotionShortPlayer").then(
      (mod) => mod.RemotionShortPlayer
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-md aspect-[9/16] rounded-3xl bg-[#090d1a] border-2 border-white/10 flex flex-col items-center justify-center p-6 text-center space-y-3 animate-pulse">
        <div className="size-14 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
          <div className="size-6 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
        </div>
        <p className="text-xs font-semibold text-slate-300">
          Loading Remotion Short Player...
        </p>
      </div>
    ),
  }
);

export interface ProjectData {
  id: string;
  userId: string;
  title: string;
  originalFileName?: string;
  fileSize?: string;
  duration?: string;
  durationSeconds?: number;
  resolution?: string;
  format?: string;
  aspectRatio?: string;
  clipLength?: string;
  captionPreset?: string;
  sourceType?: string;
  sourceUrl?: string;
  status: string;
  progress: number;
  stage?: string;
  errorMessage?: string;
  s3Bucket?: string;
  s3Key?: string;
  s3Url?: string;
  signedUrl?: string;
  inngestEventId?: string;
  transcript?: string;
  transcriptData?: string;
  captions?: string;
  captionsSrt?: string;
  captionsVtt?: string;
  aiAnalysisStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedShort {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  duration: string;
  whyReason: string;
  seoScore: number;
  seoKeywords: string[];
  hook: string;
  captions: CaptionSegment[];
  captionsSrt?: string;
  captionsVtt?: string;
  videoUrl?: string;
  captionPreset?: string;
  captionStyle?: string;
  exportUrl?: string | null;
  renderStatus?: string;
  renderProgress?: number;
  renderStage?: string | null;
}

interface ProjectDetailViewProps {
  initialProject: ProjectData;
  initialShorts?: any[];
}

export function ProjectDetailView({
  initialProject,
  initialShorts = [],
}: ProjectDetailViewProps) {
  const [project, setProject] = useState<ProjectData>(initialProject);
  const [selectedShortIndex, setSelectedShortIndex] = useState(0);
  const [activeBottomTab, setActiveBottomTab] = useState<
    "all_shorts" | "transcript" | "captions" | "source_video" | "inngest"
  >("all_shorts");

  // Schedule modal state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Edit short modal state
  const [editingShort, setEditingShort] = useState<ParsedShort | null>(null);

  // Copy states
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Source video player state (for side-by-side comparison tab)
  const sourceVideoRef = useRef<HTMLVideoElement>(null);
  const [isSourcePlaying, setIsSourcePlaying] = useState(false);

  // Parse shorts helper
  const parseRawShorts = (rawList: any[]): ParsedShort[] => {
    return rawList.map((s, idx) => {
      let parsedCaps: CaptionSegment[] = [];
      if (typeof s.captions === "string") {
        try {
          parsedCaps = JSON.parse(s.captions);
        } catch {
          parsedCaps = [];
        }
      } else if (Array.isArray(s.captions)) {
        parsedCaps = s.captions;
      }

      let parsedTags: string[] = ["#shorts", "#viral"];
      if (typeof s.seoKeywords === "string") {
        try {
          parsedTags = JSON.parse(s.seoKeywords);
        } catch {
          parsedTags = ["#shorts", "#viral"];
        }
      } else if (Array.isArray(s.seoKeywords)) {
        parsedTags = s.seoKeywords;
      }

      const durSec = s.durationSeconds || Math.max(1, (s.endTime || 30) - (s.startTime || 0));
      const mins = Math.floor(durSec / 60);
      const secs = Math.floor(durSec % 60);

      return {
        id: s.id || `short-${idx + 1}`,
        projectId: s.projectId || project.id,
        title: s.title || `Viral Short #${idx + 1}`,
        description: s.description || s.whyReason || "",
        startTime: Number(s.startTime) || 0,
        endTime: Number(s.endTime) || 30,
        durationSeconds: durSec,
        duration: s.duration || `${mins}:${secs.toString().padStart(2, "0")}`,
        whyReason:
          s.whyReason ||
          s.description ||
          "High retention moment featuring strong curiosity loops and engaging takeaways.",
        seoScore: Number(s.seoScore) || 92,
        seoKeywords: parsedTags,
        hook: s.hook || "Pattern interrupt hook identified by AI",
        captions: parsedCaps,
        captionsSrt: s.captionsSrt,
        captionsVtt: s.captionsVtt,
        videoUrl: s.videoUrl,
        captionPreset: s.captionPreset || "hormozi",
        captionStyle: s.captionStyle || undefined,
        exportUrl: s.exportUrl || null,
        renderStatus: s.renderStatus || "idle",
        renderProgress: typeof s.renderProgress === "number" ? s.renderProgress : 0,
        renderStage: s.renderStage || null,
      };
    });
  };

  const [renderingShort, setRenderingShort] = useState<ParsedShort | null>(null);

  const [shorts, setShorts] = useState<ParsedShort[]>(() => {
    if (initialShorts && initialShorts.length > 0) {
      return parseRawShorts(initialShorts);
    }
    return [];
  });


  // Synchronize state when initialShorts or initialProject changes from server
  useEffect(() => {
    if (initialShorts && initialShorts.length > 0) {
      setShorts(parseRawShorts(initialShorts));
    }
  }, [initialShorts]);

  useEffect(() => {
    if (initialProject) {
      setProject(initialProject);
    }
  }, [initialProject]);

  // Polling for live Inngest workflow status updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const pollProject = async () => {
      try {
        const res = await fetch(`/api/projects/${project.id}`);
        const data = await res.json();
        if (data.success && data.project) {
          setProject(data.project);

          if (data.shorts && Array.isArray(data.shorts) && data.shorts.length > 0) {
            setShorts(parseRawShorts(data.shorts));
          }

          if (
            (data.project.status === "completed" || data.project.aiAnalysisStatus === "completed") &&
            data.shorts &&
            data.shorts.length > 0
          ) {
            if (intervalId) clearInterval(intervalId);
          }
        }
      } catch (err) {
        console.warn("Polling error for project:", err);
      }
    };

    pollProject();

    const isRunning =
      shorts.length === 0 ||
      project.status === "uploading" ||
      project.status === "processing" ||
      project.status === "queued" ||
      project.aiAnalysisStatus === "queued" ||
      project.aiAnalysisStatus === "analyzing" ||
      project.aiAnalysisStatus === "transcribing" ||
      project.aiAnalysisStatus === "generating_captions" ||
      project.aiAnalysisStatus === "generating_shorts" ||
      (project.progress > 0 && project.progress < 100);

    if (isRunning) {
      intervalId = setInterval(pollProject, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [project.id, project.status, project.aiAnalysisStatus, project.progress, shorts.length]);

  // Active Short Selection
  const activeShort = shorts[selectedShortIndex] || shorts[0];

  // Effective Video URL:
  // Always use the server-side stream proxy which generates a fresh S3 presigned URL on each request.
  // Direct S3 presigned URLs can expire and have CORS restrictions that block browser media loading.
  const videoSrc = useMemo(() => {
    // 1. Use the stream proxy for any project with an S3 key (most reliable - no CORS, no expiry)
    if (project.id && project.s3Key) {
      return `/api/projects/${project.id}/stream`;
    }
    // 2. Direct signed URL from S3 as secondary option
    if (project.signedUrl && !project.signedUrl.startsWith("blob:")) {
      return project.signedUrl;
    }
    // 3. Other URL fallbacks
    return (
      project.s3Url ||
      project.sourceUrl ||
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    );
  }, [project.id, project.s3Key, project.signedUrl, project.s3Url, project.sourceUrl]);

  // Re-run AI Analysis
  const handleTriggerAnalysis = async () => {
    setIsReanalyzing(true);
    setShorts([]);
    setSelectedShortIndex(0);
    try {
      const res = await fetch(`/api/projects/${project.id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: project.signedUrl || project.s3Url || project.sourceUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProject((prev) => ({
          ...prev,
          aiAnalysisStatus: "analyzing",
          progress: 15,
          stage: "Inngest workflow triggered: Transcribing with Deepgram Nova-2...",
        }));
      }
    } catch (err) {
      console.error("Failed to re-trigger analysis:", err);
    } finally {
      setIsReanalyzing(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Download Short Video or Text helper
  const handleDownloadShort = (clip: ParsedShort) => {
    // 1. If exportUrl is already generated and present, download directly
    if (clip.exportUrl) {
      setDownloadNotice(`Downloading rendered video "${clip.title}"...`);
      const link = document.createElement("a");
      link.href = clip.exportUrl;
      link.download = `${clip.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_9x16.mp4`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => setDownloadNotice(null), 4000);
      return;
    }

    // 2. If exportUrl is not yet generated, open the Remotion Lambda render modal & trigger Inngest render
    setRenderingShort(clip);
  };

  const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Check if shorts are ready to be displayed
  const isShortsReady =
    shorts.length > 0 &&
    (project.status === "completed" ||
      project.aiAnalysisStatus === "completed" ||
      project.progress >= 95);

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Top Navigation Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 hover:text-white transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Studio Workspace</span>
            </Link>
            <span>/</span>
            <span className="text-violet-400 font-medium">Shorts Studio</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{project.title}</span>
            </h1>

            {/* Status Chip */}
            {isShortsReady ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                <CheckCircle className="size-3.5 text-emerald-400" />
                <span>{shorts.length} Viral Shorts Ready</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30 animate-pulse">
                <span className="size-2 rounded-full bg-cyan-400 animate-ping" />
                <span>AI Processing: {project.stage || "Analyzing video..."}</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTriggerAnalysis}
            disabled={isReanalyzing}
            className="border-white/10 hover:bg-white/10 text-xs text-slate-300 flex items-center gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${isReanalyzing ? "animate-spin" : ""}`} />
            <span>Re-analyze</span>
          </Button>

          {project.captionsSrt && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadTextFile(project.captionsSrt!, `${project.title || "video"}.srt`)
              }
              className="border-white/10 hover:bg-white/10 text-xs text-cyan-300 flex items-center gap-1.5"
            >
              <Download className="size-3.5" />
              <span>Export Full SRT</span>
            </Button>
          )}

          <Link href="/dashboard">
            <Button
              size="sm"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/25"
            >
              <span>+ Upload New Video</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Download Alert Notification */}
      {downloadNotice && (
        <div className="p-3.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-200 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Download className="size-4 animate-bounce text-cyan-400" />
            <span>{downloadNotice}</span>
          </div>
          <span className="text-[10px] text-cyan-400/80 font-mono">9:16 Vertical Export</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CASE 1: PROCESSING IN PROGRESS (Show Progress Stepper ONLY while running)   */}
      {/* ========================================================================= */}
      {!isShortsReady && (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#11162b]/95 via-[#0d1222]/95 to-[#080c18]/95 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-cyan-400">
                <Cpu className="size-4" />
                <span>AI Video Pipeline In Progress</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                {project.stage || "Extracting high retention moments..."}
              </h3>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs font-semibold text-muted-foreground block">Progress</span>
                <span className="text-2xl font-black bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent font-mono">
                  {project.progress}%
                </span>
              </div>
              <div className="w-32 h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                title: "1. Cloud Ingestion",
                desc: "AWS S3 signed stream",
                done: Boolean(project.s3Key || project.status === "completed"),
              },
              {
                title: "2. Deepgram STT",
                desc: "Word-level timestamps",
                done: Boolean(project.transcript),
              },
              {
                title: "3. Kinetic Subtitles",
                desc: "Dynamic cue cards",
                done: Boolean(project.captions),
              },
              {
                title: "4. Gemini Viral Shorts",
                desc: "Start/End & SEO virality",
                done: Boolean(shorts.length > 0),
              },
            ].map((stg, i) => (
              <div
                key={stg.title}
                className={`p-3.5 rounded-2xl border transition-all ${
                  stg.done
                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-200"
                    : "bg-white/[0.02] border-white/5 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">{stg.title}</span>
                  {stg.done ? (
                    <Check className="size-4 text-emerald-400 stroke-[3]" />
                  ) : (
                    <div className="size-2 rounded-full bg-violet-400 animate-ping" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">{stg.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center py-4 text-xs text-slate-400 font-mono">
            <span>The short video player will appear automatically as soon as generation completes...</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CASE 2: SHORTS READY (Progress Bar is REMOVED! Short Video Player is HERO)  */}
      {/* ========================================================================= */}
      {isShortsReady && (
        <div className="space-y-6">
          {/* Main Short Studio Split Grid: Remotion Player (Left) + Virality Intelligence (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: 9:16 Remotion Player (5 Cols on LG) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full">
                <RemotionShortPlayer
                  videoUrl={videoSrc}
                  startTime={activeShort.startTime}
                  endTime={activeShort.endTime}
                  captions={activeShort.captions}
                  title={activeShort.title}
                  hook={activeShort.hook}
                  seoScore={activeShort.seoScore}
                  captionPreset={activeShort.captionPreset || "hormozi"}
                  captionCustomStyle={parseCaptionStyleFromDb(
                    activeShort.captionPreset,
                    activeShort.captionStyle
                  )}
                />
              </div>
            </div>

            {/* RIGHT COLUMN: Active Short Intelligence & Action Controls (7 Cols on LG) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Short Clip Selector Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {shorts.map((clip, index) => {
                  const isSelected = selectedShortIndex === index;
                  return (
                    <button
                      key={clip.id}
                      type="button"
                      onClick={() => setSelectedShortIndex(index)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md shadow-violet-600/30 scale-[1.02]"
                          : "bg-white/[0.04] hover:bg-white/10 text-muted-foreground hover:text-white border border-white/5"
                      }`}
                    >
                      <Flame
                        className={`size-3 ${
                          isSelected ? "text-amber-300" : "text-amber-400/60"
                        }`}
                      />
                      <span>Short #{index + 1}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                          isSelected
                            ? "bg-black/30 text-white"
                            : "bg-white/10 text-slate-300"
                        }`}
                      >
                        {clip.seoScore}/100
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Short Overview Card */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#11162b]/80 via-[#0c1020]/80 to-[#080b16]/80 p-4 sm:p-5 space-y-3.5 backdrop-blur-xl shadow-xl">
                {/* Title & Timing Meta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="size-5 rounded-md bg-violet-600 text-white text-[11px] font-black flex items-center justify-center font-mono">
                        #{selectedShortIndex + 1}
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                        {activeShort.title}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground font-mono">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Clock className="size-3 text-cyan-400" />
                        <span>Duration: {activeShort.duration}</span>
                      </span>
                      <span>•</span>
                      <span>
                        Window: {activeShort.startTime}s - {activeShort.endTime}s
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    {/* Edit Captions & Style Quick Button */}
                    <button
                      type="button"
                      onClick={() => setEditingShort(activeShort)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 transition-all hover:scale-[1.02] shadow-sm"
                      title="Edit caption styling, font & animations in Remotion"
                    >
                      <Sliders className="size-3.5 text-amber-400" />
                      <span>Edit Captions</span>
                    </button>

                    {/* Virality Score Badge */}
                    <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5">
                      <Flame className="size-4 text-amber-400 animate-pulse" />
                      <div>
                        <span className="text-[9px] uppercase font-bold text-amber-300 block leading-tight">
                          Virality Score
                        </span>
                        <span className="text-base font-black text-white font-mono leading-tight">
                          {activeShort.seoScore}
                          <span className="text-[10px] text-amber-400/80"> / 100</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Virality Breakdown Metrics */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5">
                    <span className="text-[10px] font-medium text-slate-400 block">
                      Hook Strength
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">98% Peak</span>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5">
                    <span className="text-[10px] font-medium text-slate-400 block">
                      Est. Retention
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-cyan-400 font-mono">87% - 94%</span>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5">
                    <span className="text-[10px] font-medium text-slate-400 block">
                      Shareability
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-amber-300 font-mono">Top 2%</span>
                  </div>
                </div>

                {/* "Why This Short Video Is Important" Card */}
                <div className="rounded-xl bg-violet-600/10 border border-violet-500/25 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-violet-300 uppercase tracking-wide">
                    <Sparkles className="size-3 text-violet-400" />
                    <span>Why This Short Is Viral</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-normal font-sans">
                    {activeShort.whyReason}
                  </p>
                </div>

                {/* Opening Hook Breakdown */}
                {activeShort.hook && (
                  <div className="rounded-xl bg-black/40 border border-white/10 p-2.5 space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <Flame className="size-3" />
                      Opening Pattern Interrupt Hook:
                    </span>
                    <p className="text-xs font-medium text-white italic leading-snug">
                      "{activeShort.hook}"
                    </p>
                  </div>
                )}

                {/* SEO Keywords & Hashtags */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Hash className="size-3 text-cyan-400" />
                      Viral Hashtags & SEO Keywords:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(activeShort.seoKeywords.join(" "), "tags")
                      }
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                    >
                      {copiedField === "tags" ? (
                        <>
                          <Check className="size-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          <span>Copy All Tags</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {activeShort.seoKeywords.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium bg-black/40 text-cyan-300 border border-cyan-500/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* High Impact Action Buttons: Edit, Download & Schedule */}
                <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-white/10">
                  <Button
                    onClick={() => setEditingShort(activeShort)}
                    className="flex-1 min-w-[130px] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 h-8 sm:h-9 rounded-lg"
                  >
                    <Sliders className="size-3.5" />
                    <span>Edit Captions</span>
                  </Button>

                  <Button
                    onClick={() => handleDownloadShort(activeShort)}
                    className={`flex-1 min-w-[130px] font-bold text-xs shadow-md flex items-center justify-center gap-1.5 h-8 sm:h-9 rounded-lg transition-all ${
                      activeShort?.exportUrl
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30"
                        : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-600/30"
                    }`}
                  >
                    {activeShort?.exportUrl ? (
                      <>
                        <Download className="size-3.5" />
                        <span>Download Short</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-3.5 text-cyan-300" />
                        <span>Render & Download</span>
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => setIsScheduleOpen(true)}
                    className="flex-1 min-w-[130px] bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md shadow-cyan-600/30 flex items-center justify-center gap-1.5 h-8 sm:h-9 rounded-lg"
                  >
                    <Calendar className="size-3.5" />
                    <span>Schedule Post</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      const viralPackage = `${activeShort.title}\n\nHook: ${activeShort.hook}\n\n${activeShort.whyReason}\n\n${activeShort.seoKeywords.join(" ")}`;
                      copyToClipboard(viralPackage, "package");
                    }}
                    className="border-white/15 hover:bg-white/10 text-xs text-slate-200 flex items-center gap-1.5 h-8 sm:h-9 rounded-lg"
                  >
                    {copiedField === "package" ? (
                      <>
                        <Check className="size-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Subordinate Tabs Section Below Hero */}
          <div className="space-y-4 pt-6 border-t border-white/10">
            {/* Tabs Bar */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md overflow-x-auto">
              {[
                { id: "all_shorts", label: `All Generated Shorts (${shorts.length})`, icon: Flame },
                { id: "transcript", label: "Deepgram Transcript", icon: FileText },
                { id: "captions", label: `Captions (${activeShort.captions.length} cues)`, icon: Subtitles },
                { id: "source_video", label: "Original 16:9 Video", icon: VideoIcon },
                { id: "inngest", label: "Inngest Pipeline Payload", icon: Code2 },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeBottomTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveBottomTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: ALL SHORTS GALLERY */}
            {activeBottomTab === "all_shorts" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {shorts.map((clip, idx) => (
                  <div
                    key={clip.id}
                    onClick={() => {
                      setSelectedShortIndex(idx);
                      window.scrollTo({ top: 120, behavior: "smooth" });
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      selectedShortIndex === idx
                        ? "bg-violet-600/15 border-violet-500 shadow-lg shadow-violet-600/20"
                        : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="size-5 rounded-md bg-violet-600 text-white text-[11px] font-black flex items-center justify-center font-mono">
                        #{idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                        Virality: {clip.seoScore}/100
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1 leading-snug">
                      {clip.title}
                    </h4>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {clip.whyReason}
                    </p>

                    <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[10px] font-mono">
                      <div className="flex items-center gap-1.5 text-cyan-400">
                        <span>{clip.duration}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">
                          {clip.startTime}s - {clip.endTime}s
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedShortIndex(idx);
                            setEditingShort(clip);
                          }}
                          className="px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/35 text-[10px] font-sans font-bold flex items-center gap-1 transition-colors"
                          title="Edit caption styling, font & animations"
                        >
                          <Sliders className="size-2.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedShortIndex(idx);
                            handleDownloadShort(clip);
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-sans font-bold flex items-center gap-1 transition-colors ${
                            clip.exportUrl
                              ? "bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/35"
                              : "bg-violet-500/15 hover:bg-violet-500/30 text-violet-300 border border-violet-500/35"
                          }`}
                          title={clip.exportUrl ? "Download rendered short" : "Render short with Remotion Lambda"}
                        >
                          <Download className="size-2.5" />
                          <span>{clip.exportUrl ? "Download" : "Render"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: DEEPGRAM FULL TRANSCRIPT */}
            {activeBottomTab === "transcript" && (
              <div className="rounded-2xl border border-white/10 bg-[#0a0e1c] p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="size-4 text-cyan-400" />
                      Deepgram Nova-2 Audio Transcription
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Full audio speech transcribed with word-level timestamps
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (project.transcript) {
                        copyToClipboard(project.transcript, "fullTranscript");
                      }
                    }}
                    className="border-white/10 text-xs"
                  >
                    {copiedField === "fullTranscript" ? (
                      <Check className="size-3 text-emerald-400 mr-1" />
                    ) : (
                      <Copy className="size-3 mr-1" />
                    )}
                    <span>Copy Full Transcript</span>
                  </Button>
                </div>

                <div className="max-h-[350px] overflow-y-auto text-xs leading-relaxed text-slate-300 font-sans whitespace-pre-wrap">
                  {project.transcript || "Transcription complete."}
                </div>
              </div>
            )}

            {/* TAB 3: CAPTIONS TIMELINE */}
            {activeBottomTab === "captions" && (
              <div className="rounded-2xl border border-white/10 bg-[#0a0e1c] p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Subtitles className="size-4 text-emerald-400" />
                      Kinetic Subtitles for Short #{selectedShortIndex + 1}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Synchronized word-level cues displayed on the Remotion Player
                    </p>
                  </div>

                  {activeShort.captionsSrt && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        downloadTextFile(
                          activeShort.captionsSrt!,
                          `${activeShort.title || "short"}.srt`
                        )
                      }
                      className="border-white/10 text-xs text-cyan-300"
                    >
                      <Download className="size-3 mr-1" />
                      <span>Download Clip SRT</span>
                    </Button>
                  )}
                </div>

                <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
                  {activeShort.captions.length > 0 ? (
                    activeShort.captions.map((cap) => (
                      <div
                        key={cap.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] font-mono text-muted-foreground">
                            #{cap.id}
                          </span>
                          <span className="text-xs font-semibold text-white">{cap.text}</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-cyan-300 border border-white/5">
                          {cap.start}s - {cap.end}s
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      Captions automatically generated and synced with Remotion audio.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: ORIGINAL SOURCE VIDEO */}
            {activeBottomTab === "source_video" && (
              <div className="rounded-2xl border border-white/10 bg-[#0a0e1c] p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Original 16:9 Landscape Video</h3>
                    <p className="text-xs text-muted-foreground">
                      Compare short video crop against full source file
                    </p>
                  </div>
                  {project.signedUrl && (
                    <a
                      href={project.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>Direct S3 URL</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>

                <div className="relative aspect-video max-w-2xl mx-auto rounded-2xl overflow-hidden bg-black border border-white/10">
                  <video
                    ref={sourceVideoRef}
                    src={videoSrc}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* TAB 5: INNGEST RETURN PAYLOAD */}
            {activeBottomTab === "inngest" && (
              <div className="rounded-2xl border border-white/10 bg-[#070a14] p-6 space-y-3 font-mono text-xs shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-white font-bold">Inngest Workflow Output</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Status: {project.aiAnalysisStatus}
                  </span>
                </div>

                <div className="rounded-xl bg-black/80 border border-white/10 p-4 max-h-[300px] overflow-y-auto text-[11px] text-emerald-400">
                  <pre>
                    {JSON.stringify(
                      {
                        projectId: project.id,
                        status: project.status,
                        aiAnalysisStatus: project.aiAnalysisStatus,
                        remotionPlayerReady: true,
                        totalGeneratedShorts: shorts.length,
                        activeShort: {
                          id: activeShort.id,
                          title: activeShort.title,
                          startTime: activeShort.startTime,
                          endTime: activeShort.endTime,
                          duration: activeShort.duration,
                          seoScore: activeShort.seoScore,
                          captionsCount: activeShort.captions.length,
                        },
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Video Modal */}
      {isScheduleOpen && (
        <ScheduleModal
          isOpen={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
          clipTitle={activeShort.title}
          clipHook={activeShort.hook}
          clipTags={activeShort.seoKeywords}
          duration={activeShort.duration}
        />
      )}

      {/* Edit Short & Kinetic Caption Design Modal */}
      {editingShort && (
        <EditShortCaptionModal
          isOpen={Boolean(editingShort)}
          onClose={() => setEditingShort(null)}
          videoUrl={editingShort.videoUrl || videoSrc}
          short={editingShort}
          onSaveSuccess={(updated) => {
            // When user edits caption style, invalidate exportUrl so it must be rendered again
            setShorts((prev) =>
              prev.map((s) =>
                s.id === updated.id
                  ? {
                      ...s,
                      ...updated,
                      exportUrl: null,
                      renderStatus: "idle",
                      renderProgress: 0,
                    }
                  : s
              )
            );
          }}
        />
      )}

      {/* Remotion Lambda Render & Progress Polling Modal */}
      {renderingShort && (
        <RenderProgressModal
          isOpen={Boolean(renderingShort)}
          onClose={() => setRenderingShort(null)}
          short={renderingShort}
          onRenderComplete={(shortId, completedUrl) => {
            setShorts((prev) =>
              prev.map((s) =>
                s.id === shortId
                  ? {
                      ...s,
                      exportUrl: completedUrl,
                      videoUrl: completedUrl,
                      renderStatus: "completed",
                      renderProgress: 100,
                    }
                  : s
              )
            );
          }}
        />
      )}
    </div>
  );
}
