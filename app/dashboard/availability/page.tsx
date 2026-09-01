import { DateTime } from "luxon";
import { getDoctorAccount } from "@/lib/data/doctor-account";
import { supabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase/admin";
import { AvailabilityEditor } from "@/components/dashboard/availability-editor";
import { MonthCalendar } from "@/components/dashboard/month-calendar";
import { CalendarSubscribe } from "@/components/dashboard/calendar-subscribe";
import { buildSlots } from "@/lib/scheduling/engine";
import { site } from "@/lib/site";
import type {
  AppointmentRow,
  AvailabilityOverrideRow,
  AvailabilityRuleRow,
} from "@/lib/db/types";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const account = await getDoctorAccount();
  if (!account?.doctor) {
    return <p className="text-sm text-ink-faint">Could not load your record.</p>;
  }
  const doctor = account.doctor;

  let rules: AvailabilityRuleRow[] = [];
  let overrides: AvailabilityOverrideRow[] = [];
  if (hasSupabaseAdmin()) {
    const sb = supabaseAdmin();
    const today = DateTime.now().toISODate()!;
    const [r, o] = await Promise.all([
      sb.from("availability_rules").select("*").eq("doctor_id", doctor.id),
      sb
        .from("availability_overrides")
        .select("*")
        .eq("doctor_id", doctor.id)
        .gte("date", today)
        .order("date"),
    ]);
    rules = (r.data ?? []) as AvailabilityRuleRow[];
    overrides = (o.data ?? []) as AvailabilityOverrideRow[];
  }

  // Preview: what patients would see for ~6 weeks (either mode)
  const from = new Date();
  const to = DateTime.now().plus({ days: 42 }).toJSDate();
  const config = {
    timezone: doctor.timezone,
    slot_duration_min: doctor.slot_duration_min,
    buffer_min: doctor.buffer_min,
    min_notice_hours: doctor.min_notice_hours,
    booking_horizon_days: doctor.booking_horizon_days,
  };

  let booked: AppointmentRow[] = [];
  if (hasSupabaseAdmin()) {
    const { data } = await supabaseAdmin()
      .from("appointments")
      .select("*")
      .eq("doctor_id", doctor.id)
      .neq("status", "cancelled")
      .gte("starts_at", from.toISOString())
      .lte("starts_at", to.toISOString());
    booked = (data ?? []) as AppointmentRow[];
  }
  const busy = booked.map((b) => ({ start: b.starts_at, end: b.ends_at }));

  const previewOnline = buildSlots({
    config,
    rules,
    overrides,
    busy,
    mode: "online",
    from,
    to,
  });
  const previewInPerson = buildSlots({
    config,
    rules,
    overrides,
    busy,
    mode: "in_person",
    from,
    to,
  });
  const preview = previewOnline;

  // per-day aggregate for the month calendar
  const byDate = new Map<string, number>();
  for (const d of [...previewOnline, ...previewInPerson]) {
    byDate.set(d.date, Math.max(byDate.get(d.date) ?? 0, d.slots.length));
  }
  const calendarDays = [...byDate.entries()].map(([date, open]) => ({
    date,
    open,
    blocked: overrides.some(
      (o) => o.date === date && o.type === "block" && !o.start_time,
    ),
    booked: booked.filter(
      (b) =>
        DateTime.fromISO(b.starts_at).setZone(doctor.timezone).toISODate() ===
        date,
    ).length,
  }));

  const icsUrl = `${site.url}/api/doctors/${doctor.slug}/calendar?token=${doctor.calendar_token}`;

  return (
    <div>
      <h1 className="display text-3xl">Availability</h1>
      <p className="prose-body mt-2 max-w-xl text-sm">
        Set a weekly template, then use date overrides to block days off or add
        extra hours. Patients only ever see genuinely open slots. Times are in
        your timezone ({doctor.timezone}).
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <MonthCalendar timezone={doctor.timezone} days={calendarDays} />
        <CalendarSubscribe url={icsUrl} />
      </div>

      <div className="mt-10">
        <AvailabilityEditor
          timezone={doctor.timezone}
          slotMinutes={doctor.slot_duration_min}
          initialRules={rules.map((r) => ({
            weekday: r.weekday,
            start_time: r.start_time.slice(0, 5),
            end_time: r.end_time.slice(0, 5),
            mode: r.mode,
          }))}
          initialOverrides={overrides.map((o) => ({
            id: o.id,
            date: o.date,
            type: o.type,
            start_time: o.start_time?.slice(0, 5) ?? null,
            end_time: o.end_time?.slice(0, 5) ?? null,
            reason: o.reason,
          }))}
          preview={preview.map((d) => ({
            date: d.date,
            count: d.slots.length,
            first: d.slots[0]?.start ?? null,
            last: d.slots.at(-1)?.start ?? null,
          }))}
        />
      </div>
    </div>
  );
}
