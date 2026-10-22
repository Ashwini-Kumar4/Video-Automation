"use client";

import { useState } from "react";
import {
  Sparkles,
  Check,
  Zap,
  Shield,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  const plans = [
    {
      name: "Starter",
      badge: "Current Plan",
      price: billingCycle === "yearly" ? 0 : 0,
      period: "forever free",
      description: "Perfect for testing the AI video engine and generating sample shorts.",
      credits: "50 AI Credits / month",
      popular: false,
      features: [
        "Up to 10 short clips per video",
        "720p HD MP4 export",
        "Standard Hormozi captions",
        "Manual video downloads",
        "Community support",
      ],
      buttonText: "Current Plan",
      buttonVariant: "outline" as const,
      buttonDisabled: true,
    },
    {
      name: "Pro Creator",
      badge: "Most Popular",
      price: billingCycle === "yearly" ? 19 : 24,
      period: "per month, billed annually",
      description: "For active content creators wanting high-virality clips, auto-scheduling & full HD.",
      credits: "300 AI Credits / month",
      popular: true,
      features: [
        "Unlimited length long videos",
        "1080p 60fps Ultra HD export",
        "All Viral Caption Styles (Hormozi, MrBeast, Minimalist)",
        "Auto B-roll & Sound Effects insertion",
        "Direct TikTok, YouTube & Reels Scheduler",
        "AI Hook Detection & Virality Scoring (90%+)",
        "Watermark-free downloads",
      ],
      buttonText: "Upgrade to Pro",
      buttonVariant: "default" as const,
      buttonDisabled: false,
    },
    {
      name: "Agency & Studio",
      badge: "Maximum Power",
      price: billingCycle === "yearly" ? 49 : 59,
      period: "per month, billed annually",
      description: "For agencies, podcast networks, and media brands scaling multiple client channels.",
      credits: "Unlimited AI Credits",
      popular: false,
      features: [
        "Unlimited clips & video conversions",
        "4K Cinematic rendering",
        "Custom brand kits & typography fonts",
        "Team workspace & 5 seats",
        "Priority GPU queue (sub-60s renders)",
        "Dedicated account manager & API access",
        "Automated multi-brand scheduling",
      ],
      buttonText: "Get Studio Agency",
      buttonVariant: "outline" as const,
      buttonDisabled: false,
    },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">
          <Sparkles className="size-3.5 text-cyan-400" />
          <span>Simple, Transparent Pricing</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Turn Every Long Video Into{" "}
          <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Millions of Views
          </span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Upgrade your plan anytime to unlock unlimited exports, ultra-HD 1080p rendering, and multi-platform auto-posting.
        </p>

        {/* Monthly / Yearly Toggle */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <span
            className={cn(
              "text-xs font-semibold transition-colors cursor-pointer",
              billingCycle === "monthly" ? "text-white" : "text-muted-foreground"
            )}
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly
          </span>
          <button
            onClick={() =>
              setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")
            }
            className="w-12 h-6 rounded-full bg-white/10 p-1 relative transition-colors focus:outline-none"
            aria-label="Toggle billing cycle"
          >
            <div
              className={cn(
                "size-4 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 shadow transition-transform",
                billingCycle === "yearly" ? "translate-x-6" : "translate-x-0"
              )}
            />
          </button>
          <span
            className={cn(
              "text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5",
              billingCycle === "yearly" ? "text-white" : "text-muted-foreground"
            )}
            onClick={() => setBillingCycle("yearly")}
          >
            Yearly
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Save 20%
            </span>
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "relative rounded-2xl flex flex-col justify-between p-6 sm:p-8 transition-all duration-300",
              plan.popular
                ? "bg-gradient-to-b from-violet-950/40 via-[#0c1222] to-[#0a0e1a] border-2 border-violet-500/60 shadow-2xl shadow-violet-600/20 md:-translate-y-2"
                : "bg-[#0c1222] border border-white/10 hover:border-white/20"
            )}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-xs font-black tracking-wide uppercase shadow-lg shadow-violet-600/30">
                {plan.badge}
              </div>
            )}

            <div>
              {/* Plan Title */}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                {!plan.popular && (
                  <span className="text-[11px] font-semibold text-muted-foreground px-2 py-0.5 rounded bg-white/5">
                    {plan.badge}
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">
                  ${plan.price}
                </span>
                <span className="text-xs text-muted-foreground">
                  {plan.price === 0 ? "forever" : "/mo"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {plan.period}
              </p>

              {/* Description & Credits */}
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                {plan.description}
              </p>

              <div className="my-5 p-3 rounded-xl bg-white/[0.04] border border-white/5 flex items-center gap-2">
                <Zap className="size-4 text-cyan-400 shrink-0" />
                <span className="text-xs font-semibold text-white">
                  {plan.credits}
                </span>
              </div>

              {/* Features List */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  What&apos;s Included:
                </p>
                <ul className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-xs text-gray-300"
                    >
                      <Check className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-8 pt-4 border-t border-white/5">
              <Button
                variant={plan.buttonVariant}
                disabled={plan.buttonDisabled}
                onClick={() => {
                  if (!plan.buttonDisabled) {
                    alert(`Selected ${plan.name} plan! Checkout checkout flow initializing.`);
                  }
                }}
                className={cn(
                  "w-full h-11 text-sm font-semibold rounded-xl transition-all",
                  plan.popular
                    ? "bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white shadow-lg shadow-violet-600/30"
                    : "border-white/15 hover:bg-white/10 text-white"
                )}
              >
                {plan.buttonText}
                {plan.popular && <ArrowRight className="size-4 ml-1.5" />}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Guarantee & Trust Badges */}
      <div className="p-6 rounded-2xl bg-[#0c1222] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 shrink-0">
            <Shield className="size-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              14-Day Money Back Guarantee
            </h4>
            <p className="text-xs text-muted-foreground">
              Cancel anytime with 1-click. No hidden fees or lock-in contracts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold">
          <CreditCard className="size-4" />
          <span>Encrypted Stripe & PayPal Billing</span>
        </div>
      </div>
    </div>
  );
}
