"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const stats = [
  { value: "10x", label: "Faster editing" },
  { value: "98%", label: "Accuracy rate" },
  { value: "50K+", label: "Creators" },
];

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16"
    >
      {/* Ambient background orbs */}
      <div
        aria-hidden
        className="absolute top-1/4 -left-32 size-[500px] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute bottom-1/4 -right-32 size-[500px] rounded-full bg-cyan-500/15 blur-[120px] pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_oklch(0.15_0.05_270)_0%,_transparent_70%)] pointer-events-none"
      />

      {/* Grid overlay */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center flex flex-col items-center gap-8">
        {/* Eyebrow badge */}
        <Badge
          id="hero-badge"
          className="px-4 py-1.5 rounded-full border border-violet-500/40 bg-violet-500/10 text-violet-300 text-sm font-medium animate-pulse"
        >
          <Sparkles className="size-3.5 mr-1.5 inline" />
          Powered by Gemini AI
        </Badge>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none max-w-5xl">
          Turn Long Videos into{" "}
          <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Viral Shorts
          </span>
          <br />
          <span className="text-foreground/90">in Seconds</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          VidShorts uses advanced AI to automatically detect the most engaging
          moments in your long-form videos and transform them into perfectly
          cropped, captioned short-form clips — ready for TikTok, Reels &
          YouTube Shorts.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            id="hero-cta-primary"
            href="/sign-up"
            className="inline-flex items-center justify-center bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold px-8 rounded-full hover:scale-105 hover:shadow-xl hover:shadow-violet-600/40 transition-all duration-300 text-base h-12"
          >
            <Sparkles className="size-4 mr-2" />
            Start for Free
            <ArrowRight className="size-4 ml-2" />
          </Link>
          <Button
            id="hero-cta-demo"
            variant="outline"
            size="lg"
            className="border-white/20 hover:bg-white/10 hover:border-violet-400/50 font-semibold px-8 rounded-full transition-all duration-300 h-12 text-base"
          >
            <Play className="size-4 mr-2 fill-current" />
            Watch Demo
          </Button>
        </div>

        {/* Social proof strip */}
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 pt-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl md:text-4xl font-black bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Hero illustration */}
        <div className="relative w-full max-w-5xl mt-6 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-violet-950/50 group">
          {/* Glow outline */}
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 pointer-events-none z-10" />
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-violet-600/20 to-cyan-500/20 blur-sm pointer-events-none" />

          <Image
            src="/hero-illustration.jpg"
            alt="VidShorts AI video transformation visualization"
            width={1792}
            height={1008}
            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
            priority
          />

          {/* Overlay UI chrome */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2">
              <p className="text-xs text-white/70 font-medium">
                🎬 Processing: podcast_ep42.mp4 — 1h 23m
              </p>
            </div>
            <div className="bg-green-500/20 backdrop-blur-md border border-green-500/40 rounded-xl px-4 py-2">
              <p className="text-xs text-green-400 font-semibold">
                ✓ 7 Clips Generated
              </p>
            </div>
          </div>
        </div>

        {/* Platform logos */}
        <p className="text-xs text-muted-foreground/60 uppercase tracking-widest">
          Export instantly to
        </p>
        <div className="flex items-center gap-6 opacity-60">
          {["TikTok", "Reels", "Shorts", "Twitter/X", "LinkedIn"].map(
            (platform) => (
              <span
                key={platform}
                className="text-sm font-semibold text-muted-foreground hover:text-violet-300 transition-colors cursor-default"
              >
                {platform}
              </span>
            )
          )}
        </div>
      </div>
    </section>
  );
}
