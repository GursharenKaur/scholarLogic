"use client";

import { useState } from "react";
import { generateEligibilityExplanation, generateSOP } from "@/actions/ai";

export default function AISection({ scholarshipId }: { scholarshipId: string }) {
  const [explanation, setExplanation] = useState("");
  const [sop, setSop] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="mt-8 space-y-4 border-t pt-6">
      <h2 className="text-xl font-semibold">AI Assistant</h2>

      <button
        onClick={async () => {
          setLoading(true);
          const res = await generateEligibilityExplanation(scholarshipId);
          setExplanation(res);
          setLoading(false);
        }}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Why Am I Eligible?
      </button>

      {explanation && (
        <div className="bg-slate-100 p-4 rounded whitespace-pre-wrap">
          {explanation}
        </div>
      )}

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

      {sop && (
        <textarea
          value={sop}
          readOnly
          className="w-full h-48 border p-3 rounded"
        />
      )}

      {loading && <p className="text-sm text-slate-500">AI is thinking...</p>}
    </div>
  );
}
