import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { UserSync } from "@/components/auth/UserSync";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VidShorts — AI Long-to-Short Video Generator",
  description:
    "Turn your long-form videos into viral short-form clips in seconds. Powered by Gemini AI. Auto captions, smart reframing, virality scores — for TikTok, Reels & YouTube Shorts.",
  keywords: [
    "AI video editor",
    "long to short video",
    "TikTok clips",
    "YouTube Shorts",
    "Reels generator",
    "auto captions",
    "video AI",
  ],
  openGraph: {
    title: "VidShorts — AI Long-to-Short Video Generator",
    description:
      "Turn your long-form videos into viral short-form clips in seconds using AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        theme: dark,
        variables: {
          colorPrimary: "#8b5cf6",
          colorBackground: "#090d16",
          borderRadius: "0.75rem",
        },
        elements: {
          card: "bg-[#0c1222]/90 backdrop-blur-xl border border-white/10 shadow-2xl",
          formButtonPrimary:
            "bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90 text-white font-medium shadow-lg shadow-violet-500/20",
          footerActionLink: "text-violet-400 hover:text-cyan-400",
        },
      }}
    >
      <html
        lang="en"
        className={cn(
          "h-full dark antialiased",
          geistSans.variable,
          geistMono.variable,
          "font-sans",
          inter.variable
        )}
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <Suspense fallback={null}>
            <UserSync />
          </Suspense>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
