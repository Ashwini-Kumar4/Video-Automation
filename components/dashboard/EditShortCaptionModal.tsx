"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Player, PlayerRef } from "@remotion/player";
import {
  ShortVideoComposition,
  CaptionSegment,
  ShortCompositionProps,
} from "@/components/remotion/ShortVideoComposition";
import {
  CAPTION_PRESETS,
  AVAILABLE_FONTS,
  ACTIVE_COLOR_PALETTES,
  CaptionCustomStyle,
  getCaptionStyle,
  parseCaptionStyleFromDb,
} from "@/config/caption-styles";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Palette,
  Type,
  Sliders,
  Check,
  Save,
  Flame,
  Clock,
  Layers,
  RefreshCw,
  Eye,
  CheckCircle2,
  Tv,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface EditShortModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  short: {
    id: string;
    projectId: string;
    title: string;
    hook?: string;
    startTime: number;
    endTime: number;
    duration: string;
    durationSeconds: number;
    seoScore: number;
    captions: CaptionSegment[];
    videoUrl?: string;
    captionPreset?: string;
    captionStyle?: string;
  };
  onSaveSuccess?: (updatedShort: any) => void;
}

export function EditShortCaptionModal({
  isOpen,
  onClose,
  videoUrl: fallbackVideoUrl,
  short,
  onSaveSuccess,
}: EditShortModalProps) {
  const playerRef = useRef<PlayerRef>(null);

  // Initialize caption style from short's saved data or default to "hormozi"
  const initialStyle = useMemo(() => {
    return parseCaptionStyleFromDb(short.captionPreset, short.captionStyle);
  }, [short.captionPreset, short.captionStyle]);

  const [activeStyle, setActiveStyle] = useState<CaptionCustomStyle>(initialStyle);
  const [activeTab, setActiveTab] = useState<"presets" | "typography" | "colors" | "position">("presets");
  const [cropMode, setCropMode] = useState<"cover" | "contain">("cover");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fps = 30;
  const durationSeconds = Math.max(1, Number((short.endTime - short.startTime).toFixed(1)));
  const durationInFrames = Math.max(1, Math.round(durationSeconds * fps));

  // Resolved video URL
  const resolvedVideoUrl = short.videoUrl || fallbackVideoUrl || "";

  // Reset state when short changes
  useEffect(() => {
    const loaded = parseCaptionStyleFromDb(short.captionPreset, short.captionStyle);
    setActiveStyle(loaded);
    setSaveSuccess(false);
    setErrorMessage(null);
    setIsPlaying(false);
  }, [short.id, short.captionPreset, short.captionStyle]);

  // Sync Remotion Player events
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

  // Remotion composition props dynamically updated in real time
  const inputProps: ShortCompositionProps = useMemo(
    () => ({
      videoUrl: resolvedVideoUrl,
      startTime: short.startTime,
      endTime: short.endTime,
      captions: short.captions,
      captionPreset: activeStyle.presetId,
      captionCustomStyle: activeStyle,
      cropMode,
      hookText: short.hook,
      title: short.title,
      showHookBadge: true,
    }),
    [resolvedVideoUrl, short, activeStyle, cropMode]
  );

  if (!isOpen) return null;

  // Toggle play/pause
  const togglePlay = () => {
    if (!playerRef.current) return;
    if (playerRef.current.isPlaying()) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      playerRef.current.play();
      setIsPlaying(true);
    }
  };

  const restartVideo = () => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(0);
    playerRef.current.play();
    setIsPlaying(true);
  };

  // Change preset helper
  const handleSelectPreset = (presetId: string) => {
    const newStyle = getCaptionStyle(presetId);
    setActiveStyle(newStyle);
  };

  // Update specific style properties helper
  const updateStyleProp = <K extends keyof CaptionCustomStyle>(
    key: K,
    val: CaptionCustomStyle[K]
  ) => {
    setActiveStyle((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  // Save changes to database
  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const response = await fetch(`/api/shorts/${short.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          captionPreset: activeStyle.presetId,
          captionStyle: JSON.stringify(activeStyle),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save caption style");
      }

      setSaveSuccess(true);
      if (onSaveSuccess) {
        onSaveSuccess({
          ...short,
          captionPreset: activeStyle.presetId,
          captionStyle: JSON.stringify(activeStyle),
          exportUrl: null,
          renderStatus: "idle",
          renderProgress: 0,
        });
      }

      // Auto clear success indicator after 2.5s
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2500);
    } catch (err: any) {
      console.error("[EditShortCaptionModal] Save error:", err);
      setErrorMessage(err.message || "Failed to save caption changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in-0 duration-200">
      <div className="relative flex flex-col w-full max-w-7xl max-h-[92vh] h-[92vh] rounded-3xl bg-[#080c18] border border-white/15 shadow-2xl shadow-violet-950/60 overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-b border-white/10 bg-gradient-to-r from-violet-950/50 via-[#0c1224] to-cyan-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-violet-600/30">
              <div className="w-full h-full bg-[#090e1e] rounded-[10px] flex items-center justify-center">
                <Sliders className="size-5 text-cyan-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Shorts Studio & Caption Designer
                </h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Virality: {short.seoScore}/100
                </span>
                <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                  9:16 Vertical
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span className="text-slate-200 font-semibold truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                  {short.title}
                </span>
                <span>•</span>
                <span className="text-cyan-400 font-mono">
                  {short.duration} ({short.startTime}s - {short.endTime}s)
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close editor"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY: TWO COLUMNS (7/12 & 5/12 on LG, 8/12 & 4/12 on XL) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden min-h-0">
          
          {/* LEFT COLUMN: CAPTION STYLING & 3X3 GRID (8 Cols on XL) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col border-b lg:border-b-0 lg:border-r border-white/10 overflow-hidden bg-[#090d1a] h-full">
            
            {/* Navigation Tabs Header */}
            <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 pb-2.5 border-b border-white/10 bg-white/[0.015] overflow-x-auto shrink-0">
              {[
                { id: "presets", label: "Captions Presets (3x3)", icon: Sparkles, count: "9" },
                { id: "typography", label: "Font & Size", icon: Type },
                { id: "colors", label: "Colors & Glow", icon: Palette },
                { id: "position", label: "Layout & Box", icon: Layers },
              ].map((tab) => {
                const Icon = tab.icon;
                const isCurrent = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isCurrent
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30 ring-1 ring-violet-400/30"
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{tab.label}</span>
                    {tab.count && (
                      <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-mono font-bold ${
                        isCurrent ? "bg-black/30 text-white" : "bg-white/10 text-slate-300"
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Scrollable Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 space-y-5 custom-scrollbar min-h-0">
              
              {/* TAB 1: 3X3 CAPTION PRESETS GRID */}
              {activeTab === "presets" && (
                <div className="space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-white/5">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Flame className="size-3.5 text-amber-400" />
                        <span>9 Signature Viral Subtitle Presets (3×3 Grid)</span>
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Click any preset to instantly update kinetic subtitles in the Remotion player.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-md self-start sm:self-auto">
                      Active: {activeStyle.presetId.toUpperCase()}
                    </span>
                  </div>

                  {/* 3X3 GRID CONTAINER */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {CAPTION_PRESETS.map((preset, idx) => {
                      const isSelected = activeStyle.presetId === preset.id;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset.id)}
                          className={`group p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2.5 relative overflow-hidden flex flex-col justify-between ${
                            isSelected
                              ? "bg-gradient-to-b from-violet-600/20 to-indigo-600/10 border-violet-500 shadow-xl shadow-violet-600/30 ring-2 ring-violet-500/80 scale-[1.01]"
                              : "bg-white/[0.02] border-white/10 hover:border-white/25 hover:bg-white/[0.05] hover:-translate-y-0.5"
                          }`}
                        >
                          {/* Selected Checkmark Badge */}
                          {isSelected && (
                            <div className="absolute top-2.5 right-2.5 size-5 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-md z-10">
                              <Check className="size-3 stroke-[3]" />
                            </div>
                          )}

                          {/* Card Header */}
                          <div className="flex items-center justify-between gap-1 pr-6">
                            <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                              {idx + 1}. {preset.name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-white/10 text-amber-300 border border-white/10 shrink-0">
                              {preset.badge}
                            </span>
                          </div>

                          {/* Mini Visual Video Stage Preview (Exact Replica of Preset) */}
                          <div className="rounded-xl bg-gradient-to-b from-black/80 via-black/90 to-black/95 border border-white/10 p-2.5 flex items-center justify-center gap-1.5 overflow-hidden min-h-[46px] shadow-inner">
                            <span
                              style={{
                                fontFamily: preset.style.fontFamily,
                                color: preset.style.inactiveColor,
                                WebkitTextStroke: preset.style.strokeWidth
                                  ? `${preset.style.strokeWidth / 2}px ${preset.style.inactiveStrokeColor}`
                                  : "none",
                              }}
                              className="text-[11px] font-black uppercase tracking-tight"
                            >
                              {preset.previewText.before}
                            </span>
                            <span
                              style={{
                                fontFamily: preset.style.fontFamily,
                                color: preset.style.activeColor,
                                backgroundColor: preset.style.activeBgColor,
                                border: preset.style.activeBorderColor
                                  ? `1.5px solid ${preset.style.activeBorderColor}`
                                  : "none",
                                boxShadow: preset.style.shadowGlow
                                  ? `0 0 12px ${preset.style.activeBgColor}`
                                  : "none",
                              }}
                              className="text-[11px] font-black uppercase px-2 py-0.5 rounded-md scale-105"
                            >
                              {preset.previewText.active}
                            </span>
                            <span
                              style={{
                                fontFamily: preset.style.fontFamily,
                                color: preset.style.inactiveColor,
                                WebkitTextStroke: preset.style.strokeWidth
                                  ? `${preset.style.strokeWidth / 2}px ${preset.style.inactiveStrokeColor}`
                                  : "none",
                              }}
                              className="text-[11px] font-black uppercase tracking-tight"
                            >
                              {preset.previewText.after}
                            </span>
                          </div>

                          {/* Card Bottom Tagline */}
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-white/5">
                            <span className="truncate max-w-[170px]">{preset.tagline}</span>
                            <span className={`font-semibold shrink-0 ${isSelected ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                              {isSelected ? "Active" : "Apply"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: TYPOGRAPHY & FONT STYLE */}
              {activeTab === "typography" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Font Family Selection
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Pick high-impact typography designed for mobile screen scanning.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                    {AVAILABLE_FONTS.map((f) => {
                      const isSelected = activeStyle.fontFamily === f.cssFamily;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            setActiveStyle((prev) => ({
                              ...prev,
                              fontFamily: f.cssFamily,
                              fontFamilyName: f.name,
                            }));
                          }}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "bg-violet-600/20 border-violet-500 shadow-md ring-1 ring-violet-500/50"
                              : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">
                              {f.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {f.category}
                            </span>
                          </div>
                          <div
                            style={{ fontFamily: f.cssFamily }}
                            className="text-sm font-black text-amber-300 mt-1 uppercase tracking-wide"
                          >
                            {f.sample}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {f.bestFor}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Font Size Scaling */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">Subtitles Scale Size:</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {Math.round((activeStyle.fontSizeScale || 1.0) * 100)}%
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "Compact", scale: 0.85 },
                        { label: "Standard", scale: 1.0 },
                        { label: "Large", scale: 1.15 },
                        { label: "Huge (5x)", scale: 1.3 },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => updateStyleProp("fontSizeScale", item.scale)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                            activeStyle.fontSizeScale === item.scale
                              ? "bg-violet-600 text-white border-violet-500 shadow"
                              : "bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Transform */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <span className="text-xs font-bold text-white block">
                      Text Capitalization:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "ALL CAPS", val: "uppercase" },
                        { label: "Title Case", val: "capitalize" },
                        { label: "Normal Case", val: "none" },
                      ].map((c) => (
                        <button
                          key={c.val}
                          type="button"
                          onClick={() => updateStyleProp("textTransform", c.val as any)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                            activeStyle.textTransform === c.val
                              ? "bg-cyan-600 text-white border-cyan-500 shadow"
                              : "bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: COLORS & GLOW PALETTE */}
              {activeTab === "colors" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Active Spoken Word Highlight
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Pick high-contrast viral color combinations for active syllables.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                    {ACTIVE_COLOR_PALETTES.map((palette) => {
                      const isSelected = activeStyle.activeBgColor === palette.activeBg;
                      return (
                        <button
                          key={palette.id}
                          type="button"
                          onClick={() => {
                            setActiveStyle((prev) => ({
                              ...prev,
                              activeBgColor: palette.activeBg,
                              activeColor: palette.activeText,
                              activeBorderColor: palette.activeBg,
                            }));
                          }}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                            isSelected
                              ? "bg-violet-600/20 border-violet-500 shadow-md ring-1 ring-violet-500/50"
                              : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05]"
                          }`}
                        >
                          <div
                            style={{
                              backgroundColor: palette.activeBg,
                              boxShadow: `0 0 12px ${palette.glowColor}`,
                            }}
                            className="size-7 rounded-lg shrink-0 border border-white/20"
                          />
                          <div className="text-left flex-1 min-w-0">
                            <span className="text-xs font-bold text-white block truncate">
                              {palette.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {palette.activeBg}
                            </span>
                          </div>
                          {isSelected && <Check className="size-4 text-violet-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Outline / Stroke Thickness */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">Outline Stroke Thickness:</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {activeStyle.strokeWidth}px
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "None (0px)", val: 0 },
                        { label: "Medium (3px)", val: 3 },
                        { label: "Heavy (4px)", val: 4 },
                        { label: "Ultra (5px)", val: 5 },
                      ].map((s) => (
                        <button
                          key={s.val}
                          type="button"
                          onClick={() => updateStyleProp("strokeWidth", s.val)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                            activeStyle.strokeWidth === s.val
                              ? "bg-violet-600 text-white border-violet-500 shadow"
                              : "bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Glow Effect Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Intense Neon Shadow & Glow
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Emits vibrant energetic aura behind active highlighted words
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateStyleProp("shadowGlow", !activeStyle.shadowGlow)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        activeStyle.shadowGlow
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-white/5 text-slate-400 border-white/10"
                      }`}
                    >
                      {activeStyle.shadowGlow ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: POSITION & BOX LAYOUT */}
              {activeTab === "position" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Screen Placement & Box Framing
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Position subtitles in standard social media safe zones.
                    </p>
                  </div>

                  {/* Vertical Position */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <span className="text-xs font-bold text-white block">
                      Vertical Screen Position:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Bottom (22%)", pos: "bottom", desc: "TikTok / Reels Standard" },
                        { label: "Middle (Center)", pos: "middle", desc: "High engagement interrupt" },
                        { label: "Upper (16%)", pos: "top", desc: "Unobstructed view" },
                      ].map((p) => (
                        <button
                          key={p.pos}
                          type="button"
                          onClick={() => updateStyleProp("position", p.pos as any)}
                          className={`p-2.5 rounded-xl text-left border transition-all ${
                            activeStyle.position === p.pos
                              ? "bg-cyan-600/20 border-cyan-500 text-white shadow ring-1 ring-cyan-500/50"
                              : "bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          <span className="text-xs font-bold block">{p.label}</span>
                          <span className="text-[10px] text-muted-foreground block mt-0.5">
                            {p.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Background Framing */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <span className="text-xs font-bold text-white block">
                      Background Container Style:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: "Frosted Glass", val: "dark_blur" },
                        { label: "Pills Only", val: "pill_only" },
                        { label: "Solid Black", val: "solid_black" },
                        { label: "Transparent", val: "transparent" },
                      ].map((b) => (
                        <button
                          key={b.val}
                          type="button"
                          onClick={() => updateStyleProp("boxBackground", b.val as any)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                            activeStyle.boxBackground === b.val
                              ? "bg-violet-600 text-white border-violet-500 shadow"
                              : "bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Words per Screen */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <span className="text-xs font-bold text-white block">
                      Max Words Rendered Per Screen:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { count: 1, label: "1 Word Pop", desc: "Ultra-fast kinetic" },
                        { count: 2, label: "2 Words", desc: "Dynamic pacing" },
                        { count: 3, label: "3 Words", desc: "Optimal retention (standard)" },
                      ].map((w) => (
                        <button
                          key={w.count}
                          type="button"
                          onClick={() => updateStyleProp("maxWordsPerLine", w.count)}
                          className={`p-2 rounded-xl text-left border transition-all ${
                            activeStyle.maxWordsPerLine === w.count
                              ? "bg-violet-600/20 border-violet-500 text-white shadow ring-1 ring-violet-500/50"
                              : "bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          <span className="text-xs font-bold block">{w.label}</span>
                          <span className="text-[10px] text-muted-foreground block mt-0.5">
                            {w.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* LEFT FOOTER: ACTION BAR */}
            <div className="p-3.5 sm:p-4 border-t border-white/10 bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-emerald-400 font-semibold text-[11px]">
                  Real-time Remotion Sync Active
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => handleSelectPreset("hormozi")}
                  className="border-white/15 hover:bg-white/10 text-xs h-9 rounded-xl flex-1 sm:flex-initial"
                >
                  <RefreshCw className="size-3.5 mr-1" />
                  Reset
                </Button>

                <Button
                  onClick={handleSaveToDatabase}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs h-9 rounded-xl shadow-lg shadow-violet-600/30 flex-1 sm:flex-initial"
                >
                  {isSaving ? (
                    <>
                      <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                      <span>Saving...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle2 className="size-3.5 text-white mr-1.5" />
                      <span>Saved to DB!</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-3.5 mr-1.5" />
                      <span>Apply & Save Style</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Error Message notification if save failed */}
            {errorMessage && (
              <div className="px-5 py-2 bg-rose-500/20 border-t border-rose-500/30 text-rose-300 text-xs text-center font-medium shrink-0">
                {errorMessage}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: PROPERLY FITTED REMOTION PLAYER (4 Cols on XL) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col items-center justify-between p-3 sm:p-4 lg:p-5 bg-gradient-to-b from-[#060914] via-[#04060c] to-[#020306] border-t lg:border-t-0 lg:border-l border-white/10 h-full overflow-hidden">
            
            {/* Player Header Info */}
            <div className="flex items-center justify-between w-full max-w-[300px] mb-2 px-1 shrink-0">
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Tv className="size-3 text-cyan-400" />
                Live 9:16 Video Player
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                {formatSeconds(durationSeconds)}
              </span>
            </div>

            {/* 9:16 Smartphone Canvas Frame - PROPERLY FITTED (Uses available vertical height without clipping) */}
            <div className="relative flex-1 flex items-center justify-center w-full min-h-0 py-1">
              <div className="relative h-full max-h-[calc(92vh-190px)] aspect-[9/16] rounded-3xl overflow-hidden bg-black border-2 border-white/20 shadow-2xl shadow-violet-950/80 group flex items-center justify-center shrink-0">
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
                    borderRadius: "22px",
                    overflow: "hidden",
                    objectFit: "contain",
                  }}
                  controls={false}
                  autoPlay={false}
                  loop
                  clickToPlay={false}
                  showPosterWhenUnplayed={false}
                  errorFallback={({ error }) => (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center space-y-2 bg-[#0a0e1c] text-white">
                      <span className="text-amber-400 font-bold text-xs">Media Notice</span>
                      <p className="text-[10px] text-slate-300 max-w-[200px]">{error?.message || "Buffering video stream"}</p>
                    </div>
                  )}
                />

                {/* Big Center Play/Pause Overlay When Paused */}
                {!isPlaying && (
                  <div
                    onClick={togglePlay}
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/35 backdrop-blur-[1px] cursor-pointer group-hover:bg-black/20 transition-all"
                  >
                    <div className="size-14 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 text-white flex items-center justify-center shadow-2xl scale-100 group-hover:scale-110 transition-transform">
                      <Play className="size-7 ml-0.5 fill-white" />
                    </div>
                    <span className="text-[10px] font-bold text-white mt-2 px-2.5 py-1 rounded-full bg-black/60 border border-white/20 backdrop-blur-md">
                      Click to Preview
                    </span>
                  </div>
                )}

                {/* Floating Bottom Player Controls */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 z-40 flex items-center justify-between gap-1.5 p-2 rounded-2xl bg-black/80 backdrop-blur-md border border-white/15 opacity-90 hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="size-4" />
                    ) : (
                      <Play className="size-4 fill-white" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={restartVideo}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Replay from start"
                  >
                    <RotateCcw className="size-4" />
                  </button>

                  <div className="flex-1 text-center font-mono text-[10px] text-slate-300 truncate px-1">
                    <span>{short.duration}</span>
                  </div>

                  {/* Framing Crop Toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      setCropMode(cropMode === "cover" ? "contain" : "cover")
                    }
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-cyan-600/30 text-cyan-200 border border-cyan-500/30 hover:bg-cyan-600/50 transition-colors uppercase font-mono"
                    title="Toggle 9:16 crop fill mode"
                  >
                    {cropMode === "cover" ? "Fill" : "Fit"}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Note */}
            <div className="text-[11px] text-slate-400 text-center max-w-[280px] leading-tight pt-2 shrink-0">
              <span>Word-level kinetic captions sync in real time.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
