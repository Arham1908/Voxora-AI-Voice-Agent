CREATE TABLE "schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"slot_duration" integer DEFAULT 30 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "schedules_day_of_week_start_time_unique" UNIQUE("day_of_week","start_time")
);
--> statement-breakpoint
DROP TABLE "posts_table" CASCADE;--> statement-breakpoint
DROP TABLE "users_table" CASCADE;