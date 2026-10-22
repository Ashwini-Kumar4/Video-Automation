"use client";

import React, { useMemo, useEffect } from "react";
import {
  AbsoluteFill,
  Video,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  delayRender,
  continueRender,
} from "remotion";

import {
  CaptionCustomStyle,
  getCaptionStyle,
} from "@/config/caption-styles";

export interface CaptionWord {
  word: string;
  start: number; // in seconds
  end: number;   // in seconds
}

export interface CaptionSegment {
  id: number;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
  words?: CaptionWord[];
}

export interface ShortCompositionProps {
  videoUrl: string;
  startTime: number;        // in seconds (e.g. 15.5)
  endTime: number;          // in seconds (e.g. 47.8)
  captions?: CaptionSegment[];
  captionPreset?: string;
  captionCustomStyle?: Partial<CaptionCustomStyle>;
  cropMode?: "cover" | "contain";
  hookText?: string;
  title?: string;
  showHookBadge?: boolean;
}

/**
 * Normalizes captions so that segment and word timestamps are relative to 0 (the start of the short clip).
 */
export function normalizeCaptionsForClip(
  captions: CaptionSegment[] | undefined,
  startTime: number,
  endTime: number
): CaptionSegment[] {
  if (!captions || !Array.isArray(captions) || captions.length === 0) {
    const duration = Math.max(1, endTime - startTime);
    return [
      {
        id: 1,
        start: 0,
        end: duration * 0.33,
        text: "Engaging viral moment",
        words: [
          { word: "Engaging", start: 0, end: duration * 0.11 },
          { word: "viral", start: duration * 0.11, end: duration * 0.22 },
          { word: "moment", start: duration * 0.22, end: duration * 0.33 },
        ],
      },
      {
        id: 2,
        start: duration * 0.34,
        end: duration * 0.66,
        text: "Watch this now",
        words: [
          { word: "Watch", start: duration * 0.34, end: duration * 0.44 },
          { word: "this", start: duration * 0.44, end: duration * 0.55 },
          { word: "now", start: duration * 0.55, end: duration * 0.66 },
        ],
      },
    ];
  }

  // Detect if captions are using absolute timestamps (relative to full video start)
  // vs. already relative to clip start (0-based).
  // If the first caption's start time is approximately equal to startTime (within 2s),
  // that strongly suggests they're absolute. If the first caption starts near 0, they're already relative.
  const firstStart = captions[0]?.start ?? 0;
  const isAbsolute = startTime > 2 && firstStart >= startTime - 2 && firstStart <= startTime + 30;

  const resultSegments: CaptionSegment[] = [];
  let nextId = 1;

  for (const seg of captions) {
    const rawStart = isAbsolute ? seg.start - startTime : seg.start;
    const rawEnd = isAbsolute ? seg.end - startTime : seg.end;

    const relStart = Math.max(0, Number(rawStart.toFixed(2)));
    const relEnd = Math.max(relStart + 0.3, Number(rawEnd.toFixed(2)));

    // Generate word timestamps if missing
    let words = seg.words;
    if (!words || words.length === 0) {
      const splitWords = seg.text.trim().split(/\s+/).filter(Boolean);
      const wordDuration = (relEnd - relStart) / Math.max(1, splitWords.length);
      words = splitWords.map((w, wIdx) => ({
        word: w,
        start: Number((relStart + wIdx * wordDuration).toFixed(2)),
        end: Number((relStart + (wIdx + 1) * wordDuration).toFixed(2)),
      }));
    } else {
      words = words.map((w) => {
        const wStart = isAbsolute ? w.start - startTime : w.start;
        const wEnd = isAbsolute ? w.end - startTime : w.end;
        return {
          word: w.word,
          start: Math.max(0, Number(wStart.toFixed(2))),
          end: Math.max(0.05, Number(wEnd.toFixed(2))),
        };
      });
    }

    // Chunk words strictly into groups of at most 3 words
    if (words.length <= 3) {
      resultSegments.push({
        id: seg.id || nextId++,
        start: relStart,
        end: relEnd,
        text: words.map((w) => w.word).join(" "),
        words,
      });
    } else {
      for (let i = 0; i < words.length; i += 3) {
        const chunkWords = words.slice(i, i + 3);
        const chunkStart = chunkWords[0].start;
        const chunkEnd = chunkWords[chunkWords.length - 1].end;
        resultSegments.push({
          id: nextId++,
          start: chunkStart,
          end: Math.max(chunkStart + 0.25, chunkEnd),
          text: chunkWords.map((w) => w.word).join(" "),
          words: chunkWords,
        });
      }
    }
  }

  return resultSegments;
}

function KineticCaptions({
  captions,
  preset = "hormozi",
  customStyle,
}: {
  captions: CaptionSegment[];
  preset?: string;
  customStyle?: Partial<CaptionCustomStyle>;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Resolve active caption design token config
  const style = useMemo(() => {
    let parsedCustom = customStyle;
    if (typeof parsedCustom === "string") {
      try {
        parsedCustom = JSON.parse(parsedCustom);
      } catch {
        parsedCustom = undefined;
      }
    }
    return getCaptionStyle(preset, parsedCustom);
  }, [preset, customStyle]);

  // Find active segment (with 0.25s grace period so it doesn't flash off during micro-pauses)
  const activeSegment = useMemo(() => {
    return captions.find(
      (c) => currentTime >= c.start && currentTime <= c.end + 0.25
    );
  }, [captions, currentTime]);

  if (!activeSegment) {
    return null;
  }

  // Ensure maximum words on screen according to preset (default 3)
  const maxWords = style.maxWordsPerLine || 3;
  const words = (activeSegment.words || []).slice(0, maxWords);
  if (words.length === 0) {
    return null;
  }

  // Identify the currently spoken word
  let activeWordIndex = words.findIndex(
    (w) => currentTime >= w.start && currentTime <= w.end + 0.06
  );

  // If between syllables in this active segment, lock to current or last spoken word
  if (activeWordIndex === -1) {
    for (let i = words.length - 1; i >= 0; i--) {
      if (currentTime >= words[i].start) {
        activeWordIndex = i;
        break;
      }
    }
    if (activeWordIndex === -1) {
      activeWordIndex = 0;
    }
  }

  // Dynamic font scaling with user font scale multiplier:
  const longestWord = Math.max(...words.map((w) => w.word.length), 1);
  const totalLetters = words.reduce((acc, w) => acc + w.word.length, 0);

  const scaleMultiplier = style.fontSizeScale || 1.0;
  let baseSize = Math.round(165 * scaleMultiplier);
  if (longestWord >= 8 || totalLetters >= 14) {
    baseSize = Math.round(138 * scaleMultiplier);
  }
  if (longestWord >= 11 || totalLetters >= 20) {
    baseSize = Math.round(112 * scaleMultiplier);
  }

  // Vertical position
  let verticalPosStyles: React.CSSProperties = {
    bottom: "22%",
    top: "auto",
  };
  if (style.position === "top") {
    verticalPosStyles = {
      top: "16%",
      bottom: "auto",
    };
  } else if (style.position === "middle") {
    verticalPosStyles = {
      top: "48%",
      transform: "translateY(-50%)",
      bottom: "auto",
    };
  }

  // Box background styling
  let containerStyles: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px 22px",
    padding: "16px 36px",
    borderRadius: "32px",
    maxWidth: "96%",
    transform: "translateZ(0)",
  };

  if (style.boxBackground === "dark_blur") {
    containerStyles = {
      ...containerStyles,
      background: "rgba(0, 0, 0, 0.64)",
      backdropFilter: "blur(14px)",
      border: `2px solid ${style.activeBorderColor || "rgba(255, 255, 255, 0.25)"}`,
      boxShadow: `0 20px 60px rgba(0, 0, 0, 0.85), 0 0 25px ${style.activeBgColor}25`,
    };
  } else if (style.boxBackground === "solid_black") {
    containerStyles = {
      ...containerStyles,
      background: "#000000",
      border: `2px solid ${style.activeBorderColor || "#ffffff"}`,
      boxShadow: "0 20px 50px rgba(0, 0, 0, 0.95)",
    };
  } else if (style.boxBackground === "pill_only") {
    containerStyles = {
      ...containerStyles,
      background: "transparent",
      border: "none",
      boxShadow: "none",
      padding: "8px 12px",
    };
  } else {
    // transparent
    containerStyles = {
      ...containerStyles,
      background: "transparent",
      border: "none",
      boxShadow: "none",
      padding: "8px 12px",
    };
  }

  return (
    <div
      style={{
        position: "absolute",
        left: "3%",
        right: "3%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 25,
        ...verticalPosStyles,
      }}
    >
      <div style={containerStyles}>
        {words.map((w, idx) => {
          const isActive = idx === activeWordIndex;

          const activeBoxShadow = style.shadowGlow
            ? `0 10px 40px ${style.activeBgColor}, 0 0 25px ${style.activeBgColor}`
            : "0 6px 20px rgba(0,0,0,0.45)";

          const strokeWidth = style.strokeWidth ?? 4;
          const strokeColor = style.inactiveStrokeColor || "#000000";

          return (
            <span
              key={`${idx}-${w.word}`}
              style={{
                display: "inline-block",
                fontSize: isActive ? `${Math.round(baseSize * 1.08)}px` : `${baseSize}px`,
                fontWeight: 900,
                fontFamily: style.fontFamily,
                textTransform: style.textTransform || "uppercase",
                letterSpacing: style.letterSpacing || "0.02em",
                lineHeight: 1.12,
                color: isActive ? style.activeColor : style.inactiveColor,
                backgroundColor: isActive ? style.activeBgColor : style.boxBackground === "pill_only" ? "rgba(0,0,0,0.6)" : "transparent",
                border: isActive
                  ? `3px solid ${style.activeBorderColor || style.activeBgColor}`
                  : style.boxBackground === "pill_only"
                  ? "2px solid rgba(255,255,255,0.15)"
                  : "3px solid transparent",
                borderRadius: "20px",
                padding: isActive ? "4px 28px" : "4px 10px",
                transform: isActive ? "scale(1.12)" : "scale(1.0)",
                transition: "all 0.08s cubic-bezier(0.16, 1, 0.3, 1)",
                WebkitTextStroke: isActive ? "0px transparent" : strokeWidth > 0 ? `${strokeWidth}px ${strokeColor}` : "none",
                textShadow: isActive
                  ? "none"
                  : strokeWidth > 0
                  ? `${strokeWidth}px ${strokeWidth}px 0 ${strokeColor}, -${strokeWidth}px -${strokeWidth}px 0 ${strokeColor}, ${strokeWidth}px -${strokeWidth}px 0 ${strokeColor}, -${strokeWidth}px ${strokeWidth}px 0 ${strokeColor}, 0 10px 25px rgba(0,0,0,0.95)`
                  : "0 4px 14px rgba(0,0,0,0.8)",
                boxShadow: isActive ? activeBoxShadow : "none",
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Main Short Video Remotion Composition:
 * Plays the full video starting at startTime and ending at endTime.
 * Renders 9:16 vertical video crop with real-time kinetic subtitles.
 */
export const ShortVideoComposition: React.FC<ShortCompositionProps> = ({
  videoUrl,
  startTime,
  endTime,
  captions,
  captionPreset = "hormozi",
  captionCustomStyle,
  cropMode = "cover",
  hookText,
  title,
  showHookBadge = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate start frame in source video
  const startFrame = Math.max(0, Math.round(startTime * fps));
  const durationFrames = Math.max(1, Math.round((endTime - startTime) * fps));

  // Normalize captions for this specific clip window
  const normalizedCaptions = useMemo(() => {
    return normalizeCaptionsForClip(captions, startTime, endTime);
  }, [captions, startTime, endTime]);

  // Preload and wait for web fonts to ensure captions render identically on Lambda Chromium
  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) return;
    const handle = delayRender("Wait for fonts to load");
    document.fonts.ready
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, []);

  // Hook badge animation: visible for first 4 seconds
  const hookOpacity = interpolate(frame, [0, 10, fps * 3.5, fps * 4.2], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#05070E",
        overflow: "hidden",
        width: "100%",
        height: "100%",
      }}
    >
      {/* Dynamic Google Fonts for Viral Caption Presets */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Bungee&family=Cinzel:wght@700;900&family=Montserrat:wght@700;800;900&family=Space+Grotesk:wght@700&display=swap');
      `}</style>
      {/* Background blurred ambient fill for contain mode or cinematic look */}
      {cropMode === "contain" && (
        <AbsoluteFill style={{ overflow: "hidden" }}>
          <Video
            src={videoUrl}
            trimBefore={startFrame}
            durationInFrames={durationFrames}
            muted
            useWebAudioApi={false}
            delayRenderTimeoutInMilliseconds={120000}
            onError={(err) => {
              console.warn("[Remotion] Background video warning:", err);
            }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "blur(40px) brightness(0.35)",
              transform: "scale(1.2)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* Main Video Stream */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <Video
          src={videoUrl}
          trimBefore={startFrame}
          durationInFrames={durationFrames}
          useWebAudioApi={false}
          delayRenderTimeoutInMilliseconds={120000}
          onError={(err) => {
            console.warn("[Remotion] Main video warning:", err);
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: cropMode === "cover" ? "cover" : "contain",
          }}
        />
      </AbsoluteFill>

      {/* Subtle top/bottom vignette gradients for high caption legibility */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 18%, transparent 68%, rgba(0,0,0,0.85) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Top Header Badge / Watermark */}
      <div
        style={{
          position: "absolute",
          top: "40px",
          left: "30px",
          right: "30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 30,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 18px",
            borderRadius: "999px",
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#22C55E",
              boxShadow: "0 0 10px #22C55E",
            }}
          />
          <span
            style={{
              fontSize: "14px",
              fontWeight: 800,
              color: "#FFFFFF",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            VidShorts 9:16
          </span>
        </div>

        {title && (
          <div
            style={{
              maxWidth: "50%",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontSize: "13px",
              fontWeight: 700,
              color: "rgba(255, 255, 255, 0.8)",
              padding: "6px 14px",
              borderRadius: "999px",
              background: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(8px)",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {title}
          </div>
        )}
      </div>

      {/* Hook Callout Notification (shows during opening seconds) */}
      {showHookBadge && hookText && hookOpacity > 0.05 && (
        <div
          style={{
            position: "absolute",
            top: "105px",
            left: "5%",
            right: "5%",
            opacity: hookOpacity,
            display: "flex",
            justifyContent: "center",
            zIndex: 30,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 20px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(168, 85, 247, 0.9))",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              boxShadow: "0 8px 30px rgba(239, 68, 68, 0.4)",
              color: "#FFFFFF",
              fontFamily: "system-ui, sans-serif",
              maxWidth: "90%",
            }}
          >
            <span style={{ fontSize: "18px" }}>🔥</span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 900,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
                textShadow: "0 1px 3px rgba(0,0,0,0.5)",
              }}
            >
              {hookText}
            </span>
          </div>
        </div>
      )}

      {/* Real-Time Word-by-Word Kinetic Subtitles */}
      <KineticCaptions
        captions={normalizedCaptions}
        preset={captionPreset}
        customStyle={captionCustomStyle}
      />
    </AbsoluteFill>
  );
};
