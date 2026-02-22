"use client";

import { useState } from "react";
import { Sparkles, PenLine, ArrowRight, Loader2, Copy, Check } from "lucide-react";
import { generateSOPWithAnswers } from "@/actions/ai";

type Stage = "intro" | "form" | "result";

export default function AISection({ scholarshipId }: { scholarshipId: string }) {
  const [stage, setStage] = useState<Stage>("intro");
  const [careerGoal, setCareerGoal] = useState("");
  const [whyFunding, setWhyFunding] = useState("");
  const [challenge, setChallenge] = useState("");
  const [sop, setSop] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleFinalize() {
    if (!careerGoal.trim() || !whyFunding.trim() || !challenge.trim()) {
      setError("Please answer all three questions before finalizing.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await generateSOPWithAnswers({ scholarshipId, careerGoal, whyFunding, challenge });
      setSop(result);
      setStage("result");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(sop);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-10 border-t border-slate-200 dark:border-slate-800 pt-8">

      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Application Designer</h2>
      </div>

      {/* STAGE 1: Intro */}
      {stage === "intro" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-6">Personal Statement Architect</p>

          <div className="text-center py-4">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Tell your story with confidence.
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Struggling to find the right words? Share your vision and challenges with us, and
              we&apos;ll help you structure a compelling narrative for your application.
            </p>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setStage("form")}
              className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold px-8 py-4 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
            >
              <PenLine className="w-5 h-5" />
              Begin My Draft
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: Form */}
      {stage === "form" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
          <p className="text-lg font-bold text-slate-800 dark:text-white mb-6">
            Personal Statement Architect
          </p>

          <div className="space-y-6">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2">
                What is your core career goal?
              </label>
              <input
                value={careerGoal}
                onChange={(e) => setCareerGoal(e.target.value)}
                placeholder="e.g. To lead sustainable energy initiatives..."
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition"
                suppressHydrationWarning
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2">
                Why do you need this funding?
              </label>
              <input
                value={whyFunding}
                onChange={(e) => setWhyFunding(e.target.value)}
                placeholder="e.g. To focus on research without financial strain..."
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition"
                suppressHydrationWarning
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2">
                A recent challenge you overcame?
              </label>
              <input
                value={challenge}
                onChange={(e) => setChallenge(e.target.value)}
                placeholder="e.g. Balancing my studies with community service..."
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition"
                suppressHydrationWarning
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <button
              onClick={handleFinalize}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" />AI is crafting your SOP...</>
              ) : (
                "Finalize My Narrative"
              )}
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: Result */}
      {stage === "result" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-lg font-bold text-slate-800 dark:text-white">Your Personal Statement</p>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 border border-indigo-200 dark:border-indigo-700 hover:border-indigo-400 px-3 py-1.5 rounded-lg transition"
            >
              {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm min-h-48">
            {sop}
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={() => { setStage("form"); setSop(""); setError(""); }}
              className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold py-3 rounded-xl transition"
            >
              ← Edit Answers
            </button>
            <button
              onClick={() => { setStage("intro"); setCareerGoal(""); setWhyFunding(""); setChallenge(""); setSop(""); setError(""); }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition"
            >
              Start Fresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
