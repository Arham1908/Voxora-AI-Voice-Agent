import { pgTable, serial, integer, varchar,time,text, date, unique, timestamp ,pgEnum} from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";


export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
]);

export const appointments = pgTable("appointments", {
id:           serial("id").primaryKey(),
name:    varchar("name",{length:100}).notNull(), 
phone:    varchar("phone",{length:20}).notNull(), 
email:    varchar("email",{length:100}).notNull(), 
date: date("date").notNull(),
startTime:    time("start_time").notNull(),
endTime:      time("end_time").notNull(),
notes: text("notes"),
createdAt: timestamp("created_at").defaultNow().notNull(),
status: appointmentStatusEnum("status").default("pending").notNull()
}, (table) => ({
  uniqueDayTime: unique().on(table.date, table.startTime), // unique_together
}));

export type Appointments = InferSelectModel<typeof appointments>;
export type NewAppointments = InferInsertModel<typeof appointments>;