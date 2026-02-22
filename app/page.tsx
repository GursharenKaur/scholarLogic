import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnimatedBackground } from "@/components/AnimatedBackground";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#050810] text-white flex flex-col overflow-hidden">

      {/* ── Navbar ── */}
      <nav className="relative z-30 flex items-center justify-between px-8 md:px-16 py-5 border-b border-white/[0.06] backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-black shadow-lg shadow-blue-500/30">
            S
          </div>
          <span className="text-lg font-bold tracking-tight">
            scholar<span className="text-blue-400">Logic</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle className="border-white/10 bg-white/5 text-white hover:bg-white/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10" />
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
                Sign In
              </button>
            </SignInButton>
            <SignInButton mode="modal">
              <button className="text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/25">
                Get Started
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/home" className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
              Dashboard
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </nav>


      {/* ── Flying graduation hat (fixed, full-screen diagonal) ── */}
      <div
        className="pointer-events-none fixed z-20 select-none"
        style={{
          bottom: "-80px",
          left: "-80px",
          fontSize: "clamp(5rem, 10vw, 8rem)",
          animation: "hatFly 5s cubic-bezier(0.4,0,0.6,1) infinite",
          filter: "drop-shadow(0 0 20px rgba(99,102,241,0.9))",
        }}
      >
        🎓
      </div>

      {/* ── Hero ── */}
      <div className="relative z-10 flex-1 flex items-center">


        {/* Animated canvas background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Static ambient glows underneath */}
          <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full bg-blue-600/8 blur-[140px]" />
          <div className="absolute bottom-0 left-[5%] w-[500px] h-[350px] rounded-full bg-indigo-700/6 blur-[120px]" />
          <AnimatedBackground />
        </div>

        {/* Hero content — centered */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-8 md:px-16 py-12 md:py-20 flex flex-col items-center text-center">


          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-300 text-xs font-medium mb-8 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-400" />
            </span>
            AI-Powered · Personalised · Free
          </div>


          {/* Hat keyframes - diagonal flight */}
          <style>{`
            @keyframes hatFly {
              0%   { transform: translate(-120px, 120px) rotate(-20deg) scale(1);   opacity: 0; }
              8%   { opacity: 1; }
              92%  { opacity: 1; }
              100% { transform: translate(110vw, -110vh) rotate(25deg) scale(1.2); opacity: 0; }
            }
          `}</style>

          {/* Big headline */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] mb-8">
            Stop Searching.<br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Start Winning.
            </span>
          </h1>

          <p className="text-slate-400 text-lg max-w-xl leading-relaxed mb-10">
            ScholarLogic reads your profile and instantly surfaces every scholarship you actually qualify for — no irrelevant results, no wasted hours.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/home"
              className="group inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-500/30 text-sm"
            >
              Explore Scholarships
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
            <Link
              href="/home"
              className="inline-flex items-center gap-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/8 text-slate-300 hover:text-white font-medium px-6 py-4 rounded-xl transition-all duration-200 text-sm backdrop-blur-sm"
            >
              See How It Works
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-12 mt-14">
            {[
              { value: "10,000+", label: "Scholarships" },
              { value: "₹50Cr+", label: "Funding" },
              { value: "98%", label: "Accuracy" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-black bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">{s.value}</div>
                <div className="text-xs text-slate-500 mt-1 tracking-wide uppercase">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Feature strip ── */}
      <div className="relative z-10 border-t border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: "🎯", title: "Precision Matching", desc: "CGPA, income, course, category — we check everything so you only see what you can win." },
            { icon: "📄", title: "PDF Intelligence", desc: "AI reads scholarship PDFs and extracts eligibility automatically. No manual entry." },
            { icon: "⚡", title: "Instant Results", desc: "Complete your profile once and get a personalised, ranked scholarship list in seconds." },
          ].map((f) => (
            <div key={f.title} className="flex flex-col gap-3">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="font-bold text-white text-sm">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="relative z-10 text-center py-5 border-t border-white/[0.05] text-xs text-slate-700">
        © 2026 ScholarLogic · Built for students, powered by AI.
      </footer>
    </main>
  );
}