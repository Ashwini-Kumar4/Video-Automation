import { Star } from "lucide-react";

const testimonials = [
  {
    id: "testimonial-1",
    name: "Sarah Chen",
    handle: "@sarahcreates",
    role: "YouTube Creator — 2.1M subs",
    avatar: "SC",
    gradient: "from-violet-600 to-purple-600",
    stars: 5,
    quote:
      "VidShorts completely changed my workflow. I used to spend 4 hours creating shorts — now it takes 10 minutes. The AI picks the best moments better than I could manually.",
  },
  {
    id: "testimonial-2",
    name: "Marcus Rivera",
    handle: "@marcustechpod",
    role: "Podcast Host — 800K listeners",
    avatar: "MR",
    gradient: "from-cyan-600 to-teal-600",
    stars: 5,
    quote:
      "As a podcaster, I had no idea how to turn my audio-first content into shorts. VidShorts handles the captions, reframing, and clip selection automatically. My LinkedIn impressions went up 10x.",
  },
  {
    id: "testimonial-3",
    name: "Priya Sharma",
    handle: "@priyamarketing",
    role: "Marketing Director at ScaleUp",
    avatar: "PS",
    gradient: "from-pink-600 to-rose-600",
    stars: 5,
    quote:
      "We manage video content for 12 brands. The batch processing and brand kit features save us 30+ hours per week. The ROI was immediate. Absolute must-have for agencies.",
  },
  {
    id: "testimonial-4",
    name: "James Okafor",
    handle: "@jamescodes",
    role: "EdTech Creator — Coursera Instructor",
    avatar: "JO",
    gradient: "from-orange-600 to-amber-500",
    stars: 5,
    quote:
      "My course preview videos were getting no traction. VidShorts extracted the best teaching moments and the virality score helped me pick which clips to post. Enrollment up 40%.",
  },
  {
    id: "testimonial-5",
    name: "Emma Larsson",
    handle: "@emmasverige",
    role: "Lifestyle Creator — TikTok 5.4M",
    avatar: "EL",
    gradient: "from-green-600 to-emerald-500",
    stars: 5,
    quote:
      "The multilingual captioning is incredible. I post in Swedish, English, and Spanish and it handles all three flawlessly. My international reach has grown 300% in 2 months.",
  },
  {
    id: "testimonial-6",
    name: "David Kim",
    handle: "@davidkimvc",
    role: "Founder @ ContentOS",
    avatar: "DK",
    gradient: "from-blue-600 to-indigo-600",
    stars: 5,
    quote:
      "We integrated VidShorts via API into our content platform. The documentation is clean, the API is fast, and the support team is incredibly responsive. 5 stars, no question.",
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="relative py-24 md:py-32 overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute bottom-0 right-0 size-[500px] rounded-full bg-cyan-900/15 blur-[120px] pointer-events-none"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400 mb-3">
            Loved by creators
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">
            What Creators{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Are Saying
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Join 50,000+ creators who have already transformed their content
            strategy.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div
              key={t.id}
              id={t.id}
              className="group bg-white/4 hover:bg-white/6 backdrop-blur-sm border border-white/8 hover:border-white/15 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 flex flex-col gap-4"
            >
              {/* Stars */}
              <StarRating count={t.stars} />

              {/* Quote */}
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-white/8">
                <div
                  className={`size-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
