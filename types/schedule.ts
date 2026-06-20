export const DAYS_OF_WEEK = [
    { value: 0, label: "Monday",    short: "Mon" },
    { value: 1, label: "Tuesday",   short: "Tue" },
    { value: 2, label: "Wednesday", short: "Wed" },
    { value: 3, label: "Thursday",  short: "Thu" },
    { value: 4, label: "Friday",    short: "Fri" },
    { value: 5, label: "Saturday",  short: "Sat" },
    { value: 6, label: "Sunday",    short: "Sun" },
] as const;

export interface Schedule {
    id?: number;
    day_of_week: number;
    start_time: string;   // "HH:MM" or "HH:MM:SS"
    end_time: string;     // "HH:MM" or "HH:MM:SS"
    slot_duration: number;
    is_active: boolean;
}

export type SchedulePayload = Omit<Schedule, "id">;
