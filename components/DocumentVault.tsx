"use client";

import { useState, useEffect, useCallback } from "react";
import {
    FileText,
    Download,
    Eye,
    Clock,
    Shield,
    X,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ExternalLink,
    Lock,
    FileImage,
    FileBadge,
    FileSpreadsheet,
    FileCheck,
    AlertCircle,
    Vault,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */
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

/* ─── Per-type visual config ─────────────────────────────────────────────── */
const TYPE_CONFIG: Record<
    string,
    {
        gradient: string;
        badge: string;
        iconBg: string;
        icon: React.ComponentType<{ className?: string }>;
        accent: string;
    }
> = {
    Resume: {
        gradient: "from-blue-500/10 via-blue-400/5 to-transparent",
        badge: "bg-blue-100 text-blue-700 border-blue-200",
        iconBg: "bg-blue-500",
        icon: FileText,
        accent: "#3b82f6",
    },
    "Mark Sheet": {
        gradient: "from-emerald-500/10 via-emerald-400/5 to-transparent",
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
        iconBg: "bg-emerald-500",
        icon: FileSpreadsheet,
        accent: "#10b981",
    },
    "ID Proof": {
        gradient: "from-amber-500/10 via-amber-400/5 to-transparent",
        badge: "bg-amber-100 text-amber-700 border-amber-200",
        iconBg: "bg-amber-500",
        icon: FileBadge,
        accent: "#f59e0b",
    },
    "Income Certificate": {
        gradient: "from-violet-500/10 via-violet-400/5 to-transparent",
        badge: "bg-violet-100 text-violet-700 border-violet-200",
        iconBg: "bg-violet-500",
        icon: FileCheck,
        accent: "#8b5cf6",
    },
    "Category Certificate": {
        gradient: "from-pink-500/10 via-pink-400/5 to-transparent",
        badge: "bg-pink-100 text-pink-700 border-pink-200",
        iconBg: "bg-pink-500",
        icon: FileCheck,
        accent: "#ec4899",
    },
    "Disability Certificate": {
        gradient: "from-rose-500/10 via-rose-400/5 to-transparent",
        badge: "bg-rose-100 text-rose-700 border-rose-200",
        iconBg: "bg-rose-500",
        icon: AlertCircle,
        accent: "#f43f5e",
    },
    Other: {
        gradient: "from-slate-500/10 via-slate-400/5 to-transparent",
        badge: "bg-slate-100 text-slate-700 border-slate-200",
        iconBg: "bg-slate-500",
        icon: FileImage,
        accent: "#64748b",
    },
};

const ALL_TYPES = [
    "All",
    "Resume",
    "Mark Sheet",
    "ID Proof",
    "Income Certificate",
    "Category Certificate",
    "Disability Certificate",
    "Other",
];

function getConfig(type: string) {
    return TYPE_CONFIG[type] ?? TYPE_CONFIG["Other"];
}

function isImage(url: string) {
    return /\.(png|jpe?g|gif|webp|svg|bmp)(\?|$)/i.test(url);
}

function isPDF(url: string) {
    return (
        url.toLowerCase().includes("/raw/upload/") ||
        url.toLowerCase().endsWith(".pdf")
    );
}

/* ─── Empty State ────────────────────────────────────────────────────────── */
function EmptyVault() {
    return (
        <div className="flex flex-col items-center justify-center py-24 px-6">
            <div className="relative mb-6">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center shadow-lg">
                    <Vault className="w-12 h-12 text-purple-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center shadow">
                    <Lock className="w-3.5 h-3.5 text-white" />
                </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
                Your vault is empty
            </h3>
            <p className="text-gray-500 text-center max-w-xs mb-6 leading-relaxed">
                Upload documents on your profile page and they&rsquo;ll be securely
                stored here.
            </p>
            <a
                href="/onboarding"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold shadow hover:shadow-md hover:opacity-90 transition-all"
            >
                <FileText className="w-4 h-4" />
                Go to Profile Page
            </a>
        </div>
    );
}

/* ─── Viewer Modal ───────────────────────────────────────────────────────── */
interface ViewerProps {
    doc: Doc;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
    hasPrev: boolean;
    hasNext: boolean;
}

function DocumentViewer({
    doc,
    onClose,
    onPrev,
    onNext,
    hasPrev,
    hasNext,
}: ViewerProps) {
    const cfg = getConfig(doc.type);
    const image = isImage(doc.fileUrl);
    const pdf = isPDF(doc.fileUrl);

    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft" && hasPrev) onPrev();
            if (e.key === "ArrowRight" && hasNext) onNext();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose, onPrev, onNext, hasPrev, hasNext]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                style={{ width: "min(92vw,1000px)", height: "min(90vh,720px)" }}
            >
                {/* Modal header */}
                <div
                    className="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
                    style={{ background: `linear-gradient(135deg,${cfg.accent}18,transparent)` }}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className={`w-8 h-8 rounded-lg ${cfg.iconBg} flex items-center justify-center shrink-0`}
                        >
                            <cfg.icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                            <p
                                className="text-sm font-semibold text-gray-900 truncate"
                                title={doc.fileName}
                            >
                                {doc.fileName}
                            </p>
                            <span
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.badge}`}
                            >
                                {doc.type}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-4">
                        <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open in new tab"
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                        <a
                            href={doc.fileUrl}
                            download={doc.fileName}
                            title="Download"
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                        </a>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Document preview area */}
                <div className="flex-1 overflow-hidden bg-gray-50 relative">
                    {image ? (
                        <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={doc.fileUrl}
                                alt={doc.fileName}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                            />
                        </div>
                    ) : pdf ? (
                        <iframe
                            src={`${doc.fileUrl}#toolbar=1`}
                            className="w-full h-full border-0"
                            title={doc.fileName}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-gray-400">
                            <FileText className="w-16 h-16" />
                            <p className="text-sm font-medium">Preview not available</p>
                            <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-sm text-blue-600 underline hover:text-blue-700"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Open in new tab
                            </a>
                        </div>
                    )}
                </div>

                {/* Navigation footer */}
                {(hasPrev || hasNext) && (
                    <div className="flex items-center justify-between px-5 py-3 border-t bg-white shrink-0">
                        <button
                            onClick={onPrev}
                            disabled={!hasPrev}
                            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!hasNext}
                            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Document Card ──────────────────────────────────────────────────────── */
function DocCard({ doc, onView }: { doc: Doc; onView: () => void }) {
    const cfg = getConfig(doc.type);
    const Icon = cfg.icon;

    const formattedDate = doc.uploadedAt
        ? new Date(doc.uploadedAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
        : null;

    const fileExt = doc.fileName.split(".").pop()?.toUpperCase() ?? "FILE";

    return (
        <div
            className={`group relative flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-gray-200 transition-all duration-300 hover:-translate-y-0.5`}
        >
            {/* Gradient top strip */}
            <div
                className={`h-1.5 w-full bg-gradient-to-r`}
                style={{ background: `linear-gradient(90deg, ${cfg.accent}, ${cfg.accent}66)` }}
            />

            {/* Card body */}
            <div className={`p-5 flex-1 bg-gradient-to-br ${cfg.gradient}`}>
                {/* Icon + badge row */}
                <div className="flex items-start justify-between mb-4">
                    <div
                        className={`w-11 h-11 rounded-xl ${cfg.iconBg} flex items-center justify-center shadow-md`}
                    >
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}
                    >
                        {doc.type}
                    </span>
                </div>

                {/* File name */}
                <p
                    className="text-sm font-semibold text-gray-800 truncate mb-1 leading-snug"
                    title={doc.fileName}
                >
                    {doc.fileName}
                </p>

                {/* Extension pill + date */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200">
                        {fileExt}
                    </span>
                    {formattedDate && (
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formattedDate}
                        </span>
                    )}
                </div>
            </div>

            {/* Actions footer */}
            <div className="flex gap-2 px-4 py-3 border-t border-gray-50 bg-white">
                <button
                    onClick={onView}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl border transition-all"
                    style={{
                        borderColor: `${cfg.accent}44`,
                        color: cfg.accent,
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = `${cfg.accent}12`;
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                >
                    <Eye className="w-3.5 h-3.5" />
                    View
                </button>

                <a
                    href={doc.fileUrl}
                    download={doc.fileName}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    <Download className="w-3.5 h-3.5" />
                    Download
                </a>
            </div>
        </div>
    );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export function DocumentVault({ documents }: DocumentVaultProps) {
    const [activeFilter, setActiveFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [viewingIndex, setViewingIndex] = useState<number | null>(null);

    const filtered = documents.filter((doc) => {
        const matchesType =
            activeFilter === "All" || doc.type === activeFilter;
        const matchesSearch =
            doc.fileName.toLowerCase().includes(search.toLowerCase()) ||
            doc.type.toLowerCase().includes(search.toLowerCase());
        return matchesType && matchesSearch;
    });

    const openViewer = useCallback((idx: number) => setViewingIndex(idx), []);
    const closeViewer = useCallback(() => setViewingIndex(null), []);
    const prevDoc = useCallback(
        () => setViewingIndex((i) => (i !== null && i > 0 ? i - 1 : i)),
        []
    );
    const nextDoc = useCallback(
        () =>
            setViewingIndex((i) =>
                i !== null && i < filtered.length - 1 ? i + 1 : i
            ),
        [filtered.length]
    );

    // Count by type for filter chips
    const countByType = (type: string) =>
        type === "All"
            ? documents.length
            : documents.filter((d) => d.type === type).length;

    if (!documents || documents.length === 0) {
        return <EmptyVault />;
    }

    return (
        <>
            {/* ── Viewer Modal ── */}
            {viewingIndex !== null && filtered[viewingIndex] && (
                <DocumentViewer
                    doc={filtered[viewingIndex]}
                    onClose={closeViewer}
                    onPrev={prevDoc}
                    onNext={nextDoc}
                    hasPrev={viewingIndex > 0}
                    hasNext={viewingIndex < filtered.length - 1}
                />
            )}

            {/* ── Vault Header ── */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
                        <Shield className="w-4.5 h-4.5 text-white w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 leading-tight">
                            Document Vault
                        </h2>
                        <p className="text-xs text-gray-500">
                            {documents.length} document{documents.length !== 1 ? "s" : ""}{" "}
                            stored securely
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Search + Filter bar ── */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search documents…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all placeholder:text-gray-400"
                    />
                </div>

                {/* Type filter chips — scrollable on mobile */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1">
                    <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                    {ALL_TYPES.filter(
                        (t) => t === "All" || documents.some((d) => d.type === t)
                    ).map((type) => {
                        const active = activeFilter === type;
                        const cfg = type === "All" ? null : getConfig(type);
                        const count = countByType(type);

                        return (
                            <button
                                key={type}
                                onClick={() => setActiveFilter(type)}
                                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${active
                                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent shadow-md"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                            >
                                {type}
                                <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active
                                            ? "bg-white/20 text-white"
                                            : "bg-gray-100 text-gray-500"
                                        }`}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Grid ── */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
                    <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No documents match your filter</p>
                    <button
                        onClick={() => { setActiveFilter("All"); setSearch(""); }}
                        className="mt-3 text-sm text-purple-600 underline hover:text-purple-700"
                    >
                        Clear filters
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filtered.map((doc, i) => (
                        <DocCard key={doc._id ?? i} doc={doc} onView={() => openViewer(i)} />
                    ))}
                </div>
            )}

            {/* ── Total count footer ── */}
            {filtered.length > 0 && (
                <p className="text-xs text-gray-400 text-right mt-4">
                    Showing {filtered.length} of {documents.length} document
                    {documents.length !== 1 ? "s" : ""}
                </p>
            )}
        </>
    );
}
