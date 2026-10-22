import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTA() {
  return (
    <section id="cta" className="relative py-24 md:py-32 overflow-hidden">
      {/* Radial glow behind */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="size-[700px] rounded-full bg-violet-600/15 blur-[120px]" />
      </div>
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="size-[400px] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Outer glass card */}
        <div className="bg-white/4 backdrop-blur-xl border border-white/10 rounded-3xl p-10 md:p-16 shadow-2xl shadow-violet-950/40">
          <div className="inline-flex items-center gap-2 bg-violet-600/15 border border-violet-500/30 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="size-4 text-violet-400" />
            <span className="text-sm font-semibold text-violet-300">
              No credit card required
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-foreground mb-5 leading-tight">
            Start Creating{" "}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Viral Shorts
            </span>
            <br />
            Today
          </h2>

          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Join 50,000+ creators, marketers and agencies who are growing their
            audience with AI-powered short-form content. Setup takes 2 minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              id="final-cta-primary"
              href="/sign-up"
              className="inline-flex items-center justify-center bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold px-10 rounded-full hover:scale-105 hover:shadow-xl hover:shadow-violet-600/40 transition-all duration-300 h-13 text-base"
            >
              <Sparkles className="size-4 mr-2" />
              Get Started for Free
              <ArrowRight className="size-4 ml-2" />
            </Link>
            <Button
              id="final-cta-secondary"
              variant="outline"
              size="lg"
              className="border-white/20 hover:bg-white/10 hover:border-violet-400/40 font-semibold px-10 rounded-full transition-all duration-300 h-13 text-base"
            >
              Schedule a Demo
            </Button>
          </div>

          <p className="text-xs text-muted-foreground/60 mt-6">
            Free plan includes 5 videos/month. Upgrade anytime. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
