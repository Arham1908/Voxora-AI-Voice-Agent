import { db } from "@/db";
import { schedules } from "@/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";

// ─── Zod Schema (snake_case) ──────────────────────────
const ScheduleSchema = z.object({
  day_of_week:   z.number().int().min(0).max(6),
  start_time:    z.string(),
  end_time:      z.string(),
  is_active:     z.boolean().default(true),
  slot_duration: z.number().int().default(30),
});

const PatchScheduleSchema = ScheduleSchema.partial();

// ─── Mapper: snake_case → camelCase (for Drizzle) ────
function toScheduleDb(data: z.infer<typeof ScheduleSchema>) {
  return {
    dayOfWeek:    data.day_of_week,
    startTime:    data.start_time,
    endTime:      data.end_time,
    isActive:     data.is_active,
    slotDuration: data.slot_duration,
  };
}

// ─── Mapper: camelCase → snake_case (for Response) ───
function toScheduleResponse(data: typeof schedules.$inferSelect) {
  return {
    id:           data.id,
    day_of_week:  data.dayOfWeek,
    start_time:   data.startTime,
    end_time:     data.endTime,
    is_active:    data.isActive,
    slot_duration:data.slotDuration,
  };
}

// ─── GET /api/appointment ─────────────────────────────
export async function GET() {
  const allDays = await db.select().from(schedules);
  return NextResponse.json(allDays.map(toScheduleResponse));
}

// ─── POST /api/appointment ────────────────────────────
export async function POST(request: Request) {
  const body = await request.json();

  const result = ScheduleSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { errors: result.error.flatten() },
      { status: 400 }
    );
  }

  const newSchedule = await db.insert(schedules).values(toScheduleDb(result.data)).returning();
  return NextResponse.json(toScheduleResponse(newSchedule[0]), { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();

  const result = PatchScheduleSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { errors: result.error.flatten() },
      { status: 400 }
    );
  }

  // get id from body
  const { id, ...rest } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updateData: Partial<ReturnType<typeof toScheduleDb>> = {};
  if (rest.day_of_week   !== undefined) updateData.dayOfWeek    = rest.day_of_week;
  if (rest.start_time    !== undefined) updateData.startTime    = rest.start_time;
  if (rest.end_time      !== undefined) updateData.endTime      = rest.end_time;
  if (rest.is_active     !== undefined) updateData.isActive     = rest.is_active;
  if (rest.slot_duration !== undefined) updateData.slotDuration = rest.slot_duration;

  const updated = await db
    .update(schedules)
    .set(updateData)
    .where(eq(schedules.id, Number(id)))
    .returning();

  if (!updated.length) {
    return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  }

  return NextResponse.json(toScheduleResponse(updated[0]));
}