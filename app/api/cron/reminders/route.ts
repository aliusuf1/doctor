import { NextResponse } from "next/server";
import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabase/admin";
import { isAuthorizedCron } from "@/lib/cron";
import { notify } from "@/lib/notifications";
import { loadAppointmentBundle, templateCtx } from "@/lib/data/appointments";

export const dynamic = "force-dynamic";

/**
 * Sends 24h and 1h reminders for confirmed appointments.
 * Schedule every ~15 minutes via Vercel Cron.
 */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const sb = supabaseAdmin();
  const now = Date.now();
  const sent = { h24: 0, h1: 0 };

  // 24h window: starts_at within [now+23h, now+25h] and not yet reminded
  const { data: due24 } = await sb
    .from("appointments")
    .select("id")
    .eq("status", "confirmed")
    .is("reminded_24h_at", null)
    .gte("starts_at", new Date(now + 23 * 3600_000).toISOString())
    .lte("starts_at", new Date(now + 25 * 3600_000).toISOString())
    .limit(200);

  for (const row of (due24 ?? []) as { id: string }[]) {
    const bundle = await loadAppointmentBundle({ id: row.id });
    if (!bundle) continue;
    await notify({
      event: "reminder_24h",
      appointmentId: row.id,
      to: {
        email: bundle.patient.email,
        whatsapp: bundle.patient.phone,
        name: bundle.patient.full_name,
      },
      ctx: templateCtx(bundle.appointment, bundle.doctor, bundle.patient),
      whatsappOptIn: bundle.patient.whatsapp_opt_in,
    });
    await sb
      .from("appointments")
      .update({ reminded_24h_at: new Date().toISOString() })
      .eq("id", row.id);
    sent.h24 += 1;
  }

  // 1h window: starts_at within [now+30m, now+90m]
  const { data: due1 } = await sb
    .from("appointments")
    .select("id")
    .eq("status", "confirmed")
    .is("reminded_1h_at", null)
    .gte("starts_at", new Date(now + 30 * 60_000).toISOString())
    .lte("starts_at", new Date(now + 90 * 60_000).toISOString())
    .limit(200);

  for (const row of (due1 ?? []) as { id: string }[]) {
    const bundle = await loadAppointmentBundle({ id: row.id });
    if (!bundle) continue;
    await notify({
      event: "reminder_1h",
      appointmentId: row.id,
      to: {
        email: bundle.patient.email,
        whatsapp: bundle.patient.phone,
        name: bundle.patient.full_name,
      },
      ctx: templateCtx(bundle.appointment, bundle.doctor, bundle.patient),
      whatsappOptIn: bundle.patient.whatsapp_opt_in,
    });
    await sb
      .from("appointments")
      .update({ reminded_1h_at: new Date().toISOString() })
      .eq("id", row.id);
    sent.h1 += 1;
  }

  return NextResponse.json({ sent });
}
