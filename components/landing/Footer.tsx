"use client";

import Link from "next/link";
import { Video, Share2, PlayCircle, Briefcase, Code2 } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Changelog", href: "#" },
    { label: "Roadmap", href: "#" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Tutorials", href: "#" },
    { label: "Community", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Partners", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "GDPR", href: "#" },
  ],
};

const socials = [
  { icon: Share2, href: "#", label: "Twitter" },
  { icon: PlayCircle, href: "#", label: "YouTube" },
  { icon: Briefcase, href: "#", label: "LinkedIn" },
  { icon: Code2, href: "#", label: "GitHub" },
];

export function Footer() {
  return (
    <footer id="footer" className="relative border-t border-white/8 overflow-hidden">
      {/* Faint gradient */}
      <div
        aria-hidden
        className="absolute bottom-0 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-violet-950/20 blur-[100px] pointer-events-none"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Main footer grid */}
        <div className="pt-14 pb-10 grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 group mb-4">
              <div className="size-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-600/30 group-hover:scale-110 transition-transform">
                <Video className="size-4 text-white" />
              </div>
              <span className="text-lg font-black tracking-tight">
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  Vid
                </span>
                <span className="text-foreground">Shorts</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-xs">
              AI-powered long-to-short video transformation. Turn your content
              into viral clips in minutes.
            </p>
            {/* Socials */}
            <div className="flex gap-3">
              {socials.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="size-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-violet-600/20 hover:border-violet-500/40 transition-all duration-200 group"
                >
                  <social.icon className="size-4 text-muted-foreground group-hover:text-violet-300 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="col-span-1">
              <h4 className="text-sm font-bold text-foreground mb-4">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-violet-300 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground/60">
            &copy; 2026 VidShorts Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-xs text-muted-foreground/60">
              All systems operational
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
