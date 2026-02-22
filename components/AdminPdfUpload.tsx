"use client";

import { useState } from "react";
import { uploadAndProcessPdf } from "@/actions/admin";
import { UploadCloud, Loader2, Sparkles, CheckCircle, AlertCircle } from "lucide-react";

export function AdminPdfUpload() {
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("pdf", file);

        try {
            const res = await uploadAndProcessPdf(formData);
            if (res.success) {
                setResult({ type: "success", text: `Extracted & Inserted: ${res.inserted} · Skipped/Dupes: ${res.skipped}` });
            } else {
                setResult({ type: "error", text: res.error ?? "Unknown error" });
            }
        } catch (err: any) {
            setResult({ type: "error", text: err.message });
        } finally {
            setIsUploading(false);
            // reset the input
            e.target.value = "";
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <input
                type="file"
                accept=".pdf"
                id="admin-pdf"
                className="hidden"
                onChange={handleUpload}
                disabled={isUploading}
            />
            <label
                htmlFor="admin-pdf"
                className={`cursor-pointer flex flex-col items-center justify-center py-12 px-8 border-2 border-dashed m-4 rounded-xl transition-all
                    ${isUploading
                        ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/20 cursor-not-allowed"
                        : "border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10"
                    }`}
            >
                {isUploading ? (
                    <Loader2 className="w-12 h-12 text-indigo-500 dark:text-indigo-400 animate-spin mb-4" />
                ) : (
                    <UploadCloud className="w-12 h-12 text-indigo-400 dark:text-indigo-500 mb-4" />
                )}

                <span className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2 mb-2">
                    {isUploading ? "AI Engine is reading the PDF..." : "Drop Scholarship PDF Here"}
                    {!isUploading && <Sparkles className="w-5 h-5 text-indigo-500" />}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                    {isUploading ? "Extracting and inserting scholarships..." : "Click to browse — AI will extract and insert automatically."}
                </span>
            </label>

            {/* Result message */}
            {result && (
                <div className={`mx-4 mb-4 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium
                    ${result.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                        : "bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
                    }`}
                >
                    {result.type === "success"
                        ? <CheckCircle className="w-5 h-5 shrink-0" />
                        : <AlertCircle className="w-5 h-5 shrink-0" />
                    }
                    {result.type === "success" ? `✅ ${result.text}` : `❌ ${result.text}`}
                </div>
            )}
        </div>
    );
}