import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Video, Sparkles, CheckCircle2, ArrowLeft } from "lucide-react";

function SignInFallback() {
  return (
    <div className="h-[480px] w-full max-w-[400px] rounded-2xl bg-white/[0.03] border border-white/10 animate-pulse flex flex-col items-center justify-center gap-3">
      <div className="size-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      <p className="text-xs text-muted-foreground">Loading sign in...</p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-background">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-violet-600/15 via-purple-600/10 to-cyan-500/15 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

      {/* Back to Home Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
      >
        <ArrowLeft className="size-4" />
        Back to VidShorts
      </Link>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-12">
        {/* Left column: Brand & Value proposition (visible on lg screens) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col gap-6 pr-6">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="size-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-transform duration-200">
              <Video className="size-5 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Vid
              </span>
              <span className="text-foreground">Shorts</span>
            </span>
          </Link>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back to your video workspace
            </h1>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              Sign in to access your projects, edit viral short clips, auto-generate captions, and export in 4K resolution.
            </p>
          </div>

          <div className="space-y-3.5 pt-2 border-t border-white/10">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
              <span>Instant AI scene & hook detection</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
              <span>Smart 9:16 vertical reframing</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
              <span>Virality score predictions & trend analysis</span>
            </div>
          </div>

          {/* Mini creator social proof card */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-sm mt-4">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="size-3.5" />
              Creator Community
            </div>
            <p className="text-xs text-muted-foreground italic">
              &ldquo;VidShorts cut my editing time from 4 hours to 3 minutes per YouTube video. My shorts now hit 500k+ views consistently!&rdquo;
            </p>
          </div>
        </div>

        {/* Right column: Clerk Sign In Form */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div className="lg:hidden flex flex-col items-center mb-6 text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-3">
              <div className="size-9 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-600/30">
                <Video className="size-4 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  Vid
                </span>
                <span className="text-foreground">Shorts</span>
              </span>
            </Link>
            <h2 className="text-xl font-bold">Sign in to your account</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Continue to your VidShorts AI dashboard
            </p>
          </div>

          <Suspense fallback={<SignInFallback />}>
            <SignIn
              routing="path"
              path="/sign-in"
              signUpUrl="/sign-up"
              fallbackRedirectUrl="/dashboard"
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
