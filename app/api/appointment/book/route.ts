import { db } from "@/db"
import { appointments } from "@/db/schema/appointments"
import { NextResponse } from "next/server"
import { count } from "drizzle-orm";
import { Appointments } from "@/db/schema/appointments";
import { date, z } from "zod"
import { eq,and } from "drizzle-orm";
import {sendAppoinmentEmail} from "@/lib/service/sendAppoinmentEmail"
// ─── Zod Schema ───────────────────────────────────────
const appointmentSchema = z.object({
  name:       z.string().min(1),
  phone:      z.string().min(11).max(20),
  email:      z.string().email(),              // ← fix
  date:       z.string(),
  start_time: z.string(),
  end_time:   z.string(),
  status:     z.enum(["pending", "confirmed", "cancelled", "completed"]).default("pending"), // ← fix
  notes:      z.string().optional(),
});

// ─── Response Mapper ──────────────────────────────────
function toAppointmentResponse(data: Appointments) {
  return {
    id:          data.id,
    name:        data.name,
    phone:       data.phone,
    email:       data.email,
    date:        data.date,
    start_time:  data.startTime,
    end_time:    data.endTime,
    status:      data.status,
    notes:       data.notes,
    created_at:  data.createdAt,
  };
}

// ─── Request Mapper ───────────────────────────────────
function toAppointmentDb(data: z.infer<typeof appointmentSchema>) {
  return {
    name:      data.name,
    phone:     data.phone,
    email:     data.email,
    date:      data.date,
    startTime: data.start_time,
    endTime:   data.end_time,
    status:    data.status,
    notes:     data.notes,
  };
}

// ─── GET /api/appointments ────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const page   = Number(searchParams.get("page"))      || 1;
  const size   = Number(searchParams.get("page_size")) || 10;
  const offset = (page - 1) * size;

  const [data, total] = await Promise.all([
    db.select().from(appointments).limit(size).offset(offset),
    db.select({ count: count() }).from(appointments),
  ]);

  return NextResponse.json({
    data: data.map(toAppointmentResponse),
    pagination: {
      page,
      size,
      total:       total[0].count,
      total_pages: Math.ceil(total[0].count / size),
      has_next:    page < Math.ceil(total[0].count / size),
      has_prev:    page > 1,
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  const result = appointmentSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { errors: result.error.flatten() },
      { status: 400 }                        // ← status outside json
    );
  }
  if (result.data) {
  // check if slot already booked
  const exists = await db.select().from(appointments).where(
    and(
      eq(appointments.date, result.data.date),
      eq(appointments.startTime, result.data.start_time)
    )
  );

  if (exists.length > 0) {
    return NextResponse.json(
      { error: "This slot is already booked" },
      { status: 409 }  // 409 Conflict
    );
  }
}
   sendAppoinmentEmail(result.data)
  const newAppointment = await db
    .insert(appointments)
    .values(toAppointmentDb(result.data))
    .returning();

  return NextResponse.json(toAppointmentResponse(newAppointment[0]), { status: 201 });
}