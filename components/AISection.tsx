"use client";

import { useState } from "react";
import { generateEligibilityExplanation, generateSOP } from "@/actions/ai";

interface EligibilityResult {
  verdict: string;
  confidence: number;
  cgpaStatus: boolean;
  incomeStatus: boolean;
  explanation: string;
}

export default function AISection({ scholarshipId }: { scholarshipId: string }) {
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [sop, setSop] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="mt-8 space-y-4 border-t pt-6">
      <h2 className="text-xl font-semibold">Eligibility Assessment Engine</h2>

      {/* Eligibility Button */}
      <button
        onClick={async () => {
          setLoading(true);
          const res = await generateEligibilityExplanation(scholarshipId);
          setEligibility(res);
          setLoading(false);
        }}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Check Eligibility
      </button>

      {/* Eligibility Result */}
      {eligibility && (
        <div className="bg-slate-100 p-5 rounded-lg space-y-3">
          
          {/* Verdict */}
          <div
            className={`text-lg font-bold ${
              eligibility.verdict === "Eligible"
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {eligibility.verdict}
          </div>

          {/* Confidence */}
          <div className="text-sm text-gray-500">
            Confidence: {eligibility.confidence}%
          </div>

          {/* Status Indicators */}
          <div className="space-y-1 text-sm">
            <div
              className={
                eligibility.cgpaStatus ? "text-green-600" : "text-red-600"
              }
            >
              CGPA Requirement {eligibility.cgpaStatus ? "✓ Met" : "✗ Not Met"}
            </div>

            <div
              className={
                eligibility.incomeStatus ? "text-green-600" : "text-red-600"
              }
            >
              Income Requirement{" "}
              {eligibility.incomeStatus ? "✓ Met" : "✗ Not Met"}
            </div>
          </div>

          {/* Explanation */}
          <p className="text-gray-700">{eligibility.explanation}</p>
        </div>
      )}

      {/* SOP Button */}
      <button
        onClick={async () => {
          setLoading(true);
          const res = await generateSOP(scholarshipId);
          setSop(res);
          setLoading(false);
        }}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Generate SOP
      </button>

      {/* SOP Output */}
      {sop && (
        <textarea
          value={sop}
          readOnly
          className="w-full h-48 border p-3 rounded"
        />
      )}

      {loading && (
        <p className="text-sm text-slate-500">AI is thinking...</p>
      )}
    </div>
  );
}
