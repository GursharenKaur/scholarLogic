import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#050810] text-white flex flex-col overflow-hidden">

      {/* ── Background ambient glows ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-80px] left-[10%] w-[500px] h-[400px] rounded-full bg-indigo-700/8 blur-[100px]" />
        <div className="absolute top-[40%] right-[-100px] w-[400px] h-[400px] rounded-full bg-sky-500/8 blur-[80px]" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-10 flex items-center justify-between px-8 md:px-16 py-5 border-b border-white/[0.06] backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-black shadow-lg shadow-blue-500/30">
            S
          </div>
          <span className="text-lg font-bold tracking-tight">
            scholar<span className="text-blue-400">Logic</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
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
            <Link
              href="/home"
              className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
            >
              Dashboard
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-24">

        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-300 text-xs font-medium mb-8 backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-400" />
          </span>
          AI-Powered · Personalised · Free to Use
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] max-w-4xl mb-6">
          Stop Searching.<br />
          <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
            Start Winning.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed mb-10">
          ScholarLogic reads your academic profile and instantly surfaces every scholarship you actually qualify for —
          no irrelevant results, no wasted hours.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-20">
          <Link
            href="/home"
            className="group relative inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-500/30 text-sm"
          >
            Explore Scholarships
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
          <Link
            href="/home"
            className="inline-flex items-center gap-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/8 text-slate-300 hover:text-white font-medium px-6 py-3.5 rounded-xl transition-all duration-200 text-sm backdrop-blur-sm"
          >
            See How It Works
          </Link>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20">
          {[
            { value: "10,000+", label: "Scholarships Listed" },
            { value: "₹50Cr+", label: "Funding Distributed" },
            { value: "98%", label: "Match Accuracy" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-black bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-xs text-slate-500 mt-1.5 tracking-wide uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Feature strip ── */}
      <div className="relative z-10 border-t border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: "🎯",
              title: "Precision Matching",
              desc: "We check your CGPA, income, course, and category against every scholarship — you see only what you can win.",
            },
            {
              icon: "📄",
              title: "PDF Intelligence",
              desc: "Our AI reads scholarship PDFs and extracts eligibility criteria automatically — no manual data entry.",
            },
            {
              icon: "⚡",
              title: "Instant Results",
              desc: "Complete your profile once and get a personalised, ranked list of scholarships in seconds.",
            },
          ].map((feature) => (
            <div key={feature.title} className="flex flex-col gap-3">
              <span className="text-2xl">{feature.icon}</span>
              <h3 className="font-bold text-white text-sm">{feature.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="relative z-10 text-center py-5 border-t border-white/[0.05] text-xs text-slate-700">
        © 2026 ScholarLogic · Built for students, powered by AI.
      </footer>

    </main>
  );
}