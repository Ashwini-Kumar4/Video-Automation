"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap } from "lucide-react";

const plans = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Perfect to try out VidShorts",
    badge: null,
    features: [
      "5 videos/month",
      "720p export quality",
      "Auto captions (3 languages)",
      "Basic templates",
      "Watermarked exports",
      "Community support",
    ],
    cta: "Start for Free",
    ctaVariant: "outline" as const,
    highlighted: false,
  },
  {
    id: "creator",
    name: "Creator",
    monthlyPrice: 29,
    yearlyPrice: 19,
    description: "For solo creators scaling their content",
    badge: "Most Popular",
    features: [
      "60 videos/month",
      "4K export quality",
      "Auto captions (50+ languages)",
      "Smart reframing",
      "Virality scores",
      "No watermark",
      "Brand kit (1 brand)",
      "Priority processing",
      "Email support",
    ],
    cta: "Get Creator",
    ctaVariant: "default" as const,
    highlighted: true,
  },
  {
    id: "agency",
    name: "Agency",
    monthlyPrice: 99,
    yearlyPrice: 69,
    description: "For teams and content agencies",
    badge: null,
    features: [
      "Unlimited videos",
      "4K export quality",
      "Auto captions (50+ languages)",
      "Smart reframing",
      "Virality scores",
      "No watermark",
      "Brand kit (unlimited)",
      "Batch processing",
      "API access",
      "Team seats (5)",
      "Dedicated support",
      "Custom integrations",
    ],
    cta: "Get Agency",
    ctaVariant: "outline" as const,
    highlighted: false,
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="relative py-24 md:py-32 overflow-hidden">
      <div
        aria-hidden
        className="absolute top-0 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-violet-900/15 blur-[120px] pointer-events-none"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-400 mb-3">
            Simple, transparent pricing
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">
            Choose Your{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Plan
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            Start free. Upgrade when you&apos;re ready to scale.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full p-1.5">
            <button
              id="billing-monthly"
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                !annual
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              id="billing-annual"
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                annual
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs px-2 py-0">
                Save 33%
              </Badge>
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.id}
              id={`pricing-${plan.id}`}
              className={`relative rounded-2xl p-7 border transition-all duration-300 ${
                plan.highlighted
                  ? "border-violet-500/60 bg-gradient-to-b from-violet-600/10 to-violet-900/5 shadow-xl shadow-violet-600/20 scale-105"
                  : "border-white/10 bg-white/4 hover:border-white/20 hover:bg-white/6"
              }`}
              style={
                plan.highlighted
                  ? {
                      boxShadow:
                        "0 0 0 1px oklch(0.65 0.25 270 / 40%), 0 25px 50px oklch(0.65 0.25 270 / 20%)",
                    }
                  : {}
              }
            >
              {/* Popular badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white border-0 px-4 py-1 rounded-full font-semibold shadow-lg shadow-violet-600/30">
                    <Sparkles className="size-3 mr-1" />
                    {plan.badge}
                  </Badge>
                </div>
              )}

              {/* Plan name & price */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-foreground">
                    ${annual ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  {(annual ? plan.yearlyPrice : plan.monthlyPrice) > 0 && (
                    <span className="text-muted-foreground text-sm mb-1.5">
                      /mo
                    </span>
                  )}
                  {(annual ? plan.yearlyPrice : plan.monthlyPrice) === 0 && (
                    <span className="text-muted-foreground text-sm mb-1.5">
                      forever
                    </span>
                  )}
                </div>
                {annual && plan.monthlyPrice > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Billed ${plan.yearlyPrice * 12}/yr — save $
                    {(plan.monthlyPrice - plan.yearlyPrice) * 12}
                  </p>
                )}
              </div>

              {/* CTA */}
              <Button
                id={`plan-cta-${plan.id}`}
                variant={plan.ctaVariant}
                className={`w-full rounded-full font-semibold mb-6 transition-all duration-200 ${
                  plan.highlighted
                    ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white border-0 hover:scale-105 hover:shadow-lg hover:shadow-violet-600/30"
                    : "border-white/20 hover:bg-white/10"
                }`}
              >
                {plan.highlighted && <Zap className="size-4 mr-2" />}
                {plan.cta}
              </Button>

              {/* Feature list */}
              <ul className="space-y-2.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm"
                  >
                    <Check
                      className={`size-4 mt-0.5 shrink-0 ${
                        plan.highlighted ? "text-violet-400" : "text-cyan-400"
                      }`}
                    />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Enterprise callout */}
        <div className="mt-10 text-center">
          <p className="text-muted-foreground text-sm">
            Need unlimited scale?{" "}
            <a
              href="#contact"
              className="text-violet-400 hover:text-violet-300 font-semibold underline underline-offset-2 transition-colors"
            >
              Talk to us about Enterprise
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
