import {
  Sparkles,
  Zap,
  MessageSquare,
  Crop,
  BarChart3,
  Globe,
  Clock,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI Scene Detection",
    description:
      "Our AI identifies the most emotionally engaging, viral-worthy moments in your video using multimodal understanding.",
    gradient: "from-violet-600 to-purple-600",
    glow: "shadow-violet-600/30",
  },
  {
    icon: MessageSquare,
    title: "Auto Captions",
    description:
      "Generate accurate, stylized captions with speaker detection and word-by-word animation automatically.",
    gradient: "from-purple-600 to-pink-600",
    glow: "shadow-purple-600/30",
  },
  {
    icon: Crop,
    title: "Smart Reframing",
    description:
      "Automatically reframe and crop your content to 9:16, 1:1 or any aspect ratio with smart speaker tracking.",
    gradient: "from-cyan-600 to-teal-600",
    glow: "shadow-cyan-600/30",
  },
  {
    icon: Zap,
    title: "Instant Processing",
    description:
      "Process a 1-hour video in under 2 minutes. Our GPU-accelerated pipeline runs at lightning speed.",
    gradient: "from-yellow-500 to-orange-500",
    glow: "shadow-orange-500/30",
  },
  {
    icon: BarChart3,
    title: "Virality Score",
    description:
      "Each clip receives a virality score based on pacing, emotional hooks, engagement triggers, and trend analysis.",
    gradient: "from-green-600 to-emerald-500",
    glow: "shadow-green-500/30",
  },
  {
    icon: Globe,
    title: "Multi-language Support",
    description:
      "Detect, transcribe and generate captions in 50+ languages. Reach a global audience with one click.",
    gradient: "from-blue-600 to-indigo-600",
    glow: "shadow-blue-600/30",
  },
  {
    icon: Clock,
    title: "Batch Processing",
    description:
      "Upload entire seasons or playlists and process hundreds of videos overnight in automated batch mode.",
    gradient: "from-rose-600 to-red-600",
    glow: "shadow-rose-600/30",
  },
  {
    icon: Shield,
    title: "Brand Kit",
    description:
      "Apply your logo, brand colors, custom fonts and intro/outro templates automatically to every clip.",
    gradient: "from-violet-600 to-cyan-500",
    glow: "shadow-violet-600/30",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background accent */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[800px] rounded-full bg-violet-900/10 blur-[150px] pointer-events-none"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-400 mb-3">
            Everything you need
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">
            Packed with{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From upload to export, VidShorts handles every step of your
            short-form content creation workflow.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              id={`feature-card-${i}`}
              className="group bg-white/4 hover:bg-white/7 backdrop-blur-sm border border-white/8 hover:border-violet-500/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon */}
              <div
                className={`size-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg ${feature.glow} group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="size-6 text-white" />
              </div>

              <h3 className="text-base font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
