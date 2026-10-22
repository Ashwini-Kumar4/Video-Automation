/**
 * Centralized Caption Design System for VidShorts
 * Defines all viral caption presets, customizable font families,
 * color palettes, and styling rules for real-time Remotion player rendering.
 */

export interface CaptionCustomStyle {
  presetId: string;
  fontFamily: string;
  fontFamilyName: string;
  fontSizeScale: number; // 0.85 to 1.3
  activeColor: string;
  activeBgColor: string;
  inactiveColor: string;
  inactiveStrokeColor: string;
  strokeWidth: number; // e.g. 0 to 6
  textTransform: "uppercase" | "none" | "capitalize";
  position: "bottom" | "middle" | "top";
  maxWordsPerLine: number; // 1, 2, or 3
  boxBackground: "dark_blur" | "transparent" | "solid_black" | "pill_only";
  shadowGlow: boolean;
  activeBorderColor?: string;
  letterSpacing?: string;
}

export interface CaptionPresetItem {
  id: string;
  name: string;
  badge: string;
  description: string;
  category: "viral" | "modern" | "cinematic" | "creative";
  previewText: {
    before: string;
    active: string;
    after: string;
  };
  style: CaptionCustomStyle;
  tagline: string;
}

export interface FontOption {
  id: string;
  name: string;
  cssFamily: string;
  category: string;
  sample: string;
  bestFor: string;
}

export interface ColorPaletteOption {
  id: string;
  name: string;
  activeBg: string;
  activeText: string;
  glowColor: string;
}

/**
 * Curated list of high-impact fonts suited for mobile 9:16 vertical video
 */
export const AVAILABLE_FONTS: FontOption[] = [
  {
    id: "impact",
    name: "Impact Viral",
    cssFamily: "'Impact', 'Anton', 'Arial Black', -apple-system, sans-serif",
    category: "Heavy & Punchy",
    sample: "RETENTION",
    bestFor: "Hormozi, MrBeast & Shorts Algorithms",
  },
  {
    id: "arial_black",
    name: "Arial Black",
    cssFamily: "'Arial Black', 'Impact', sans-serif",
    category: "Bold Classic",
    sample: "HIGH IMPACT",
    bestFor: "Universal readability & quick scanning",
  },
  {
    id: "montserrat",
    name: "Montserrat Bold",
    cssFamily: "'Montserrat', 'Inter', system-ui, sans-serif",
    category: "Modern Geometric",
    sample: "CLEAN HOOK",
    bestFor: "Business, tech & podcast summaries",
  },
  {
    id: "space_grotesk",
    name: "Space Grotesk",
    cssFamily: "'Space Grotesk', 'Courier New', monospace, sans-serif",
    category: "Cyber / Tech",
    sample: "NEXT LEVEL",
    bestFor: "AI, coding, crypto & futurism",
  },
  {
    id: "bungee",
    name: "Bungee Pop",
    cssFamily: "'Bungee', 'Impact', cursive, sans-serif",
    category: "Punchy Comic",
    sample: "WATCH THIS",
    bestFor: "Comedy, reactions & lifestyle vloggers",
  },
  {
    id: "cinzel",
    name: "Cinzel Serif",
    cssFamily: "'Cinzel', 'Georgia', 'Times New Roman', serif",
    category: "Cinematic Prestige",
    sample: "EPIC STORY",
    bestFor: "Documentaries, motivation & history",
  },
];

/**
 * Curated active word color palettes (Viral high contrast combinations)
 */
export const ACTIVE_COLOR_PALETTES: ColorPaletteOption[] = [
  {
    id: "electric_yellow",
    name: "Electric Yellow",
    activeBg: "#FFE600",
    activeText: "#000000",
    glowColor: "rgba(255, 230, 0, 0.75)",
  },
  {
    id: "beast_green",
    name: "Beast Lime Green",
    activeBg: "#22C55E",
    activeText: "#000000",
    glowColor: "rgba(34, 197, 94, 0.8)",
  },
  {
    id: "cyber_cyan",
    name: "Cyber Neon Cyan",
    activeBg: "#00F0FF",
    activeText: "#000000",
    glowColor: "rgba(0, 240, 255, 0.8)",
  },
  {
    id: "hot_coral",
    name: "Hot Coral Flame",
    activeBg: "#FF3366",
    activeText: "#FFFFFF",
    glowColor: "rgba(255, 51, 102, 0.85)",
  },
  {
    id: "neon_purple",
    name: "Electric Violet",
    activeBg: "#A855F7",
    activeText: "#FFFFFF",
    glowColor: "rgba(168, 85, 247, 0.8)",
  },
  {
    id: "pure_gold",
    name: "Sunburst Gold",
    activeBg: "#F59E0B",
    activeText: "#000000",
    glowColor: "rgba(245, 158, 11, 0.8)",
  },
  {
    id: "crisp_white",
    name: "Pure Monochrome",
    activeBg: "#FFFFFF",
    activeText: "#000000",
    glowColor: "rgba(255, 255, 255, 0.7)",
  },
];

/**
 * The 6 Master Caption Presets (One place for all design tokens)
 */
export const CAPTION_PRESETS: CaptionPresetItem[] = [
  {
    id: "hormozi",
    name: "Alex Hormozi Viral",
    badge: "🔥 Top Viral",
    tagline: "High retention kinetic yellow pill with heavy outline",
    description: "Thick Impact font, bold electric yellow pill on active word, heavy black drop stroke.",
    category: "viral",
    previewText: {
      before: "MAKE",
      active: "MONEY",
      after: "FASTER",
    },
    style: {
      presetId: "hormozi",
      fontFamily: "'Impact', 'Anton', 'Arial Black', -apple-system, sans-serif",
      fontFamilyName: "Impact",
      fontSizeScale: 1.0,
      activeColor: "#000000",
      activeBgColor: "#FFE600",
      inactiveColor: "#FFE600",
      inactiveStrokeColor: "#000000",
      strokeWidth: 4,
      textTransform: "uppercase",
      position: "bottom",
      maxWordsPerLine: 3,
      boxBackground: "dark_blur",
      shadowGlow: true,
      activeBorderColor: "#FFE600",
      letterSpacing: "0.02em",
    },
  },
  {
    id: "cyber",
    name: "Cyberpunk Neon",
    badge: "⚡ Sci-Fi / Tech",
    tagline: "Luminous electric cyan and neon glow with dark contrast",
    description: "Futuristic tech typography with vibrant cyan active pill, intense outer glow, and cyan-tinted border.",
    category: "modern",
    previewText: {
      before: "NEXT",
      active: "GEN",
      after: "AI",
    },
    style: {
      presetId: "cyber",
      fontFamily: "'Space Grotesk', 'Impact', sans-serif",
      fontFamilyName: "Space Grotesk",
      fontSizeScale: 1.0,
      activeColor: "#000000",
      activeBgColor: "#00F0FF",
      inactiveColor: "#FFFFFF",
      inactiveStrokeColor: "#050b14",
      strokeWidth: 4,
      textTransform: "uppercase",
      position: "bottom",
      maxWordsPerLine: 3,
      boxBackground: "dark_blur",
      shadowGlow: true,
      activeBorderColor: "#00F0FF",
      letterSpacing: "0.04em",
    },
  },
  {
    id: "beast",
    name: "MrBeast Explosive",
    badge: "💥 Maximum Punch",
    tagline: "Bold lime green burst with high-impact comic energy",
    description: "Max-energy comic style with vivid green active word, deep 3D drop shadow, and punchy scaling.",
    category: "viral",
    previewText: {
      before: "YOU",
      active: "WON'T",
      after: "BELIEVE",
    },
    style: {
      presetId: "beast",
      fontFamily: "'Arial Black', 'Impact', sans-serif",
      fontFamilyName: "Arial Black",
      fontSizeScale: 1.05,
      activeColor: "#000000",
      activeBgColor: "#22C55E",
      inactiveColor: "#FFFFFF",
      inactiveStrokeColor: "#000000",
      strokeWidth: 5,
      textTransform: "uppercase",
      position: "bottom",
      maxWordsPerLine: 3,
      boxBackground: "dark_blur",
      shadowGlow: true,
      activeBorderColor: "#22C55E",
      letterSpacing: "0.03em",
    },
  },
  {
    id: "cinema",
    name: "Cinematic Gold",
    badge: "🎬 Prestige",
    tagline: "Refined luxury serif typography with warm gold brilliance",
    description: "Elegant serif font with deep gold highlight, ivory accents, and understated blurred framing.",
    category: "cinematic",
    previewText: {
      before: "THE",
      active: "SECRET",
      after: "LIES",
    },
    style: {
      presetId: "cinema",
      fontFamily: "'Cinzel', 'Georgia', 'Times New Roman', serif",
      fontFamilyName: "Cinzel",
      fontSizeScale: 0.95,
      activeColor: "#000000",
      activeBgColor: "#F59E0B",
      inactiveColor: "#F8FAFC",
      inactiveStrokeColor: "#0f172a",
      strokeWidth: 3,
      textTransform: "uppercase",
      position: "bottom",
      maxWordsPerLine: 3,
      boxBackground: "dark_blur",
      shadowGlow: true,
      activeBorderColor: "#F59E0B",
      letterSpacing: "0.06em",
    },
  },
  {
    id: "comic",
    name: "Comic Bubble Pop",
    badge: "🎨 Playful",
    tagline: "Hot coral active accent with bouncing fun vibes",
    description: "Dynamic rounded punch with hot coral pill, yellow highlights, and thick comic border.",
    category: "creative",
    previewText: {
      before: "LOOK",
      active: "AT",
      after: "THIS",
    },
    style: {
      presetId: "comic",
      fontFamily: "'Bungee', 'Impact', cursive, sans-serif",
      fontFamilyName: "Bungee",
      fontSizeScale: 1.0,
      activeColor: "#FFFFFF",
      activeBgColor: "#FF3366",
      inactiveColor: "#FFE600",
      inactiveStrokeColor: "#000000",
      strokeWidth: 5,
      textTransform: "uppercase",
      position: "bottom",
      maxWordsPerLine: 3,
      boxBackground: "pill_only",
      shadowGlow: true,
      activeBorderColor: "#FF3366",
      letterSpacing: "0.03em",
    },
  },
  {
    id: "minimal",
    name: "Clean Minimalist",
    badge: "✨ Subtle & Sleek",
    tagline: "Modern understated frosted glass without heavy borders",
    description: "Clean modern geometric typeface with frosted glass pill, crisp white text, and minimal distraction.",
    category: "modern",
    previewText: {
      before: "SIMPLY",
      active: "BETTER",
      after: "CLARITY",
    },
    style: {
      presetId: "minimal",
      fontFamily: "'Montserrat', 'Inter', -apple-system, sans-serif",
      fontFamilyName: "Montserrat",
      fontSizeScale: 0.95,
      activeColor: "#FFFFFF",
      activeBgColor: "rgba(255, 255, 255, 0.25)",
      inactiveColor: "#CBD5E1",
      inactiveStrokeColor: "transparent",
      strokeWidth: 0,
      textTransform: "uppercase",
      position: "bottom",
      maxWordsPerLine: 3,
      boxBackground: "dark_blur",
      shadowGlow: false,
      activeBorderColor: "rgba(255, 255, 255, 0.4)",
      letterSpacing: "0.02em",
    },
  },
  {
    id: "synthwave",
    name: "Retro Synthwave",
    badge: "🌴 80s Retro",
    tagline: "Hot magenta pill with electric violet glow & arcade punch",
    description: "Nostalgic 80s neon aesthetic with hot pink active word, glowing violet shadow, and cyan accents.",
    category: "creative",
    previewText: {
      before: "BACK",
      active: "TO THE",
      after: "FUTURE",
    },
    style: {
      presetId: "synthwave",
      fontFamily: "'Impact', 'Arial Black', sans-serif",
      fontFamilyName: "Impact",
      fontSizeScale: 1.0,
      activeColor: "#FFFFFF",
      activeBgColor: "#FF007F",
      inactiveColor: "#00F0FF",
      inactiveStrokeColor: "#2B004D",
      strokeWidth: 4,
      textTransform: "uppercase",
      position: "bottom",
      maxWordsPerLine: 3,
      boxBackground: "dark_blur",
      shadowGlow: true,
      activeBorderColor: "#FF007F",
      letterSpacing: "0.04em",
    },
  },
  {
    id: "fire",
    name: "Red Alert Flame",
    badge: "🚨 High Urgency",
    tagline: "Fiery crimson pill for urgent hooks and shocking revelations",
    description: "Urgent red highlight with thick outline and fiery outer aura, proven to maximize hook retention.",
    category: "viral",
    previewText: {
      before: "STOP",
      active: "DOING",
      after: "THIS",
    },
    style: {
      presetId: "fire",
      fontFamily: "'Arial Black', 'Impact', sans-serif",
      fontFamilyName: "Arial Black",
      fontSizeScale: 1.05,
      activeColor: "#FFFFFF",
      activeBgColor: "#EF4444",
      inactiveColor: "#FFFFFF",
      inactiveStrokeColor: "#000000",
      strokeWidth: 5,
      textTransform: "uppercase",
      position: "bottom",
      maxWordsPerLine: 3,
      boxBackground: "dark_blur",
      shadowGlow: true,
      activeBorderColor: "#EF4444",
      letterSpacing: "0.03em",
    },
  },
  {
    id: "emerald",
    name: "Wealth & Finance",
    badge: "💎 Cash Empire",
    tagline: "Deep emerald mint pill with gold accents for finance & business",
    description: "High-value business vibe with rich emerald green active word, crisp white text, and luxury framing.",
    category: "modern",
    previewText: {
      before: "MAKE",
      active: "PASSIVE",
      after: "INCOME",
    },
    style: {
      presetId: "emerald",
      fontFamily: "'Montserrat', 'Arial Black', sans-serif",
      fontFamilyName: "Montserrat",
      fontSizeScale: 1.0,
      activeColor: "#000000",
      activeBgColor: "#10B981",
      inactiveColor: "#FEF08A",
      inactiveStrokeColor: "#064E3B",
      strokeWidth: 4,
      textTransform: "uppercase",
      position: "bottom",
      maxWordsPerLine: 3,
      boxBackground: "dark_blur",
      shadowGlow: true,
      activeBorderColor: "#10B981",
      letterSpacing: "0.03em",
    },
  },
];

/**
 * Resolves a full CaptionCustomStyle given an optional preset id and optional overrides
 */
export function getCaptionStyle(
  presetId?: string,
  overrides?: Partial<CaptionCustomStyle>
): CaptionCustomStyle {
  const targetId = presetId?.toLowerCase() || "hormozi";
  const found = CAPTION_PRESETS.find((p) => p.id === targetId) || CAPTION_PRESETS[0];

  return {
    ...found.style,
    ...(overrides || {}),
  };
}

/**
 * Parses caption style stored in database (either as preset name or JSON string)
 */
export function parseCaptionStyleFromDb(
  storedPreset?: string | null,
  storedStyleJson?: string | null
): CaptionCustomStyle {
  if (storedStyleJson) {
    try {
      const parsed = JSON.parse(storedStyleJson);
      return getCaptionStyle(parsed.presetId || storedPreset || "hormozi", parsed);
    } catch {
      // fallback
    }
  }

  return getCaptionStyle(storedPreset || "hormozi");
}
