import { NextResponse } from "next/server";
import { z } from "zod";
import { DateTime } from "luxon";
import { hasSupabaseAdmin } from "@/lib/supabase/admin";
import { loadAppointmentBundle } from "@/lib/data/appointments";
import {
  cancelAppointment,
  rescheduleAppointment,
} from "@/lib/data/appointments";
import { verifySlotBookable } from "@/lib/data/schedule";

export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("cancel"), token: z.string().min(1) }),
  z.object({
    action: z.literal("reschedule"),
    token: z.string().min(1),
    slot_start: z.string().datetime({ offset: true }),
  }),
]);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const body = parsed.data;

  const bundle = await loadAppointmentBundle({ id });
  if (!bundle || bundle.appointment.manage_token !== body.token) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { appointment: a, doctor: d } = bundle;

  if (a.status === "cancelled" || a.status === "completed") {
    return NextResponse.json(
      { error: "This booking can no longer be changed." },
      { status: 409 },
    );
  }

  const hoursUntil = DateTime.fromISO(a.starts_at).diffNow("hours").hours;
  if (hoursUntil < d.cancellation_notice_hours) {
    return NextResponse.json(
      {
        error: `Changes must be made at least ${d.cancellation_notice_hours} hours in advance. Please contact the clinic.`,
      },
      { status: 422 },
    );
  }

  if (body.action === "cancel") {
    const res = await cancelAppointment(id, "patient", "Cancelled by patient");
    return res.ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: res.error }, { status: 500 });
  }

  // reschedule
  const check = await verifySlotBookable({
    doctorId: d.id,
    mode: a.mode,
    slotStartIso: body.slot_start,
  });
  if (!check.ok) {
    return NextResponse.json(
      { error: "That time is not available. Pick another slot." },
      { status: 409 },
    );
  }
  const res = await rescheduleAppointment({
    id,
    newStartIso: body.slot_start,
    by: "patient",
  });
  return res.ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: res.error }, { status: 500 });
}
