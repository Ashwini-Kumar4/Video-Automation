import { Upload, Cpu, Download } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Upload,
    title: "Upload Your Video",
    description:
      "Drag-and-drop any long-form video — YouTube links, MP4 files, podcasts, webinars, interviews, or lectures. Up to 4K supported.",
    gradient: "from-violet-600 to-purple-600",
  },
  {
    step: "02",
    icon: Cpu,
    title: "AI Analyzes & Creates Clips",
    description:
      "Our Gemini-powered engine scans every frame, detects key moments, scores virality, auto-crops to vertical, and adds captions.",
    gradient: "from-purple-600 to-cyan-500",
  },
  {
    step: "03",
    icon: Download,
    title: "Export & Go Viral",
    description:
      "Review AI-generated clips in our editor, fine-tune if needed, and export directly to TikTok, Instagram, YouTube Shorts with one click.",
    gradient: "from-cyan-500 to-teal-500",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative py-24 md:py-32 overflow-hidden"
    >
      {/* Gradient line accent */}
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"
      />
      <div
        aria-hidden
        className="absolute left-1/2 bottom-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400 mb-3">
            Simple 3-step workflow
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">
            How{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              VidShorts
            </span>{" "}
            Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            From raw footage to publishable short-form clips — in under 3
            minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line (desktop) */}
          <div
            aria-hidden
            className="hidden md:block absolute top-16 left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-violet-600/50 via-purple-500/50 to-cyan-500/50"
          />

          {steps.map((step, i) => (
            <div
              key={step.step}
              id={`how-step-${i + 1}`}
              className="relative flex flex-col items-center text-center group"
            >
              {/* Step number bubble */}
              <div className="relative mb-6">
                <div
                  className={`size-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300`}
                  style={{
                    boxShadow:
                      i === 0
                        ? "0 0 40px oklch(0.65 0.25 270 / 40%)"
                        : i === 1
                        ? "0 0 40px oklch(0.6 0.2 290 / 35%)"
                        : "0 0 40px oklch(0.72 0.22 200 / 35%)",
                  }}
                >
                  <step.icon className="size-7 text-white" />
                </div>
                <span className="absolute -top-3 -right-3 size-7 rounded-full bg-background border border-white/20 text-xs font-black text-muted-foreground flex items-center justify-center">
                  {step.step}
                </span>
              </div>

              <h3 className="text-xl font-bold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
