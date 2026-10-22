"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Send,
  CheckCircle,
  Share2,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  clipTitle: string;
  clipHook?: string;
  clipTags?: string[];
  duration?: string;
}

export function ScheduleModal({
  isOpen,
  onClose,
  clipTitle,
  clipHook,
  clipTags = [],
  duration,
}: ScheduleModalProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "youtube_shorts",
    "tiktok",
  ]);
  const [scheduledDate, setScheduledDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0); // 6:00 PM peak engagement
    return tomorrow.toISOString().slice(0, 16);
  });
  const [captionText, setCaptionText] = useState(
    `${clipTitle}\n\n${clipHook ? `💡 ${clipHook}\n\n` : ""}${clipTags.join(" ")}`
  );
  const [isScheduling, setIsScheduling] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleScheduleSubmit = async () => {
    setIsScheduling(true);
    // Simulate scheduling call
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsScheduling(false);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 2000);
  };

  const platforms = [
    {
      id: "youtube_shorts",
      name: "YouTube Shorts",
      icon: "▶️",
      color: "from-red-600 to-rose-600",
      bestTime: "Best: 6:00 PM - 9:00 PM",
    },
    {
      id: "tiktok",
      name: "TikTok",
      icon: "🎵",
      color: "from-cyan-500 to-pink-500",
      bestTime: "Best: 7:00 PM - 10:00 PM",
    },
    {
      id: "instagram_reels",
      name: "Instagram Reels",
      icon: "📸",
      color: "from-fuchsia-600 to-amber-500",
      bestTime: "Best: 12:00 PM or 7:00 PM",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-gradient-to-b from-[#111728] via-[#0b0f1c] to-[#070a14] p-6 text-white shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
        >
          <X className="size-4" />
        </button>

        {isSuccess ? (
          <div className="py-12 flex flex-col items-center text-center space-y-4">
            <div className="size-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle className="size-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Short Video Scheduled!</h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Your 9:16 vertical short is queued to be published automatically to{" "}
                <span className="text-emerald-400 font-semibold">
                  {selectedPlatforms.map((p) => p.replace("_", " ")).join(", ")}
                </span>
                .
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                <Share2 className="size-3.5" />
                <span>Multi-Platform Distribution</span>
              </div>
              <h3 className="text-lg font-black text-white">Schedule Short Video Post</h3>
              <p className="text-xs text-muted-foreground">
                Set automatic publish time to maximize peak viral engagement
              </p>
            </div>

            {/* Platform Selection Pills */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Select Destinations
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {platforms.map((p) => {
                  const isSelected = selectedPlatforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlatform(p.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? "bg-violet-600/20 border-violet-500 text-white shadow-lg shadow-violet-600/20"
                          : "bg-white/[0.03] border-white/10 text-muted-foreground hover:bg-white/5"
                      }`}
                    >
                      <span className="text-xl mb-1">{p.icon}</span>
                      <span className="text-xs font-bold">{p.name}</span>
                      <span className="text-[9px] text-slate-400 mt-0.5">{p.bestTime}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schedule Date & Time */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <CalendarIcon className="size-3.5 text-violet-400" />
                <span>Publish Date & Time</span>
              </label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>

            {/* Caption & Hashtag Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-amber-400" />
                  <span>Optimized Caption & Tags</span>
                </label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {captionText.length} chars
                </span>
              </div>
              <textarea
                rows={4}
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-slate-200 placeholder:text-muted-foreground focus:outline-none focus:border-violet-500 leading-relaxed resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="border-white/10 text-xs hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleScheduleSubmit}
                disabled={isScheduling || selectedPlatforms.length === 0}
                className="bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center gap-1.5"
              >
                {isScheduling ? (
                  <>
                    <div className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Scheduling Post...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    <span>Confirm & Schedule</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
