"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Download,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Cpu,
  RefreshCw,
  Film,
  Zap,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface RenderProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  short: {
    id: string;
    projectId: string;
    title: string;
    duration?: string;
    durationSeconds?: number;
    captionPreset?: string;
    exportUrl?: string | null;
    renderStatus?: string;
    renderProgress?: number;
    renderStage?: string | null;
  } | null;
  onRenderComplete: (shortId: string, exportUrl: string) => void;
}

export function RenderProgressModal({
  isOpen,
  onClose,
  short,
  onRenderComplete,
}: RenderProgressModalProps) {
  const [progress, setProgress] = useState(short?.renderProgress || 5);
  const [stage, setStage] = useState(
    short?.renderStage || "Initializing video rendering pipeline..."
  );
  const [status, setStatus] = useState<"idle" | "rendering" | "completed" | "failed">(
    (short?.renderStatus as any) || "rendering"
  );
  const [exportUrl, setExportUrl] = useState<string | null>(short?.exportUrl || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const autoDownloadedRef = useRef(false);

  // Trigger browser file download helper
  const triggerBrowserDownload = (url: string, filename: string) => {
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.warn("Direct download link click fallback:", e);
      window.open(url, "_blank");
    }
  };

  // Reset or start render when modal opens
  useEffect(() => {
    if (!isOpen || !short) return;

    autoDownloadedRef.current = false;
    setErrorMessage(null);

    // If already has exportUrl, mark complete immediately
    if (short.exportUrl) {
      setExportUrl(short.exportUrl);
      setProgress(100);
      setStatus("completed");
      setStage("Render completed! Video ready for download.");
      return;
    }

    // Trigger render start API call
    let isCancelled = false;

    const startRender = async () => {
      setStatus("rendering");
      setProgress(short.renderProgress && short.renderProgress > 5 ? short.renderProgress : 10);
      setStage("Connecting to Remotion Lambda & queuing rendering job...");

      try {
        const res = await fetch(`/api/shorts/${short.id}/render`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();

        if (isCancelled) return;

        if (data.alreadyRendered && data.exportUrl) {
          setExportUrl(data.exportUrl);
          setProgress(100);
          setStatus("completed");
          setStage("Video is already rendered! Starting download...");
          onRenderComplete(short.id, data.exportUrl);
          if (!autoDownloadedRef.current) {
            autoDownloadedRef.current = true;
            triggerBrowserDownload(
              data.exportUrl,
              `${short.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_9x16.mp4`
            );
          }
          return;
        }

        if (data.renderProgress) setProgress(data.renderProgress);
        if (data.renderStage) setStage(data.renderStage);
      } catch (err: any) {
        if (!isCancelled) {
          console.error("Failed to start render:", err);
          setStatus("failed");
          setErrorMessage(err.message || "Failed to trigger video render.");
        }
      }
    };

    startRender();

    // Polling interval
    const interval = setInterval(async () => {
      if (isCancelled) return;

      try {
        const pollRes = await fetch(`/api/shorts/${short.id}/render`);
        const pollData = await pollRes.json();

        if (isCancelled || !pollData.success) return;

        if (pollData.renderProgress !== undefined) {
          setProgress(pollData.renderProgress);
        }
        if (pollData.renderStage) {
          setStage(pollData.renderStage);
        }
        if (pollData.renderStatus) {
          setStatus(pollData.renderStatus);
        }

        if (pollData.renderStatus === "failed") {
          setStatus("failed");
          setErrorMessage(pollData.renderStage || "Render process encountered an error.");
          clearInterval(interval);
          return;
        }

        if (
          (pollData.isRendered || pollData.renderStatus === "completed") &&
          pollData.exportUrl
        ) {
          setExportUrl(pollData.exportUrl);
          setProgress(100);
          setStatus("completed");
          setStage("Render complete! Video ready for download.");
          onRenderComplete(short.id, pollData.exportUrl);

          if (!autoDownloadedRef.current) {
            autoDownloadedRef.current = true;
            triggerBrowserDownload(
              pollData.exportUrl,
              `${short.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_9x16.mp4`
            );
          }

          clearInterval(interval);
        }
      } catch (err) {
        console.warn("Polling error:", err);
      }
    }, 1500);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [isOpen, short?.id]);

  if (!isOpen || !short) return null;

  const retryRender = async () => {
    setStatus("rendering");
    setProgress(10);
    setStage("Retrying Remotion Lambda render...");
    setErrorMessage(null);
    try {
      await fetch(`/api/shorts/${short.id}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      setStatus("failed");
      setErrorMessage(e.message || "Retry failed.");
    }
  };

  const steps = [
    { label: "Initialize", min: 0, max: 20 },
    { label: "Lambda Render", min: 20, max: 75 },
    { label: "Encode 9:16 MP4", min: 75, max: 95 },
    { label: "Download Ready", min: 95, max: 100 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in-0 duration-200">
      <div className="relative flex flex-col w-full max-w-xl rounded-3xl bg-[#090d1a] border border-white/15 shadow-2xl shadow-violet-950/60 overflow-hidden">
        
        {/* Glow Header Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-violet-600/30">
              <div className="w-full h-full bg-[#0a0f24] rounded-[14px] flex items-center justify-center">
                {status === "completed" ? (
                  <CheckCircle2 className="size-5 text-emerald-400 animate-pulse" />
                ) : status === "failed" ? (
                  <AlertCircle className="size-5 text-rose-400" />
                ) : (
                  <Cpu className="size-5 text-cyan-300 animate-spin" />
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {status === "completed"
                    ? "Render Completed"
                    : status === "failed"
                    ? "Rendering Interrupted"
                    : "Rendering Remotion Short"}
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Lambda 4.0
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-sm">
                {short.title} • {short.duration || "9:16 Short"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="size-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6">

          {/* Central Animation Gauge / Progress */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative size-32 sm:size-36 flex items-center justify-center">
              {/* Radial glow background */}
              <div
                className={`absolute inset-0 rounded-full blur-2xl opacity-40 transition-all duration-500 ${
                  status === "completed"
                    ? "bg-emerald-500"
                    : status === "failed"
                    ? "bg-rose-500"
                    : "bg-cyan-500"
                }`}
              />

              {/* Circular SVG Ring */}
              <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="transparent"
                  stroke={
                    status === "completed"
                      ? "#10B981"
                      : status === "failed"
                      ? "#F43F5E"
                      : "url(#progressGradient)"
                  }
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * Math.max(5, progress)) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-out"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="50%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center percentage / icon */}
              <div className="absolute flex flex-col items-center justify-center">
                {status === "completed" ? (
                  <>
                    <CheckCircle2 className="size-10 text-emerald-400 animate-in zoom-in-75 duration-300" />
                    <span className="text-[11px] font-bold text-emerald-400 mt-1 uppercase tracking-wider">
                      Ready
                    </span>
                  </>
                ) : status === "failed" ? (
                  <>
                    <AlertCircle className="size-9 text-rose-400" />
                    <span className="text-[11px] font-bold text-rose-400 mt-1 uppercase">Error</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-extrabold text-white tracking-tight tabular-nums">
                      {progress}%
                    </span>
                    <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest mt-0.5">
                      Rendering
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Stage Status Headline */}
            <div className="text-center mt-5 max-w-md">
              <p className="text-sm font-semibold text-slate-200">{stage}</p>
              <p className="text-xs text-slate-400 mt-1">
                {status === "completed"
                  ? "High-definition 1080x1920 short with burned-in captions is rendered and ready."
                  : status === "failed"
                  ? errorMessage || "Rendering failed. You can retry the render."
                  : "Rendering frames in parallel with Remotion Lambda on AWS cluster."}
              </p>
            </div>
          </div>

          {/* Stepper Progress Badges */}
          <div className="grid grid-cols-4 gap-2 py-1">
            {steps.map((st, i) => {
              const isPast = progress >= st.max;
              const isCurrent = progress >= st.min && progress < st.max;
              return (
                <div
                  key={st.label}
                  className={`flex flex-col items-center text-center p-2 rounded-xl border transition-all ${
                    isPast
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : isCurrent
                      ? "bg-cyan-500/15 border-cyan-400/50 text-cyan-200 shadow-sm shadow-cyan-500/20"
                      : "bg-white/5 border-white/5 text-slate-500"
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    0{i + 1}
                  </span>
                  <span className="text-[11px] font-bold truncate max-w-full mt-0.5">
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action Button Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            {status === "completed" && exportUrl ? (
              <>
                <Button
                  onClick={() =>
                    triggerBrowserDownload(
                      exportUrl,
                      `${short.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_9x16.mp4`
                    )
                  }
                  className="w-full sm:flex-1 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 border border-white/20 transition-all active:scale-[0.98]"
                >
                  <Download className="size-4 animate-bounce" />
                  <span>Download Short Video (MP4)</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border-white/15 text-slate-200 text-sm font-semibold"
                >
                  Done
                </Button>
              </>
            ) : status === "failed" ? (
              <>
                <Button
                  onClick={retryRender}
                  className="w-full sm:flex-1 h-12 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-bold text-sm shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 border border-white/20 transition-all active:scale-[0.98]"
                >
                  <RefreshCw className="size-4" />
                  <span>Retry Lambda Render</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border-white/15 text-slate-200 text-sm font-semibold"
                >
                  Close
                </Button>
              </>
            ) : (
              <div className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-violet-950/30 border border-violet-500/20 text-xs text-violet-300">
                <div className="flex items-center gap-2.5">
                  <div className="size-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Rendering in background via Inngest workflow...</span>
                </div>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white underline font-semibold transition"
                >
                  Keep rendering in background
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
