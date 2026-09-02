import { NextResponse } from "next/server";
import { requireDoctor } from "@/lib/data/doctor-account";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/pulse
 * A cheap fingerprint of this doctor's appointments — total count, the number
 * awaiting receipt verification, and the newest `updated_at`. The dashboard
 * polls it and re-renders only when the fingerprint changes, so new bookings
 * and status changes appear without a manual refresh.
 */
export async function GET() {
  let acc;
  try {
    acc = await requireDoctor();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = supabaseAdmin();
  const [{ count }, { data: latest }, { count: pending }] = await Promise.all([
    sb
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("doctor_id", acc.doctor.id),
    sb
      .from("appointments")
      .select("updated_at")
      .eq("doctor_id", acc.doctor.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("doctor_id", acc.doctor.id)
      .eq("status", "pending_payment")
      .eq("payment_status", "submitted"),
  ]);

  return NextResponse.json(
    {
      total: count ?? 0,
      pending: pending ?? 0,
      latest: latest?.updated_at ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
