"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Sparkles,
  Bell,
  Video,
  ChevronRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { DashboardSidebar } from "./DashboardSidebar";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  user: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    imageUrl?: string | null;
  };
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const pathname = usePathname();

  // Dynamic Page Title & Breadcrumb based on path
  const getPageInfo = () => {
    if (pathname === "/dashboard/my-videos") {
      return {
        title: "My Videos",
        subtitle: "Library of generated short-form clips & drafts",
      };
    }
    if (pathname === "/dashboard/schedule") {
      return {
        title: "Schedule Post",
        subtitle: "Multi-platform auto-scheduler for TikTok, Reels & Shorts",
      };
    }
    if (pathname === "/dashboard/pricing") {
      return {
        title: "Pricing & Credits",
        subtitle: "Upgrade your creator plan and supercharge video output",
      };
    }
    if (pathname === "/dashboard/settings") {
      return {
        title: "User Settings",
        subtitle: "Manage your profile, AI presets, and connected accounts",
      };
    }
    return {
      title: "Studio Workspace",
      subtitle: "Turn long videos into viral AI-powered shorts in seconds",
    };
  };

  const pageInfo = getPageInfo();

  const notifications = [
    {
      id: "1",
      title: "Clip rendered in 1080p",
      desc: "Viral Hook detected at 14:22 is ready to download.",
      time: "2m ago",
      icon: CheckCircle2,
      iconColor: "text-emerald-400",
    },
    {
      id: "2",
      title: "Scheduled post queued",
      desc: "Scheduled for TikTok & YouTube Shorts today at 6:00 PM.",
      time: "1h ago",
      icon: Clock,
      iconColor: "text-cyan-400",
    },
    {
      id: "3",
      title: "Monthly Credits Refreshed",
      desc: "You have 45 / 50 AI video credits remaining.",
      time: "1d ago",
      icon: Sparkles,
      iconColor: "text-violet-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* 1. DESKTOP SIDEBAR (Visible on lg and larger) */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-72 z-30">
        <DashboardSidebar
          userFirstName={user.firstName}
          userLastName={user.lastName}
          userEmail={user.email}
          userImageUrl={user.imageUrl}
        />
      </div>

      {/* 2. MOBILE SIDEBAR DRAWER (Visible when toggled on mobile) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Sliding Drawer */}
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl flex flex-col">
            <DashboardSidebar
              userFirstName={user.firstName}
              userLastName={user.lastName}
              userEmail={user.email}
              userImageUrl={user.imageUrl}
              onItemClick={() => setMobileOpen(false)}
            />
            {/* Close Button Floating on top right */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close sidebar"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT WRAPPER (Pushed right on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* TOPBAR HEADER */}
        <header className="sticky top-0 z-20 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            {/* Left: Mobile Toggle & Page Breadcrumbs */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden text-muted-foreground hover:text-white hover:bg-white/10"
                aria-label="Open navigation menu"
              >
                <Menu className="size-5" />
              </Button>

              {/* Mobile Brand Mark when sidebar hidden */}
              <Link
                href="/dashboard"
                className="lg:hidden flex items-center gap-2 mr-2"
              >
                <div className="size-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
                  <Video className="size-4 text-white" />
                </div>
              </Link>

              {/* Breadcrumb / Title */}
              <div className="hidden sm:flex flex-col">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Link href="/dashboard" className="hover:text-white transition-colors">
                    Dashboard
                  </Link>
                  <ChevronRight className="size-3 text-muted-foreground/50" />
                  <span className="text-white font-medium">{pageInfo.title}</span>
                </div>
                <h1 className="text-sm font-semibold text-foreground tracking-tight">
                  {pageInfo.subtitle}
                </h1>
              </div>
            </div>

            {/* Right: Actions, AI Credits, Notifications & User */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* AI Credits Pill */}
              <Link
                href="/dashboard/pricing"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500/15 to-cyan-500/15 border border-violet-500/30 hover:border-violet-500/50 text-xs font-semibold text-violet-300 hover:text-white transition-all duration-200 group"
              >
                <Sparkles className="size-3 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>45 Credits</span>
                <span className="hidden md:inline text-[10px] text-cyan-400 font-normal">
                  (Upgrade)
                </span>
              </Link>

              {/* Notifications Popover */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative text-muted-foreground hover:text-white hover:bg-white/10"
                  aria-label="Notifications"
                >
                  <Bell className="size-4" />
                  <span className="absolute top-2 right-2 size-2 rounded-full bg-cyan-400 animate-pulse" />
                </Button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0c1222] border border-white/10 shadow-2xl p-4 z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <h4 className="text-sm font-semibold text-white">Notifications</h4>
                      <span className="text-[11px] text-cyan-400 font-medium">
                        3 new
                      </span>
                    </div>
                    <div className="mt-3 space-y-2.5">
                      {notifications.map((n) => {
                        const Icon = n.icon;
                        return (
                          <div
                            key={n.id}
                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors"
                          >
                            <div className="size-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                              <Icon className={cn("size-4", n.iconColor)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white truncate">
                                {n.title}
                              </p>
                              <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                                {n.desc}
                              </p>
                              <span className="text-[10px] text-muted-foreground/70 mt-1 block">
                                {n.time}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-white/10 text-center">
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-xs text-violet-400 hover:text-violet-300 font-medium"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Clerk UserButton */}
              <div className="pl-1 sm:pl-2 border-l border-white/10 flex items-center">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox:
                        "size-9 ring-2 ring-violet-500/30 hover:ring-cyan-400 transition-all",
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* 4. MAIN CONTENT VIEWPORT */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
