"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Video,
  Home,
  Film,
  Calendar,
  Sparkles,
  Settings,
  Plus,
  Zap,
  ChevronRight,
  LogOut,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton, useClerk } from "@clerk/nextjs";

interface DashboardSidebarProps {
  userFirstName?: string | null;
  userLastName?: string | null;
  userEmail?: string | null;
  userImageUrl?: string | null;
  onItemClick?: () => void;
  className?: string;
}

export function DashboardSidebar({
  userFirstName,
  userLastName,
  userEmail,
  userImageUrl,
  onItemClick,
  className,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();

  const fullName =
    [userFirstName, userLastName].filter(Boolean).join(" ") ||
    userFirstName ||
    "Creator";

  const navItems = [
    {
      name: "Home",
      href: "/dashboard",
      icon: Home,
      exact: true,
      badge: "Studio",
      badgeColor: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    },
    {
      name: "My Videos",
      href: "/dashboard/my-videos",
      icon: Film,
      badge: "12",
      badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    },
    {
      name: "Social Connections",
      href: "/dashboard/social-connections",
      icon: Share2,
    },
    {
      name: "Schedule Post",
      href: "/dashboard/schedule",
      icon: Calendar,
      badge: "Auto",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      name: "Pricing",
      href: "/dashboard/pricing",
      icon: Sparkles,
      badge: "Pro",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
  ];

  const isItemActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-[#0a0e1a]/95 backdrop-blur-xl border-r border-white/10 select-none",
        className
      )}
    >
      {/* 1. TOP: Logo & App Name */}
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between gap-3">
        <Link
          href="/dashboard"
          onClick={onItemClick}
          className="flex items-center gap-3 group transition-transform duration-200"
        >
          {/* Logo Icon */}
          <div className="relative size-10 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-600/30 group-hover:shadow-violet-500/50 group-hover:scale-105 transition-all duration-300">
            <Video className="size-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* App Name & Badge */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight leading-none">
                <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                  Vid
                </span>
                <span className="text-foreground">Shorts</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-gradient-to-r from-violet-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                AI
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium mt-0.5">
              Long-to-Short Studio
            </span>
          </div>
        </Link>
      </div>

      {/* Quick Action Button */}
      <div className="px-4 pt-4 pb-2">
        <Link
          href="/dashboard"
          onClick={onItemClick}
          className="group relative flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <Plus className="size-4 transition-transform group-hover:rotate-90 duration-300" />
          <span>New Short Video</span>
          <Sparkles className="size-3.5 text-cyan-200 animate-pulse ml-auto opacity-80" />
        </Link>
      </div>

      {/* 2. MENU OPTIONS */}
      <div className="flex-1 px-3 py-3 overflow-y-auto space-y-6">
        <div>
          <p className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
            Main Menu
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = isItemActive(item.href, item.exact);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    "group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-violet-600/20 to-cyan-500/10 text-white border border-violet-500/30 shadow-sm shadow-violet-500/20"
                      : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
                  )}
                >
                  {/* Active Left Indicator Bar */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-gradient-to-b from-violet-400 to-cyan-400 shadow-sm shadow-cyan-400/50" />
                  )}

                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "size-8 rounded-lg flex items-center justify-center transition-colors duration-200",
                        active
                          ? "bg-violet-600/30 text-violet-300 ring-1 ring-violet-400/30"
                          : "bg-white/5 text-muted-foreground group-hover:text-white group-hover:bg-white/10"
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <span className="tracking-tight">{item.name}</span>
                  </div>

                  {/* Badge */}
                  {item.badge && (
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-transform duration-200 group-hover:scale-105",
                        item.badgeColor
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* AI Credits / Usage Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-violet-950/40 via-[#0e1426] to-cyan-950/30 border border-violet-500/20 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Zap className="size-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-white">AI Credits</span>
            </div>
            <span className="text-[11px] font-bold text-cyan-300">45 / 50</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mb-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 shadow-sm shadow-cyan-500/50"
              style={{ width: "90%" }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>5 used this month</span>
            <Link
              href="/dashboard/pricing"
              onClick={onItemClick}
              className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline inline-flex items-center gap-0.5"
            >
              Upgrade
              <ChevronRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. FOOTER: User Settings */}
      <div className="p-3 border-t border-white/10 bg-black/20">
        <div className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all duration-200">
          <div className="flex items-center justify-between gap-2.5">
            {/* User Details & Avatar */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {/* Clerk UserButton as Avatar */}
              <div className="relative shrink-0 flex items-center justify-center size-9">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox:
                        "size-9 ring-2 ring-violet-500/30 hover:ring-cyan-400 transition-all",
                    },
                  }}
                  defaultOpen={false}
                />
              </div>

              {/* User Name & Plan */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {fullName}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {userEmail || "Pro Plan"}
                </p>
              </div>
            </div>

            {/* User Settings Link */}
            <Link
              href="/dashboard/settings"
              onClick={onItemClick}
              title="User Settings"
              className={cn(
                "size-8 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0",
                pathname === "/dashboard/settings"
                  ? "bg-violet-600/30 text-violet-300 border border-violet-500/30"
                  : "text-muted-foreground hover:text-white hover:bg-white/10 border border-transparent"
              )}
            >
              <Settings className="size-4 hover:rotate-45 transition-transform duration-300" />
            </Link>
          </div>

          {/* Quick Settings Sub-links */}
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-muted-foreground">
            <Link
              href="/dashboard/settings"
              onClick={onItemClick}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <Settings className="size-3" />
              <span>User Settings</span>
            </Link>
            <button
              onClick={() => signOut()}
              className="hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="size-3" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
