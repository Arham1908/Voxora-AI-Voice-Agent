"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Appointment {
    id: number;
    google_event_id: string | null;
    meet_link: string | null;
    calendar_link: string | null;
    name: string;
    phone: string;
    email: string;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
    notes: string | null;
    created_at: string;
}

function formatTime(time: string) {
    const [hourStr, minuteStr] = time.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = minuteStr;
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${minute} ${ampm}`;
}

function formatDate(date: string) {
    const [year, month, day] = date.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

function StatusBadge({ status }: { status: string }) {
    const s = status.toLowerCase();
    let classes = "bg-amber-100 text-amber-600";
    if (s === "confirmed" || s === "completed") classes = "bg-green-100 text-green-600";
    else if (s === "cancelled" || s === "canceled") classes = "bg-red-100 text-red-600";

    return (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${classes}`}>
            {status}
        </span>
    );
}

export default function AppointmentsTable() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    const exportToCSV = () => {
        const headers = ["Name", "Phone", "Email", "Date", "Time", "Status"];
        const rows = appointments.map(a => [
            `"${(a.name || "").replace(/"/g, '""')}"`,
            a.phone || "",
            a.email || "",
            a.date || "",
            `${formatTime(a.start_time)} - ${formatTime(a.end_time)}`,
            a.status || ""
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `appointments_page_${page}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const data = await api.getAppointments({ page, pageSize });
                setAppointments(data.data ?? []);
                if (data?.pagination?.total_pages) setTotalPages(data?.pagination?.total_pages);
            } catch (err) { 
                console.error("Failed to load appointments:", err);
                setError("Failed to load appointments. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [page]);

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-sage-200 border-t-sage-500"></div>
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
        <div className="glass overflow-hidden rounded-3xl shadow-sm border border-sage-100/50">
            <div className="px-8 py-6 border-b border-sage-100 bg-white/50 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-sage-900">Appointments</h3>
                    <p className="text-sm text-sage-500 mt-1">All scheduled appointments booked via the voice agent.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={exportToCSV}
                        className="inline-flex items-center px-4 py-2 text-sm font-bold text-white bg-sage-500 rounded-xl hover:bg-sage-600 transition-colors shadow-sm cursor-pointer"
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            {appointments.length === 0 ? (
                <div className="px-8 py-16 text-center text-sage-400 font-medium">
                    No appointments found.
                </div>
            ) : (
                <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                    <table className="w-full text-left min-w-[960px]">
                        <thead className="bg-sage-50/30 text-xs font-bold uppercase tracking-wider text-sage-500 sticky top-0 z-10 backdrop-blur-sm">
                            <tr>
                                <th className="px-6 py-4 w-16 text-center">#</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Notes</th>
                                <th className="px-6 py-4 text-center">Calendar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sage-50">
                            {appointments.map((appt, index) => (
                                <tr key={appt.id} className="hover:bg-sage-50/50 transition-colors">
                                    <td className="px-6 py-4 text-center text-sm font-medium text-sage-400">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-sage-900 truncate">{appt.name}</div>
                                        <div className="text-xs text-sage-400 truncate">{appt.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-sage-600">{appt.phone}</td>
                                    <td className="px-6 py-4 text-sm text-sage-700 font-medium whitespace-nowrap">
                                        {formatDate(appt.date)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-sage-700 whitespace-nowrap">
                                        {formatTime(appt.start_time)} – {formatTime(appt.end_time)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={appt.status} />
                                    </td>
                                    <td className="px-6 py-4 text-sm text-sage-500 max-w-[180px] truncate">
                                        {appt.notes || <span className="text-sage-300">—</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {appt.calendar_link ? (
                                            <a
                                                href={appt.calendar_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-sage-700 bg-sage-100 rounded-lg hover:bg-sage-200 transition-colors whitespace-nowrap"
                                            >
                                                View
                                            </a>
                                        ) : (
                                            <span className="text-sage-300 text-sm">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="px-8 py-4 border-t border-sage-100 bg-white/50 flex items-center justify-between">
                <span className="text-sm text-sage-600 font-medium">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || isLoading}
                        className="px-4 py-2 rounded-lg bg-white border border-sage-200 text-sage-700 text-sm font-semibold hover:bg-sage-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || isLoading}
                        className="px-4 py-2 rounded-lg bg-white border border-sage-200 text-sage-700 text-sm font-semibold hover:bg-sage-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
