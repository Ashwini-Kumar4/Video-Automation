"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    id: "faq-1",
    question: "How long does it take to process a video?",
    answer:
      "Processing time depends on video length and quality. A 60-minute 1080p video typically takes 2–4 minutes. Our GPU-accelerated pipeline ensures you're never waiting long. Batch jobs run overnight automatically.",
  },
  {
    id: "faq-2",
    question: "What video formats does VidShorts support?",
    answer:
      "VidShorts supports all major video formats including MP4, MOV, AVI, MKV, and WebM. You can also paste YouTube, Vimeo, Loom, or direct download links and we'll handle the rest.",
  },
  {
    id: "faq-3",
    question: "Can I edit the clips after the AI generates them?",
    answer:
      "Absolutely. Every AI-generated clip opens in our lightweight editor where you can trim start/end points, edit captions, adjust crop framing, change templates, add B-roll, and fine-tune audio before exporting.",
  },
  {
    id: "faq-4",
    question: "Is there a free trial? Do I need a credit card?",
    answer:
      "The Starter plan is free forever — no credit card required. You get 5 videos/month with full AI processing. Upgrade only when you need more volume or premium features.",
  },
  {
    id: "faq-5",
    question: "How accurate are the auto-captions?",
    answer:
      "Our speech-to-text model achieves 98%+ accuracy for clear audio in English and the most common European languages. For specialized jargon, you can add a custom vocabulary list to improve accuracy further.",
  },
  {
    id: "faq-6",
    question: "Can I use VidShorts via API for my own platform?",
    answer:
      "Yes! Our REST API is available on the Agency plan. You can submit videos, poll for completion, retrieve clips, and apply brand kits programmatically. Full API docs and SDKs are available in your dashboard.",
  },
  {
    id: "faq-7",
    question: "Do you store my videos permanently?",
    answer:
      "Your videos are stored securely for 30 days by default, after which they are deleted from our servers. You can configure auto-delete rules, download everything locally, or connect your own cloud storage (S3, GCS).",
  },
  {
    id: "faq-8",
    question: "What platforms can I export to directly?",
    answer:
      "VidShorts supports one-click publishing to TikTok, Instagram Reels, YouTube Shorts, Twitter/X, LinkedIn, and Pinterest. You can also download the MP4 directly in any aspect ratio.",
  },
];

function FaqItem({ faq }: { faq: (typeof faqs)[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      id={faq.id}
      className={`border rounded-xl overflow-hidden transition-all duration-300 ${
        open
          ? "border-violet-500/40 bg-violet-600/5"
          : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5"
      }`}
    >
      <button
        className="w-full flex items-center justify-between p-5 text-left gap-4"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-foreground">
          {faq.question}
        </span>
        <ChevronDown
          className={`size-4 text-muted-foreground shrink-0 transition-transform duration-300 ${
            open ? "rotate-180 text-violet-400" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
          {faq.answer}
        </p>
      </div>
    </div>
  );
}

export function FAQ() {
  return (
    <section id="faq" className="relative py-24 md:py-32 overflow-hidden">
      <div className="relative z-10 max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-400 mb-3">
            Got questions?
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq) => (
            <FaqItem key={faq.id} faq={faq} />
          ))}
        </div>
      </div>
    </section>
  );
}
