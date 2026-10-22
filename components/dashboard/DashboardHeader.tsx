"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Video, Bell, Sparkles, LayoutDashboard, Film, Subtitles, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  userFirstName?: string | null;
}

export function DashboardHeader({}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Logo & Nav */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="size-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-transform duration-200">
              <Video className="size-4 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight">
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Vid
              </span>
              <span className="text-foreground">Shorts</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 text-white flex items-center gap-2"
            >
              <LayoutDashboard className="size-4 text-violet-400" />
              Workspace
            </Link>
            <Link
              href="#clips"
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <Film className="size-4" />
              Clips
            </Link>
            <Link
              href="#captions"
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <Subtitles className="size-4" />
              Captions
            </Link>
            <Link
              href="#analytics"
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <BarChart3 className="size-4" />
              Analytics
            </Link>
          </nav>
        </div>

        {/* Right: Actions & User Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">
            <Sparkles className="size-3 text-cyan-400" />
            <span>AI Credits: 45 / 50</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-white hover:bg-white/10 relative"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            <span className="absolute top-2 right-2 size-2 rounded-full bg-cyan-400" />
          </Button>

          {/* Clerk User Button */}
          <div className="pl-2 border-l border-white/10 flex items-center">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "size-9 ring-2 ring-violet-500/30 hover:ring-violet-400 transition-all",
                },
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
