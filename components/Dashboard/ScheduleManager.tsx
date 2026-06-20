"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { DAYS_OF_WEEK, Schedule, SchedulePayload } from "@/types/schedule";

// ── Default row for a day that has no saved schedule ─────────────────────────
const defaultRow = (day_of_week: number): Schedule => ({
    day_of_week,
    start_time: "09:00",
    end_time: "17:00",
    slot_duration: 30,
    is_active: false,
});

// ── Slot duration presets ─────────────────────────────────────────────────────
const SLOT_OPTIONS = [15, 20, 30, 45, 60, 90, 120];

// ── Status badge helper ───────────────────────────────────────────────────────
type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function ScheduleManager() {
    const [rows, setRows] = useState<Schedule[]>(
        DAYS_OF_WEEK.map((d) => defaultRow(d.value))
    );
    const [saveStatus, setSaveStatus] = useState<Record<number, SaveStatus>>({});
    const [globalSaving, setGlobalSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // ── Load ──────────────────────────────────────────────────────────────────
    const loadSchedules = useCallback(async () => {
        setLoading(true);
        try {
            const raw = await api.getSchedules();
            console.log(raw)
            // DRF may return { results: [...] } (paginated) or a plain array
            const data: Schedule[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
            setRows((prev) =>
                prev.map((row) => {
                    const saved = data.find((s) => s.day_of_week === row.day_of_week);
                    return saved ? { ...saved } : row;
                })
            );
        } catch {
            // keep default rows silently
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSchedules();
    }, [loadSchedules]);

    const handleChange = (day: number, field: keyof Schedule, value: string | number | boolean) => {
        setRows((prev) =>
            prev.map((r) => (r.day_of_week === day ? { ...r, [field]: value } : r))
        );
        setSaveStatus((s) => ({ ...s, [day]: "idle" }));
    };

    // ── Save single day ───────────────────────────────────────────────────────
    const saveRow = async (row: Schedule) => {
        setSaveStatus((s) => ({ ...s, [row.day_of_week]: "saving" }));
        const payload: SchedulePayload = {

            day_of_week: row.day_of_week,
            start_time: row.start_time,
            end_time: row.end_time,
            slot_duration: row.slot_duration,
            is_active: row.is_active,
        };
        try {

            
            if (row.id) {
                const updated = await api.updateSchedule(row.id, payload);
                setRows((prev) =>
                    prev.map((r) =>
                        r.day_of_week === row.day_of_week
                            ? { ...row, ...(updated && typeof updated === "object" ? updated : {}) }
                            : r
                    )
                );
            } else {
                const created = await api.createSchedule(payload);
                setRows((prev) =>
                    prev.map((r) =>
                        r.day_of_week === row.day_of_week
                            ? { ...row, ...(created && typeof created === "object" ? created : {}) }
                            : r
                    )
                );
            }
            setSaveStatus((s) => ({ ...s, [row.day_of_week]: "saved" }));
            setTimeout(() => setSaveStatus((s) => ({ ...s, [row.day_of_week]: "idle" })), 2000);
        } catch {
            setSaveStatus((s) => ({ ...s, [row.day_of_week]: "error" }));
        }
    };

    // ── Save all ──────────────────────────────────────────────────────────────
    const saveAll = async () => {
        setGlobalSaving(true);
        await Promise.all(rows.map(saveRow));
        setGlobalSaving(false);
    };

    // ── Computed slot count for a row ─────────────────────────────────────────
    const slotCount = (row: Schedule) => {
        if (!row.is_active) return 0;
        const [sh, sm] = row.start_time.split(":").map(Number);
        const [eh, em] = row.end_time.split(":").map(Number);
        const totalMin = (eh * 60 + em) - (sh * 60 + sm);
        return totalMin > 0 ? Math.floor(totalMin / row.slot_duration) : 0;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3">
                    <span className="h-10 w-10 animate-spin rounded-full border-4 border-sage-200 border-t-sage-500" />
                    <p className="text-sm text-sage-500 font-medium">Loading schedule…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-sage-900">Weekly Appointment Schedule</h2>
                    <p className="text-sm text-sage-500 mt-0.5">Set availability hours and slot durations for each day.</p>
                </div>
                <button
                    onClick={saveAll}
                    disabled={globalSaving}
                    className="mt-3 cursor-pointer sm:mt-0 inline-flex items-center gap-2 rounded-xl sage-gradient px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90 active:scale-95 transition-all duration-200 disabled:opacity-60"
                >
                    {globalSaving ? (
                        <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Saving All…
                        </>
                    ) : (
                        <>
                            <SaveIcon />
                            Save All Days
                        </>
                    )}
                </button>
            </div>

            {/* ── Summary strip ────────────────────────────────────────────── */}
            <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day) => {
                    const row = rows.find((r) => r.day_of_week === day.value)!;
                    return (
                        <div
                            key={day.value}
                            className={`flex flex-col items-center rounded-2xl py-3 px-1 transition-all duration-200 ${
                                row.is_active
                                    ? "bg-sage-500 text-white shadow-sm"
                                    : "bg-sage-100/60 text-sage-400"
                            }`}
                        >
                            <span className="text-[11px] font-bold uppercase tracking-wide">{day.short}</span>
                            <span className={`mt-1 text-[10px] font-semibold ${row.is_active ? "text-white/80" : "text-sage-300"}`}>
                                {row.is_active ? `${slotCount(row)} slots` : "Off"}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* ── Day cards ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {DAYS_OF_WEEK.map((day) => {
                    const row = rows.find((r) => r.day_of_week === day.value)!;
                    const status = saveStatus[day.value] ?? "idle";
                    const isWeekend = day.value >= 5;

                    return (
                        <div
                            key={day.value}
                            className={`glass rounded-3xl p-5 shadow-sm flex flex-col gap-4 transition-all duration-300 ${
                                row.is_active
                                    ? "ring-2 ring-sage-300/60"
                                    : "opacity-70 hover:opacity-90"
                            }`}
                        >
                            {/* ── Day header ─────────────────────────────── */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ${
                                            row.is_active
                                                ? "sage-gradient text-white shadow-sm"
                                                : "bg-sage-100 text-sage-400"
                                        }`}
                                    >
                                        {day.short}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-sage-900">{day.label}</p>
                                        {isWeekend && (
                                            <p className="text-[10px] text-sage-400 font-medium">Weekend</p>
                                        )}
                                    </div>
                                </div>

                                {/* ── Active toggle ──────────────────────── */}
                                <button
                                    onClick={() => handleChange(day.value, "is_active", !row.is_active)}
                                    className={`relative cursor-pointer inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                                        row.is_active ? "bg-sage-500" : "bg-sage-200"
                                    }`}
                                    title={row.is_active ? "Deactivate" : "Activate"}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                                            row.is_active ? "translate-x-6" : "translate-x-1"
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* ── Time fields ────────────────────────────── */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[11px] font-semibold text-sage-500 uppercase tracking-wide">
                                        Start Time
                                    </label>
                                    <input
                                        type="time"
                                        value={row.start_time.slice(0, 5)}
                                        disabled={!row.is_active}
                                        onChange={(e) => handleChange(day.value, "start_time", e.target.value)}
                                        className="w-full rounded-xl bg-white/50 px-3 py-2 text-sm text-sage-900 outline-none ring-1 ring-sage-100 transition-all focus:ring-2 focus:ring-sage-300 disabled:opacity-40 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[11px] font-semibold text-sage-500 uppercase tracking-wide">
                                        End Time
                                    </label>
                                    <input
                                        type="time"
                                        value={row.end_time.slice(0, 5)}
                                        disabled={!row.is_active}
                                        onChange={(e) => handleChange(day.value, "end_time", e.target.value)}
                                        className="w-full rounded-xl bg-white/50 px-3 py-2 text-sm text-sage-900 outline-none ring-1 ring-sage-100 transition-all focus:ring-2 focus:ring-sage-300 disabled:opacity-40 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* ── Slot duration ──────────────────────────── */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-semibold text-sage-500 uppercase tracking-wide">
                                    Slot Duration
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {SLOT_OPTIONS.map((mins) => (
                                        <button
                                            key={mins}
                                            disabled={!row.is_active}
                                            onClick={() => handleChange(day.value, "slot_duration", mins)}
                                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                                                row.slot_duration === mins
                                                    ? "sage-gradient text-white shadow-sm"
                                                    : "bg-sage-100/80 text-sage-600 hover:bg-sage-200"
                                            }`}
                                        >
                                            {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── Slot preview ───────────────────────────── */}
                            {row.is_active && slotCount(row) > 0 && (
                                <div className="flex items-center gap-2 rounded-xl bg-sage-50 px-3 py-2">
                                    <CalendarIcon />
                                    <p className="text-xs text-sage-700 font-medium">
                                        <span className="font-bold text-sage-800">{slotCount(row)}</span> appointment
                                        {slotCount(row) !== 1 ? "s" : ""} available
                                    </p>
                                </div>
                            )}

                            {/* ── Save button & status ────────────────────── */}
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-sage-100">
                                <StatusBadge status={status} />
                                <button
                                    onClick={() => saveRow(row)}
                                    disabled={status === "saving"}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-sage-500 px-4 py-2 text-xs font-bold text-white hover:bg-sage-600 active:scale-95 transition-all duration-150 disabled:opacity-60"
                                >
                                    {status === "saving" ? (
                                        <>
                                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            Saving
                                        </>
                                    ) : (
                                        <>
                                            <SaveIcon size={12} />
                                            Save
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SaveStatus }) {
    if (status === "idle") return null;
    const map: Record<SaveStatus, { text: string; cls: string }> = {
        idle:   { text: "",         cls: "" },
        saving: { text: "Saving…",  cls: "text-sage-500" },
        saved:  { text: "✓ Saved",  cls: "text-emerald-600" },
        error:  { text: "✗ Failed", cls: "text-red-500" },
    };
    const { text, cls } = map[status];
    return <span className={`text-xs font-semibold ${cls}`}>{text}</span>;
}

function SaveIcon({ size = 14 }: { size?: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="text-sage-500 shrink-0"
        >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}
