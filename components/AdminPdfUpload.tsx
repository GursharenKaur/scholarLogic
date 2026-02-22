"use client";

import { useState } from "react";
import { uploadAndProcessPdf } from "@/actions/admin";
import { UploadCloud, Loader2, Sparkles } from "lucide-react";

export function AdminPdfUpload() {
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState("");

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setMessage("Uploading to AI Pipeline...");

        const formData = new FormData();
        formData.append("pdf", file);

        try {
            const res = await uploadAndProcessPdf(formData);
            if (res.success) {
                setMessage(`✅ Success! Extracted & Inserted: ${res.inserted} | Skipped/Dupes: ${res.skipped}`);
            } else {
                setMessage(`❌ Error: ${res.error}`);
            }
        } catch (err: any) {
            setMessage(`❌ Error: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="border-2 border-dashed border-indigo-300 bg-indigo-50/50 rounded-xl p-8 text-center transition-all hover:bg-indigo-50">
            <input 
                type="file" 
                accept=".pdf" 
                id="admin-pdf" 
                className="hidden" 
                onChange={handleUpload} 
                disabled={isUploading} 
            />
            <label htmlFor="admin-pdf" className="cursor-pointer flex flex-col items-center justify-center">
                {isUploading ? (
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                ) : (
                    <UploadCloud className="w-12 h-12 text-indigo-500 mb-4" />
                )}
                <span className="text-indigo-900 font-bold text-xl flex items-center gap-2">
                    {isUploading ? "AI Engine is reading the PDF..." : "Drop Scholarship PDF Here"}
                    {!isUploading && <Sparkles className="w-5 h-5 text-indigo-500" />}
                </span>
                <span className="text-indigo-600 text-sm mt-2 font-medium">
                    {message || "Click to browse. The AI will extract and insert automatically."}
                </span>
            </label>
        </div>
    );
}