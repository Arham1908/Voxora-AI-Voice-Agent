"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Call {
    id: number;
    conversation_id: string; // fallback for session_id
    session_id?: string;
    call_type?: string;     // for ElevenLabs
    agent_type?: string;    // for Gemini
    status?: string;        // for ElevenLabs
    transcript: any;        // string for ElevenLabs, array for Gemini
    duration_seconds: number | null;
    metadata?: Record<string, unknown>;
    created_at: string;
    provider: "elevenlabs" | "gemini";
    cost_data?: {
        estimated_cost_usd: number;
        total_tokens?: number;
    } | null;
}

interface CallDetail extends Call { }

function formatDuration(seconds: number | null) {
    if (seconds == null) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
}

function formatDateTime(iso: string) {
    const d = new Date(iso);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const date = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    const hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${date}, ${displayHour}:${mins} ${ampm}`;
}

function StatusBadge({ status, provider }: { status?: string, provider: string }) {
    if (provider === "gemini") {
        return (
            <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                Processed
            </span>
        );
    }
    const s = (status || "unknown").toLowerCase();
    let classes = "bg-amber-100 text-amber-600";
    if (s === "completed" || s === "done") classes = "bg-green-100 text-green-600";
    else if (s === "failed" || s === "error") classes = "bg-red-100 text-red-600";
    else if (s === "active" || s === "in_progress" || s === "ongoing") classes = "bg-sage-100 text-sage-600";
    return (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${classes}`}>
            {s.replace(/_/g, " ")}
        </span>
    );
}

function ProviderBadge({ provider }: { provider: string }) {
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${provider === "gemini" ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"
            }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${provider === "gemini" ? "bg-purple-500" : "bg-indigo-500"}`} />
            {provider}
        </span>
    );
}

function TranscriptModal({ call, onClose }: { call: CallDetail; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="glass relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-sage-100 bg-white/60 flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-sage-900">Call Transcript</h2>
                            <ProviderBadge provider={call.provider} />
                        </div>
                        <p className="text-xs text-sage-400 mt-0.5 font-mono break-all">{call.conversation_id || call.session_id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-sage-400 hover:text-sage-700 transition-colors mt-1 flex-shrink-0"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Meta row */}
                <div className="px-8 py-4 bg-white/40 border-b border-sage-50 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase font-bold text-sage-400">Agent Type</span>
                        <span className="capitalize text-sage-800 font-semibold">{call.agent_type || call.call_type || "General"}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase font-bold text-sage-400">Duration</span>
                        <span className="text-sage-800 font-semibold">{formatDuration(call.duration_seconds)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase font-bold text-sage-400">Date</span>
                        <span className="text-sage-800 font-semibold">{formatDateTime(call.created_at)}</span>
                    </div>
                    {call.cost_data && (
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] uppercase font-bold text-sage-400">Est. Cost</span>
                            <span className="text-purple-600 font-bold">${Number(call.cost_data.estimated_cost_usd).toFixed(4)}</span>
                        </div>
                    )}
                </div>

                {/* Transcript */}
                <div className="px-8 py-6 max-h-[420px] overflow-y-auto bg-sage-50/20">
                    {!call.transcript || (Array.isArray(call.transcript) && call.transcript.length === 0) ? (
                        <p className="text-sage-400 text-sm italic text-center py-8">No transcript available for this call.</p>
                    ) : Array.isArray(call.transcript) ? (
                        <div className="flex flex-col gap-4">
                            {call.transcript.map((turn, i) => (
                                <div key={i} className={`flex flex-col ${turn.role === "user" ? "items-end" : "items-start"}`}>
                                    <span className="text-[10px] font-bold text-sage-400 uppercase mb-1 px-1">
                                        {turn.role === "user" ? "Customer" : "AI Agent"}
                                    </span>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${turn.role === "user"
                                        ? "bg-sage-600 text-white rounded-tr-none"
                                        : "bg-white text-sage-800 border border-sage-100 rounded-tl-none"
                                        }`}>
                                        {turn.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <pre className="whitespace-pre-wrap text-sm text-sage-700 font-sans leading-relaxed">
                            {call.transcript}
                        </pre>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function CallsTable() {
    const [calls, setCalls] = useState<Call[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCall, setSelectedCall] = useState<CallDetail | null>(null);
    const [loadingId, setLoadingId] = useState<number | string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    const exportToCSV = () => {
        const headers = ["Source", "Conversation ID", "Agent", "Duration", "Date & Time", "Est. Cost"];
        const rows = calls.map(c => [
            c.provider,
            c.conversation_id || c.session_id || "",
            c.agent_type || c.call_type || "",
            formatDuration(c.duration_seconds),
            `"${formatDateTime(c.created_at)}"`,
            c.cost_data?.estimated_cost_usd || ""
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `calls_page_${page}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                // Fetch from both providers concurrently
                const [elResponse, geminiResponse] = await Promise.allSettled([
                    api.getCalls({ page, pageSize }),
                    api.getGeminiHistory(undefined, { page, pageSize })
                ]);

                let unifiedCalls: Call[] = [];
                let maxPages = 1;

                if (elResponse.status === "fulfilled") {
                    const elData = elResponse.value;
                    if (elData.total_pages) maxPages = Math.max(maxPages, elData.total_pages);
                    const elList = Array.isArray(elData) ? elData : (elData.data ?? elData.results ?? []);
                    unifiedCalls = [...unifiedCalls, ...elList.map((c: any) => ({ ...c, provider: "elevenlabs" }))];
                }

                if (geminiResponse.status === "fulfilled") {
                    const geminiData = geminiResponse.value;
                    if (geminiData.total_pages) maxPages = Math.max(maxPages, geminiData.total_pages);
                    const geminiList = Array.isArray(geminiData) ? geminiData : (geminiData.data ?? geminiData.results ?? []);
                    unifiedCalls = [...unifiedCalls, ...geminiList.map((c: any) => ({
                        ...c,
                        conversation_id: c.session_id, // normalize key
                        provider: "gemini"
                    }))];
                }

                // Sort by date descending
                unifiedCalls.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                setCalls(unifiedCalls);
                setTotalPages(maxPages);
            } catch (err) {
                console.error("Failed to load calls:", err);
                setError("Failed to load calls. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [page]);

    const handleViewTranscript = async (call: Call) => {
        if (call.provider === "gemini") {
            setSelectedCall(call);
            return;
        }

        setLoadingId(call.id);
        try {
            const detail = await api.getCallStatus(call.conversation_id);
            setSelectedCall({ ...(detail?.data ?? detail), provider: "elevenlabs" });
        } catch {
            setSelectedCall(call);
        } finally {
            setLoadingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-sage-100 border-t-sage-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass overflow-hidden rounded-3xl shadow-sm border border-sage-100/50 px-8 py-12 text-center">
                <p className="text-sage-500 font-medium">{error}</p>
            </div>
        );
    }

    return (
        <>
            <div className="glass overflow-hidden rounded-3xl shadow-sm border border-sage-100/50">
                <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-sage-100 bg-white/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h3 className="text-lg sm:text-xl font-bold text-sage-900">Call Insights</h3>
                        <p className="text-xs sm:text-sm text-sage-500 mt-0.5">Cross-platform voice agent logs and cost analysis.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={exportToCSV}
                            className="inline-flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white bg-sage-500 rounded-xl hover:bg-sage-600 transition-colors shadow-sm cursor-pointer"
                        >
                            Export CSV
                        </button>
                    </div>
                </div>

                {calls.length === 0 ? (
                    <div className="px-8 py-16 text-center text-sage-400 font-medium">
                        No call records found.
                    </div>
                ) : (
                    <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                        <table className="w-full text-left min-w-[900px]">
                            <thead className="bg-sage-50/50 text-[10px] font-bold uppercase tracking-widest text-sage-400 sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-5 w-16 text-center">#</th>
                                    <th className="px-6 py-5">Source</th>
                                    <th className="px-6 py-5">Conversation ID</th>
                                    <th className="px-6 py-5">Agent</th>
                                    <th className="px-6 py-5">Duration</th>
                                    <th className="px-6 py-5">Date & Time</th>
                                    <th className="px-6 py-5">Est. Cost</th>
                                    <th className="px-6 py-5 text-center">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sage-50">
                                {calls.map((call, index) => (
                                    <tr key={`${call.provider}-${call.id}`} className="hover:bg-sage-50/50 transition-colors group">
                                        <td className="px-6 py-5 text-center text-xs font-bold text-sage-300">
                                            {(index + 1).toString().padStart(2, '0')}
                                        </td>
                                        <td className="px-6 py-5">
                                            <ProviderBadge provider={call.provider} />
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="font-mono text-[11px] text-sage-400 truncate max-w-[140px] block group-hover:text-sage-600 transition-colors">
                                                {call.conversation_id || call.session_id || "—"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-sm capitalize text-sage-700 font-bold">
                                            {call.agent_type || call.call_type || "—"}
                                        </td>
                                        <td className="px-6 py-5 text-sm text-sage-600 font-semibold whitespace-nowrap">
                                            {formatDuration(call.duration_seconds)}
                                        </td>
                                        <td className="px-6 py-5 text-xs text-sage-500 font-medium whitespace-nowrap">
                                            {formatDateTime(call.created_at)}
                                        </td>
                                        <td className="px-6 py-5">
                                            {call?.cost_data ? (
                                                <span className="text-sm font-bold text-purple-600">
                                                    ${Number(call?.cost_data?.estimated_cost_usd).toFixed(4)}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-sage-300 italic">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <button
                                                onClick={() => handleViewTranscript(call)}
                                                disabled={loadingId === call.id}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-tight text-sage-700 bg-sage-50 border border-sage-100 rounded-xl hover:bg-white hover:shadow-md hover:border-sage-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                                            >
                                                {loadingId === call.id ? (
                                                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-sage-300 border-t-sage-600 inline-block" />
                                                ) : "Logs"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="px-4 sm:px-8 py-3 sm:py-4 border-t border-sage-100 bg-white/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm text-sage-600 font-medium">Page {page} of {totalPages}</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || isLoading}
                            className="px-3 sm:px-4 py-2 rounded-lg bg-white border border-sage-200 text-sage-700 text-xs sm:text-sm font-semibold hover:bg-sage-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || isLoading}
                            className="px-3 sm:px-4 py-2 rounded-lg bg-white border border-sage-200 text-sage-700 text-xs sm:text-sm font-semibold hover:bg-sage-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {selectedCall && (
                <TranscriptModal call={selectedCall} onClose={() => setSelectedCall(null)} />
            )}
        </>
    );
}
