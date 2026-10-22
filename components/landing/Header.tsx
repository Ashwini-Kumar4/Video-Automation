"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Sparkles, Menu, X, Video, LayoutDashboard } from "lucide-react";
import { Show, UserButton } from "@clerk/nextjs";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-violet-950/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="size-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-600/30 group-hover:scale-110 transition-transform duration-200">
            <Video className="size-4 text-white" />
          </div>
          <span className="text-lg font-black tracking-tight">
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Vid
            </span>
            <span className="text-foreground">Shorts</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 hover:text-violet-300"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/10 px-3.5 py-1.5 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-sm font-semibold rounded-full px-5 py-2 inline-flex items-center hover:scale-105 hover:shadow-lg hover:shadow-violet-600/30 transition-all duration-200"
            >
              <Sparkles className="size-3.5 mr-1.5" />
              Start Free
            </Link>
          </Show>

          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-full px-4 py-2 border border-white/10 transition-all duration-200 inline-flex items-center gap-1.5"
            >
              <LayoutDashboard className="size-3.5 text-violet-400" />
              Dashboard
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "size-8 ring-2 ring-violet-500/30 hover:ring-violet-400 transition-all",
                },
              }}
            />
          </Show>
        </div>

        {/* Mobile hamburger */}
        <button
          id="mobile-menu-toggle"
          aria-label="Toggle mobile menu"
          className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        } bg-black/90 backdrop-blur-xl border-b border-white/10`}
      >
        <nav className="px-6 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-violet-300 py-2 border-b border-white/5 last:border-0 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-3 pt-2">
            <Show when="signed-out">
              <Link
                href="/sign-in"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center text-sm font-medium text-muted-foreground hover:bg-white/10 py-2 rounded-lg transition-colors border border-white/10"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center text-sm font-semibold bg-gradient-to-r from-violet-600 to-cyan-500 text-white py-2 rounded-full shadow"
              >
                Start Free
              </Link>
            </Show>

            <Show when="signed-in">
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center text-sm font-semibold bg-gradient-to-r from-violet-600 to-cyan-500 text-white py-2 rounded-full"
              >
                Go to Dashboard
              </Link>
              <UserButton />
            </Show>
          </div>
        </nav>
      </div>
    </header>
  );
}
