/**
 * Configuration for AI Shorts Video Generation
 * Modify values here to change generation counts, duration limits, and AI model settings.
 */

export interface ShortsGenerationConfig {
  /**
   * Number of viral short clips to generate from a long-form video.
   * Default is 5 (at least 4-5 shorts). Configure this number as needed.
   */
  generationCount: number;

  /**
   * Minimum duration for a generated short video in seconds.
   * Short form platforms reward videos with at least 20 seconds.
   */
  minDurationSeconds: number;

  /**
   * Maximum duration for a generated short video in seconds.
   * Standard vertical shorts/reels limit (90 seconds).
   */
  maxDurationSeconds: number;

  /**
   * Gemini model identifier to use for analysis.
   * Supported: 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'
   */
  geminiModel: string;

  /**
   * Creativity & variation temperature for Gemini model (0.0 - 1.0)
   */
  temperature: number;

  /**
   * Target aspect ratio for vertical shorts
   */
  targetAspectRatio: "9:16" | "1:1" | "16:9";

  /**
   * Minimum SEO ranking score threshold out of 100
   */
  minSeoScore: number;
}

export const SHORTS_CONFIG: ShortsGenerationConfig = {
  // Configured to generate 5 engaging shorts (fulfilling "at least 4-5 short videos")
  generationCount: 5,
  minDurationSeconds: 20,
  maxDurationSeconds: 90,
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
  temperature: 0.7,
  targetAspectRatio: "9:16",
  minSeoScore: 80,
};

export default SHORTS_CONFIG;
