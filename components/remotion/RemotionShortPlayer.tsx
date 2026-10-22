"use client";

import React, { useRef, useState, useMemo, useEffect } from "react";
import { Player, PlayerRef } from "@remotion/player";
import {
  ShortVideoComposition,
  CaptionSegment,
  ShortCompositionProps,
} from "./ShortVideoComposition";
import { CaptionCustomStyle } from "@/config/caption-styles";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  Flame,
  Clock,
  Layers,
  Palette,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface RemotionShortPlayerProps {
  videoUrl: string;
  startTime: number;
  endTime: number;
  captions?: CaptionSegment[];
  title?: string;
  hook?: string;
  seoScore?: number;
  thumbnailUrl?: string;
  captionPreset?: string;
  captionCustomStyle?: Partial<CaptionCustomStyle>;
  onTimeUpdate?: (time: number) => void;
  className?: string;
  hidePoster?: boolean;
}

export function RemotionShortPlayer({
  videoUrl,
  startTime,
  endTime,
  captions = [],
  title = "Viral Short Clip",
  hook,
  seoScore = 95,
  thumbnailUrl,
  captionPreset: initialPreset = "hormozi",
  captionCustomStyle,
  className = "",
  hidePoster = false,
}: RemotionShortPlayerProps) {
  const playerRef = useRef<PlayerRef>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [captionPreset, setCaptionPreset] = useState<string>(initialPreset);
  const [cropMode, setCropMode] = useState<"cover" | "contain">("cover");
  const [hasStartedPlaying, setHasStartedPlaying] = useState(hidePoster);

  // Sync preset if prop changes
  useEffect(() => {
    if (initialPreset) {
      setCaptionPreset(initialPreset);
    }
  }, [initialPreset]);

  const fps = 30;
  const durationSeconds = Math.max(1, Number((endTime - startTime).toFixed(1)));
  const durationInFrames = Math.max(1, Math.round(durationSeconds * fps));

  // Composition input props passed directly to Remotion
  const inputProps: ShortCompositionProps = useMemo(
    () => ({
      videoUrl,
      startTime,
      endTime,
      captions,
      captionPreset: captionCustomStyle?.presetId || captionPreset,
      captionCustomStyle,
      cropMode,
      hookText: hook,
      title,
      showHookBadge: true,
    }),
    [videoUrl, startTime, endTime, captions, captionPreset, captionCustomStyle, cropMode, hook, title]
  );

  // Reset position and play state when clip changes
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.seekTo(0);
      setIsPlaying(false);
      setHasStartedPlaying(false);
    }
  }, [startTime, endTime, videoUrl]);

  // Sync play/pause events from Player ref
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("ended", onEnded);

    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("ended", onEnded);
    };
  }, []);

  // Play / Pause toggler
  const togglePlay = () => {
    if (!playerRef.current) return;
    if (playerRef.current.isPlaying()) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      playerRef.current.play();
      setIsPlaying(true);
      setHasStartedPlaying(true);
    }
  };

  const restartVideo = () => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(0);
    playerRef.current.play();
    setIsPlaying(true);
    setHasStartedPlaying(true);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`flex flex-col items-center w-full max-w-[280px] sm:max-w-[310px] mx-auto ${className}`}>
      {/* 9:16 Vertical Phone Container with Glassmorphism Frame */}
      <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-black border-2 border-white/15 shadow-xl shadow-violet-950/40 group">
        {/* Remotion Player */}
        <Player
          ref={playerRef}
          component={ShortVideoComposition as any}
          inputProps={inputProps}
          durationInFrames={durationInFrames}
          fps={fps}
          compositionWidth={1080}
          compositionHeight={1920}
          numberOfSharedAudioTags={0}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "16px",
            overflow: "hidden",
          }}
          controls={false} // Custom overlay controls for sleek TikTok / Shorts look
          autoPlay={false} // Requirement: Do not autoplay video
          loop
          clickToPlay={false}
          showPosterWhenUnplayed={false}
          errorFallback={({ error }) => (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center space-y-2 bg-[#0a0e1c] text-white">
              <span className="text-amber-400 font-bold text-xs">Media Stream Notice</span>
              <p className="text-[11px] text-slate-300 max-w-xs">{error?.message || "Video stream buffering or unavailable"}</p>
              <button
                type="button"
                onClick={() => playerRef.current?.seekTo(0)}
                className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-[11px] font-semibold transition-colors"
              >
                Reload Clip
              </button>
            </div>
          )}
        />

        {/* Thumbnail / Poster Overlay: Shown before first play to conserve bandwidth */}
        {!hasStartedPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 z-30 flex flex-col justify-between p-3.5 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-black/90 backdrop-blur-[2px] cursor-pointer group-hover:backdrop-blur-none transition-all"
          >
            {/* Top Poster Meta */}
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-600/90 text-white shadow-md flex items-center gap-1 border border-white/20">
                <Flame className="size-3 text-amber-300" />
                <span>SEO Score: {seoScore}/100</span>
              </span>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/60 text-cyan-300 border border-white/10">
                {formatSeconds(durationSeconds)}
              </span>
            </div>

            {/* Center Play Button with Pulse Animation */}
            <div className="flex flex-col items-center justify-center text-center space-y-2 my-auto">
              <div className="relative">
                <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 opacity-60 blur-md group-hover:opacity-100 group-hover:scale-110 transition-all animate-pulse" />
                <div className="relative size-12 sm:size-14 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-400 text-white flex items-center justify-center shadow-xl transition-transform group-hover:scale-105">
                  <Play className="size-6 sm:size-7 ml-0.5 fill-white" />
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white tracking-wide block drop-shadow">
                  Preview 9:16 Short Clip
                </span>
                <span className="text-[10px] text-slate-300 block max-w-[190px] leading-tight">
                  Click to start Remotion Player with kinetic subtitles
                </span>
              </div>
            </div>

            {/* Bottom Hook Preview */}
            <div className="rounded-xl bg-black/85 border border-white/10 p-2 sm:p-2.5 space-y-1 backdrop-blur-md">
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                <Sparkles className="size-2.5" />
                <span>Opening Hook</span>
              </div>
              <p className="text-[11px] font-medium text-white line-clamp-2 leading-snug">
                "{hook || title}"
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[9px] text-muted-foreground font-mono">
                <span>Start: {formatSeconds(startTime)}</span>
                <span>End: {formatSeconds(endTime)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Minimalist Floating Controls (When Started Playing) */}
        {hasStartedPlaying && (
          <div className="absolute bottom-2 left-2 right-2 z-30 flex items-center justify-between gap-1.5 p-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/15 opacity-85 hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5 fill-white" />}
            </button>

            <button
              type="button"
              onClick={restartVideo}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Replay from start"
            >
              <RotateCcw className="size-3.5" />
            </button>

            <div className="flex-1 text-center font-mono text-[10px] text-slate-300">
              <span>{formatSeconds(durationSeconds)} Short</span>
            </div>

            {/* Quick Caption Style Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = captionPreset === "hormozi" ? "cyber" : captionPreset === "cyber" ? "minimal" : "hormozi";
                setCaptionPreset(next);
              }}
              className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-violet-600/40 text-violet-200 border border-violet-500/30 hover:bg-violet-600/60 transition-colors uppercase font-mono"
              title="Switch caption preset"
            >
              {captionPreset}
            </button>
          </div>
        )}
      </div>

      {/* Under-Player Toolbar: Framing & Subtitle Style Options */}
      <div className="flex items-center justify-between w-full mt-2 px-1 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Layers className="size-3 text-cyan-400" />
          <span>Crop:</span>
          <button
            type="button"
            onClick={() => setCropMode(cropMode === "cover" ? "contain" : "cover")}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
              cropMode === "cover"
                ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                : "bg-white/5 text-slate-400 border-white/10"
            }`}
          >
            {cropMode === "cover" ? "9:16 Fill" : "Fit"}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <Palette className="size-3 text-amber-400" />
          <span>Subs:</span>
          {(["hormozi", "cyber", "minimal"] as const).map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => setCaptionPreset(style)}
              className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border transition-colors ${
                captionPreset === style
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-white/5 text-slate-400 border-white/10"
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
