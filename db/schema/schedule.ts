import { pgTable, serial, integer, time, boolean, unique } from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const DAY_OF_WEEK = {
  0: "Monday",
  1: "Tuesday",
  2: "Wednesday",
  3: "Thursday",
  4: "Friday",
  5: "Saturday",
  6: "Sunday",
} as const;

export const schedules = pgTable("schedules", {
  id:           serial("id").primaryKey(),
  dayOfWeek:    integer("day_of_week").notNull(), 
  startTime:    time("start_time").notNull(),
  endTime:      time("end_time").notNull(),
  slotDuration: integer("slot_duration").default(30).notNull(),
  isActive:     boolean("is_active").default(true).notNull(),
}, (table) => ({
  uniqueDayTime: unique().on(table.dayOfWeek, table.startTime), // unique_together
}));

export type Schedule = InferSelectModel<typeof schedules>;
export type NewSchedule = InferInsertModel<typeof schedules>;