import { hasSupabaseAdmin } from "@/lib/supabase/admin";
import { loadAppointmentBundle } from "@/lib/data/appointments";
import { buildIcs } from "@/lib/ics";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

/** GET /api/bookings/:id/calendar.ics?token=... — add-to-calendar file. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasSupabaseAdmin()) return new Response("Not configured", { status: 503 });
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return new Response("Missing token", { status: 401 });

  const bundle = await loadAppointmentBundle({ id });
  if (!bundle || bundle.appointment.manage_token !== token) {
    return new Response("Not found", { status: 404 });
  }
  const { appointment: a, doctor: d } = bundle;

  const ics = buildIcs({
    uid: `appt-${a.id}@northline`,
    start: a.starts_at,
    end: a.ends_at,
    sequence: 0,
    status: a.status === "cancelled" ? "CANCELLED" : "CONFIRMED",
    summary: `Dermatology consultation — ${d.full_name}`,
    description:
      (a.meet_link ? `Join: ${a.meet_link}\n` : "Online video consultation\n") +
      `Manage: ${site.url}/booking/${a.manage_token}`,
    location: a.meet_link ?? "Online",
    url: `${site.url}/booking/${a.manage_token}`,
    organizerName: d.full_name,
  });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="consultation-${a.id.slice(0, 8)}.ics"`,
    },
  });
}
