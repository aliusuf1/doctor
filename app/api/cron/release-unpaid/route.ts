import { NextResponse } from "next/server";
import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabase/admin";
import { isAuthorizedCron } from "@/lib/cron";
import { env } from "@/lib/env";
import { cancelAppointment } from "@/lib/data/appointments";

export const dynamic = "force-dynamic";

/**
 * Releases slots held by unpaid bookings older than HOLD_MINUTES_UNPAID.
 * Schedule every ~10 minutes via Vercel Cron.
 */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const sb = supabaseAdmin();
  const cutoff = new Date(
    Date.now() - env.holdMinutesUnpaid * 60_000,
  ).toISOString();

  const { data: stale } = await sb
    .from("appointments")
    .select("id")
    .eq("status", "pending_payment")
    .in("payment_status", ["unpaid", "failed"])
    .lt("created_at", cutoff)
    .limit(100);

  let released = 0;
  for (const row of (stale ?? []) as { id: string }[]) {
    const res = await cancelAppointment(row.id, "system", "Payment not received");
    if (res.ok) released += 1;
  }

  return NextResponse.json({ released });
}
