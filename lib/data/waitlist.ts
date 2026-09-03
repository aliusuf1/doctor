import "server-only";
import { DateTime } from "luxon";
import { supabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase/admin";
import { getDoctorSlotsBySlug } from "@/lib/data/schedule";
import { notify } from "@/lib/notifications";
import { site } from "@/lib/site";
import type { WaitlistEntryRow } from "@/lib/db/types";

/**
 * When a slot frees up on `date`, email everyone waiting for that doctor+date
 * (once). Best-effort; never throws.
 */
export async function notifyWaitlistForDate(
  doctorId: string,
  date: string,
): Promise<void> {
  if (!hasSupabaseAdmin()) return;
  const sb = supabaseAdmin();

  const { data: doctor } = await sb
    .from("doctors")
    .select("slug, full_name")
    .eq("id", doctorId)
    .maybeSingle<{ slug: string; full_name: string }>();
  if (!doctor) return;

  const { data: entries } = await sb
    .from("waitlist_entries")
    .select("*")
    .eq("doctor_id", doctorId)
    .eq("date", date)
    .is("notified_at", null);

  const list = (entries ?? []) as WaitlistEntryRow[];
  if (list.length === 0) return;

  // Confirm there really is an open slot that day before pinging anyone.
  const from = DateTime.fromISO(date).startOf("day").toJSDate();
  const to = DateTime.fromISO(date).endOf("day").toJSDate();
  const res = await getDoctorSlotsBySlug({ slug: doctor.slug, from, to });
  const hasSlot = res?.days.some((d) => d.date === date && d.slots.length > 0);
  if (!hasSlot) return;

  const bookUrl = `${site.url}/doctors/${doctor.slug}`;
  for (const e of list) {
    await notify({
      event: "waitlist_slot_open",
      appointmentId: null,
      to: { email: e.email, whatsapp: e.phone, name: e.full_name },
      ctx: {
        patientName: e.full_name,
        doctorName: doctor.full_name,
        startsAtIso: DateTime.fromISO(date).toISO()!,
        timezone: "Asia/Karachi",
        feePkr: null,
        meetLink: null,
        manageUrl: bookUrl,
      },
      whatsappOptIn: true,
    });
    await sb
      .from("waitlist_entries")
      .update({ notified_at: new Date().toISOString() })
      .eq("id", e.id);
  }
}
