"use client";

import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import Image from "next/image";
import {
  Settings,
  User,
  Sliders,
  Shield,
  Save,
  CheckCircle,
  LogOut,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();

  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [captionStyle, setCaptionStyle] = useState("hormozi");
  const [autoEmojis, setAutoEmojis] = useState(true);
  const [autoBroll, setAutoBroll] = useState(true);
  const [notifyOnComplete, setNotifyOnComplete] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="pb-2 border-b border-white/10 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Settings className="size-6 text-violet-400" />
            <span>User Settings</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your account credentials, AI video preferences, and social publishing integrations.
          </p>
        </div>

        {/* Clerk Manage Account Trigger */}
        <Button
          variant="outline"
          onClick={() => openUserProfile()}
          className="border-white/15 hover:bg-white/10 text-xs font-semibold"
        >
          <User className="size-3.5 mr-1.5" />
          Manage Clerk Profile
        </Button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="size-4 text-emerald-400 shrink-0" />
          <span>Preferences updated successfully!</span>
        </div>
      )}

      {/* 1. Account Profile Card */}
      <div className="bg-[#0c1222] border border-white/10 rounded-2xl p-6 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <User className="size-4 text-cyan-400" />
          <span>Profile & Account</span>
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-4">
            {/* User Avatar */}
            {user?.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt="Profile"
                width={56}
                height={56}
                unoptimized
                className="size-14 rounded-full ring-2 ring-violet-500/40 object-cover"
              />
            ) : (
              <div className="size-14 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white text-lg font-bold">
                {user?.firstName?.[0] || "U"}
              </div>
            )}

            <div>
              <h4 className="text-sm font-bold text-white">
                {[user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
                  user?.username ||
                  "Content Creator"}
              </h4>
              <p className="text-xs text-muted-foreground">
                {user?.primaryEmailAddress?.emailAddress || "user@vidshorts.ai"}
              </p>
              <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/20">
                <Zap className="size-2.5 text-cyan-400" />
                <span>Pro Creator Plan</span>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => openUserProfile()}
            className="border-white/15 hover:bg-white/10 text-xs self-start sm:self-center"
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* 2. AI Video Defaults Form */}
      <form onSubmit={handleSave} className="bg-[#0c1222] border border-white/10 rounded-2xl p-6 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sliders className="size-4 text-violet-400" />
          <span>AI Generation Preferences</span>
        </h3>

        {/* Default Aspect Ratio */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Default Clip Aspect Ratio
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "9:16", label: "9:16 Vertical", desc: "TikTok, Shorts & Reels" },
              { id: "1:1", label: "1:1 Square", desc: "Instagram & LinkedIn" },
              { id: "16:9", label: "16:9 Landscape", desc: "Standard YouTube" },
            ].map((ratio) => (
              <button
                key={ratio.id}
                type="button"
                onClick={() => setAspectRatio(ratio.id)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all cursor-pointer",
                  aspectRatio === ratio.id
                    ? "bg-violet-600/20 border-violet-500 text-white"
                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                )}
              >
                <div className="font-semibold text-xs text-white">{ratio.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{ratio.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Default Caption Style */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Default Caption Style
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "hormozi", name: "Hormozi Bold", desc: "Yellow/Green Pop" },
              { id: "beast", name: "MrBeast Punchy", desc: "Red/White Flash" },
              { id: "minimal", name: "Clean Minimalist", desc: "White Subtle" },
            ].map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setCaptionStyle(style.id)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all cursor-pointer",
                  captionStyle === style.id
                    ? "bg-cyan-500/20 border-cyan-500 text-white"
                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                )}
              >
                <div className="font-semibold text-xs text-white">{style.name}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{style.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div>
              <p className="text-xs font-semibold text-white">Auto-Insert Animated Emojis</p>
              <p className="text-[11px] text-muted-foreground">AI automatically adds synced emojis to highlight keywords.</p>
            </div>
            <input
              type="checkbox"
              checked={autoEmojis}
              onChange={(e) => setAutoEmojis(e.target.checked)}
              className="size-4 accent-violet-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div>
              <p className="text-xs font-semibold text-white">Auto B-roll Visual Overlays</p>
              <p className="text-[11px] text-muted-foreground">Insert AI background footage during speaker transitions.</p>
            </div>
            <input
              type="checkbox"
              checked={autoBroll}
              onChange={(e) => setAutoBroll(e.target.checked)}
              className="size-4 accent-violet-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div>
              <p className="text-xs font-semibold text-white">Email Notifications When Render Finishes</p>
              <p className="text-[11px] text-muted-foreground">Receive instant download links in your inbox.</p>
            </div>
            <input
              type="checkbox"
              checked={notifyOnComplete}
              onChange={(e) => setNotifyOnComplete(e.target.checked)}
              className="size-4 accent-violet-600 rounded cursor-pointer"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold text-xs h-10 px-6 rounded-xl"
        >
          <Save className="size-3.5 mr-1.5" />
          Save Preferences
        </Button>
      </form>

      {/* 3. Account Security & Sign Out */}
      <div className="bg-[#0c1222] border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="size-4 text-emerald-400" />
            <span>Account Security & Session</span>
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Signed in via Clerk Auth. You can safely sign out of all active devices.
          </p>
        </div>

        <Button
          variant="destructive"
          onClick={() => signOut()}
          className="bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold h-9 shrink-0"
        >
          <LogOut className="size-3.5 mr-1.5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
