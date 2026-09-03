import { DateTime } from "luxon";
import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabase/admin";
import { buildIcsFeed } from "@/lib/ics";
import { site } from "@/lib/site";
import type { AppointmentRow, DoctorRow, PatientRow } from "@/lib/db/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/doctors/:slug/calendar.ics?token=<calendar_token>
 * A subscribable feed of the doctor's confirmed + pending appointments.
 * Auth is the per-doctor calendar_token (rotatable), not a login.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!hasSupabaseAdmin()) return new Response("Not configured", { status: 503 });
  const { slug } = await params;
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return new Response("Missing token", { status: 401 });

  const sb = supabaseAdmin();
  const { data: doctor } = await sb
    .from("doctors")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<DoctorRow>();
  if (!doctor || doctor.calendar_token !== token) {
    return new Response("Not found", { status: 404 });
  }

  const { data: appts } = await sb
    .from("appointments")
    .select("*, patient:patients(full_name, email)")
    .eq("doctor_id", doctor.id)
    .in("status", ["confirmed", "pending_payment", "completed"])
    .gte("starts_at", DateTime.now().minus({ days: 30 }).toISO())
    .order("starts_at");

  const rows = (appts ?? []) as (AppointmentRow & {
    patient: Pick<PatientRow, "full_name" | "email"> | null;
  })[];

  const feed = buildIcsFeed(
    `${doctor.full_name} — ${site.name}`,
    rows.map((a) => ({
      uid: `appt-${a.id}@northline`,
      start: a.starts_at,
      end: a.ends_at,
      status:
        a.status === "pending_payment"
          ? ("TENTATIVE" as const)
          : ("CONFIRMED" as const),
      summary: `${a.status === "pending_payment" ? "(unpaid) " : ""}${
        a.patient?.full_name ?? "Patient"
      } — online`,
      description:
        (a.concern ? `Concern: ${a.concern}\n` : "") +
        (a.patient?.email ? `${a.patient.email}\n` : "") +
        (a.meet_link ? `Meet: ${a.meet_link}\n` : ""),
      location: a.meet_link ?? "Online",
    })),
  );

  return new Response(feed, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
