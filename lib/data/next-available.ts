import "server-only";
import { DateTime } from "luxon";
import { supabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase/admin";
import { buildSlots } from "@/lib/scheduling/engine";
import type {
  AvailabilityOverrideRow,
  AvailabilityRuleRow,
  DoctorRow,
} from "@/lib/db/types";

/**
 * Recompute `doctors.next_available_at` — the earliest bookable slot within
 * the booking horizon. Call after availability
 * or appointments change. Cheap: one doctor, a bounded window.
 */
export async function refreshNextAvailable(doctorId: string): Promise<void> {
  if (!hasSupabaseAdmin()) return;
  const sb = supabaseAdmin();

  const { data: doctor } = await sb
    .from("doctors")
    .select(
      "id, timezone, slot_duration_min, buffer_min, min_notice_hours, booking_horizon_days, online_enabled",
    )
    .eq("id", doctorId)
    .maybeSingle<
      Pick<
        DoctorRow,
        | "id"
        | "timezone"
        | "slot_duration_min"
        | "buffer_min"
        | "min_notice_hours"
        | "booking_horizon_days"
        | "online_enabled"
      >
    >();
  if (!doctor) return;

  const from = new Date();
  const to = DateTime.now()
    .plus({ days: doctor.booking_horizon_days })
    .toJSDate();

  const [{ data: rules }, { data: overrides }, { data: busy }] =
    await Promise.all([
      sb.from("availability_rules").select("*").eq("doctor_id", doctorId).eq("is_active", true),
      sb
        .from("availability_overrides")
        .select("*")
        .eq("doctor_id", doctorId)
        .gte("date", DateTime.fromJSDate(from).toISODate()!)
        .lte("date", DateTime.fromJSDate(to).toISODate()!),
      sb
        .from("appointments")
        .select("starts_at, ends_at")
        .eq("doctor_id", doctorId)
        .neq("status", "cancelled")
        .gte("starts_at", from.toISOString())
        .lte("starts_at", to.toISOString()),
    ]);

  const config = {
    timezone: doctor.timezone,
    slot_duration_min: doctor.slot_duration_min,
    buffer_min: doctor.buffer_min,
    min_notice_hours: doctor.min_notice_hours,
    booking_horizon_days: doctor.booking_horizon_days,
  };
  const busyIntervals = ((busy ?? []) as { starts_at: string; ends_at: string }[]).map(
    (b) => ({ start: b.starts_at, end: b.ends_at }),
  );

  const days = doctor.online_enabled
    ? buildSlots({
        config,
        rules: (rules ?? []) as AvailabilityRuleRow[],
        overrides: (overrides ?? []) as AvailabilityOverrideRow[],
        busy: busyIntervals,
        from,
        to,
      })
    : [];
  const earliest = days[0]?.slots[0]?.start ?? null;

  await sb
    .from("doctors")
    .update({ next_available_at: earliest })
    .eq("id", doctorId);
}
