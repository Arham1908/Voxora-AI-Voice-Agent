CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"status" "appointment_status" DEFAULT 'pending' NOT NULL,
	CONSTRAINT "appointments_date_start_time_unique" UNIQUE("date","start_time")
);
