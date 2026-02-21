"use client";

import { FileText, Download, Eye, Clock } from "lucide-react";

type Doc = {
    _id?: string;
    type: string;
    fileName: string;
    fileUrl: string;
    publicId?: string;
    uploadedAt?: string;
};

interface DocumentVaultProps {
    documents: Doc[];
}

const typeColors: Record<string, string> = {
    "Resume": "bg-blue-100 text-blue-700",
    "Mark Sheet": "bg-green-100 text-green-700",
    "ID Proof": "bg-orange-100 text-orange-700",
    "Income Certificate": "bg-purple-100 text-purple-700",
    "Category Certificate": "bg-pink-100 text-pink-700",
    "Disability Certificate": "bg-red-100 text-red-700",
    "Other": "bg-gray-100 text-gray-700",
};

function isPDF(url: string) {
    return url.toLowerCase().includes("/raw/upload/") || url.toLowerCase().endsWith(".pdf");
}

export function DocumentVault({ documents }: DocumentVaultProps) {
    if (!documents || documents.length === 0) {
        return (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No documents uploaded yet.</p>
                <p className="text-sm text-gray-400 mt-1">
                    Upload documents on the{" "}
                    <a href="/onboarding" className="text-blue-500 underline">profile page</a>.
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc, i) => {
                const badge = typeColors[doc.type] ?? typeColors["Other"];
                const pdf = isPDF(doc.fileUrl);

                return (
                    <div
                        key={doc._id ?? i}
                        className="group flex flex-col justify-between border rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all bg-white"
                    >
                        {/* Top row — icon + type badge */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-gray-50 rounded-lg border">
                                    <FileText className="w-5 h-5 text-gray-500" />
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge}`}>
                                    {doc.type}
                                </span>
                            </div>
                        </div>

                        {/* File name */}
                        <p className="text-sm text-gray-700 font-medium truncate mb-1" title={doc.fileName}>
                            {doc.fileName}
                        </p>

                        {/* Upload date */}
                        {doc.uploadedAt && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mb-4">
                                <Clock className="w-3 h-3" />
                                {new Date(doc.uploadedAt).toLocaleDateString("en-IN", {
                                    day: "2-digit", month: "short", year: "numeric",
                                })}
                            </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 mt-auto">
                            {/* Preview — opens in new tab */}
                            <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1.5 text-sm py-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                                <Eye className="w-4 h-4" />
                                Preview
                            </a>

                            {/* Download — forces download via the download attribute */}
                            <a
                                href={doc.fileUrl}
                                download={doc.fileName}
                                className="flex-1 flex items-center justify-center gap-1.5 text-sm py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </a>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
