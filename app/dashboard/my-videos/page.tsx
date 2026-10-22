"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Film,
  Search,
  Sparkles,
  Play,
  Clock,
  ArrowRight,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Layers,
  FileVideo,
  BarChart3,
  Calendar,
  RefreshCw,
  Loader2,
  Flame,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ShortClipPreview {
  id: string;
  projectId: string;
  title: string;
  videoUrl?: string | null;
  duration: string;
  seoScore: number;
}

interface UploadedProject {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  originalFileName?: string | null;
  fileSize?: string | null;
  duration?: string | null;
  durationSeconds?: number | null;
  resolution?: string | null;
  format?: string | null;
  status: string;
  progress: number;
  stage?: string | null;
  sourceUrl?: string | null;
  s3Url?: string | null;
  signedUrl?: string | null;
  createdAt: string;
  clipsCount: number;
  previewClips?: ShortClipPreview[];
}

export default function MyVideosPage() {
  const router = useRouter();
  const [projectsList, setProjectsList] = useState<UploadedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "processing">("all");
  const [sortBy, setSortBy] = useState<"newest" | "clips" | "duration">("newest");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchProjects = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        setProjectsList(data.projects);
      }
    } catch (err: any) {
      console.error("Failed to load user projects:", err);
      setNotification({ type: "error", text: "Failed to load your uploaded videos." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Handle Delete Project
  const handleDeleteProject = async (e: React.MouseEvent, projectId: string, title: string) => {
    e.stopPropagation(); // prevent card click navigation
    if (!confirm(`Are you sure you want to delete "${title}" and all its generated short clips?`)) {
      return;
    }

    setDeletingId(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProjectsList((prev) => prev.filter((p) => p.id !== projectId));
        setNotification({
          type: "success",
          text: `Project "${title}" and its short clips were removed.`,
        });
      } else {
        throw new Error(data.error || "Failed to delete project");
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err?.message || "Could not delete project.",
      });
    } finally {
      setDeletingId(null);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Metrics summary
  const totalClips = useMemo(() => {
    return projectsList.reduce((acc, p) => acc + (p.clipsCount || 0), 0);
  }, [projectsList]);

  const completedProjects = useMemo(() => {
    return projectsList.filter((p) => p.status === "completed" || p.clipsCount > 0).length;
  }, [projectsList]);

  // Filter & Sort
  const filteredProjects = useMemo(() => {
    return projectsList
      .filter((p) => {
        const matchesQuery =
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.originalFileName || "").toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesQuery) return false;

        if (statusFilter === "completed") {
          return p.status === "completed" || p.clipsCount > 0;
        }
        if (statusFilter === "processing") {
          return p.status !== "completed" && p.clipsCount === 0;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "clips") {
          return (b.clipsCount || 0) - (a.clipsCount || 0);
        }
        if (sortBy === "duration") {
          return (b.durationSeconds || 0) - (a.durationSeconds || 0);
        }
        return 0;
      });
  }, [projectsList, searchQuery, statusFilter, sortBy]);

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-violet-600/30 to-cyan-500/20 border border-violet-500/30 text-cyan-400 shadow-lg shadow-violet-500/10">
              <Film className="size-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                My Videos
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                All your uploaded long-form videos. Click any video card to view its generated viral short clips.
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchProjects(true)}
            disabled={refreshing}
            className="border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors gap-2 text-xs"
          >
            <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
            <span>Refresh</span>
          </Button>

          <Link href="/dashboard">
            <Button
              size="sm"
              className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold gap-1.5 shadow-lg shadow-violet-600/30 text-xs px-4 cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Upload New Video</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={cn(
            "p-4 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2",
            notification.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
              : "bg-rose-500/15 border-rose-500/40 text-rose-300"
          )}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="size-4 text-rose-400 shrink-0" />
            )}
            <span className="text-xs font-semibold">{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-muted-foreground hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* 2. STATS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Uploads */}
        <div className="p-5 rounded-2xl bg-[#0c1222] border border-white/10 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Uploaded Videos
            </span>
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <FileVideo className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{projectsList.length}</span>
            <span className="text-xs text-muted-foreground">projects</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2">Source files processed by AI</p>
        </div>

        {/* Viral Shorts Generated */}
        <div className="p-5 rounded-2xl bg-[#0c1222] border border-white/10 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Viral Shorts
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Sparkles className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-300">{totalClips}</span>
            <span className="text-xs text-cyan-400/80 font-semibold">clips</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2">Ready to edit, export & post</p>
        </div>

        {/* Completed Projects */}
        <div className="p-5 rounded-2xl bg-[#0c1222] border border-white/10 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Completed
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{completedProjects}</span>
            <span className="text-xs text-muted-foreground">with clips</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2">Transcribed & analyzed</p>
        </div>

        {/* Quick Navigate */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-950/40 via-[#0c1222] to-cyan-950/30 border border-violet-500/30 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
                Auto-Scheduler
              </span>
              <Calendar className="size-4 text-violet-400" />
            </div>
            <p className="text-xs text-zinc-300 mt-1">
              Distribute rendered clips to TikTok, Reels & Shorts
            </p>
          </div>
          <Link href="/dashboard/schedule" className="mt-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-semibold border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-white justify-between"
            >
              <span>Schedule Calendar</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 3. FILTERS & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0c1222] border border-white/10">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
          <button
            onClick={() => setStatusFilter("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
              statusFilter === "all"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-white"
            )}
          >
            All Videos ({projectsList.length})
          </button>
          <button
            onClick={() => setStatusFilter("completed")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5",
              statusFilter === "completed"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-white"
            )}
          >
            <CheckCircle2 className="size-3" />
            <span>Completed ({completedProjects})</span>
          </button>
          <button
            onClick={() => setStatusFilter("processing")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5",
              statusFilter === "processing"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-white"
            )}
          >
            <Clock className="size-3" />
            <span>In Processing ({projectsList.length - completedProjects})</span>
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3 flex-1 sm:flex-initial justify-end">
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or filename..."
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-xl text-xs h-9 focus-visible:ring-violet-500"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300 hover:text-white focus:outline-none focus:border-violet-500 cursor-pointer"
          >
            <option value="newest" className="bg-[#0b0f1c] text-white">Newest First</option>
            <option value="clips" className="bg-[#0b0f1c] text-white">Most Short Clips</option>
            <option value="duration" className="bg-[#0b0f1c] text-white">Longest Duration</option>
          </select>
        </div>
      </div>

      {/* 4. VIDEO PROJECTS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-72 rounded-3xl bg-white/[0.02] border border-white/10 p-5 flex flex-col justify-between animate-pulse"
            >
              <div className="space-y-3">
                <div className="h-32 rounded-2xl bg-white/5" />
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
              <div className="h-9 rounded-xl bg-white/5" />
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 rounded-3xl border border-dashed border-white/15 text-center space-y-4 bg-white/[0.01]">
          <div className="size-16 rounded-3xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto shadow-inner">
            <Film className="size-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No uploaded videos found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? `No videos match "${searchQuery}". Try a different search keyword.`
                : "Upload your first long-form video or YouTube podcast to generate viral vertical shorts automatically."}
            </p>
          </div>
          <Link href="/dashboard">
            <Button className="bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold text-xs px-5 shadow-lg shadow-violet-600/25 cursor-pointer">
              <Plus className="size-4 mr-1.5" />
              Upload Your First Video
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const hasClips = project.clipsCount > 0;
            const isCompleted = project.status === "completed" || hasClips;

            return (
              <div
                key={project.id}
                onClick={() => router.push(`/dashboard/project/${project.id}`)}
                className="group relative flex flex-col justify-between rounded-3xl bg-gradient-to-b from-[#0e1424] via-[#0a0f1d] to-[#070b16] border border-white/10 hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-600/20 transition-all duration-300 cursor-pointer overflow-hidden p-5 space-y-4"
              >
                {/* Card Top: Video Banner Preview */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center group-hover:border-cyan-500/40 transition-colors">
                  {/* Background Glow */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-violet-900/40 via-indigo-950/30 to-cyan-950/40 opacity-80 group-hover:opacity-100 transition-opacity" />

                  {/* Play Action Overlay */}
                  <div className="relative size-12 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-xl group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-black transition-all duration-300">
                    <Play className="size-5 fill-current ml-0.5" />
                  </div>

                  {/* Top-Left Status Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border backdrop-blur-md",
                        isCompleted
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      )}
                    >
                      {isCompleted ? "Completed" : project.status || "Processing"}
                    </span>
                  </div>

                  {/* Top-Right: Delete button */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteProject(e, project.id, project.title)}
                    disabled={deletingId === project.id}
                    className="absolute top-3 right-3 p-1.5 rounded-xl bg-black/60 hover:bg-rose-500/30 border border-white/10 hover:border-rose-500/40 text-zinc-400 hover:text-rose-300 transition-all backdrop-blur-md cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Delete project"
                  >
                    {deletingId === project.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </button>

                  {/* Bottom Stats: Duration & Resolution */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-zinc-300">
                    <span className="px-2 py-0.5 rounded-lg bg-black/70 border border-white/10 backdrop-blur-md flex items-center gap-1">
                      <Clock className="size-3 text-cyan-400" />
                      {project.duration || "05:00"}
                    </span>

                    {project.fileSize && (
                      <span className="px-2 py-0.5 rounded-lg bg-black/70 border border-white/10 backdrop-blur-md text-zinc-400">
                        {project.fileSize}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Middle: Title & Metadata */}
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-cyan-300 transition-colors">
                    {project.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                    <FileVideo className="size-3.5 shrink-0 text-violet-400" />
                    <span className="truncate">{project.originalFileName || "Uploaded source video"}</span>
                  </div>

                  {/* Viral Shorts Count Chip */}
                  <div className="pt-2 flex items-center justify-between">
                    <div
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border",
                        hasClips
                          ? "bg-gradient-to-r from-violet-600/20 to-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-500/10"
                          : "bg-white/5 border-white/10 text-zinc-400"
                      )}
                    >
                      <Sparkles className="size-3.5 text-cyan-400" />
                      <span>{project.clipsCount} Viral Shorts Generated</span>
                    </div>

                    <span className="text-[11px] text-zinc-500">
                      {new Date(project.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Card Bottom CTA: Navigate to Project Page */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 group-hover:text-white transition-colors">
                    View & Edit Clips
                  </span>

                  <Button
                    size="sm"
                    className="h-8 px-3.5 rounded-xl bg-white/5 group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-cyan-500 text-white text-xs font-bold transition-all gap-1.5 border border-white/10 group-hover:border-transparent shadow-md"
                  >
                    <span>View Shorts</span>
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
