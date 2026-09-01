import "server-only";
import { DateTime } from "luxon";
import { supabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase/admin";
import {
  buildSlots,
  isSlotBookable,
  type BusyInterval,
  type DoctorScheduleConfig,
  type SlotDay,
} from "@/lib/scheduling/engine";
import type {
  AvailabilityOverrideRow,
  AvailabilityRuleRow,
  ConsultationMode,
  DoctorRow,
} from "@/lib/db/types";

const SCHEDULE_FIELDS =
  "id, slug, full_name, timezone, slot_duration_min, buffer_min, min_notice_hours, booking_horizon_days, consultation_fee_pkr, currency, online_enabled, in_person_enabled, is_active";

export interface ScheduleContext {
  doctor: Pick<
    DoctorRow,
    | "id"
    | "slug"
    | "full_name"
    | "timezone"
    | "slot_duration_min"
    | "buffer_min"
    | "min_notice_hours"
    | "booking_horizon_days"
    | "consultation_fee_pkr"
    | "currency"
    | "online_enabled"
    | "in_person_enabled"
    | "is_active"
  >;
  config: DoctorScheduleConfig;
  rules: AvailabilityRuleRow[];
  overrides: AvailabilityOverrideRow[];
}

async function loadContextByColumn(
  column: "slug" | "id",
  value: string,
  opts: { from: Date; to: Date },
): Promise<ScheduleContext | null> {
  if (!hasSupabaseAdmin()) return null;
  const sb = supabaseAdmin();

  const { data: doctor, error } = await sb
    .from("doctors")
    .select(SCHEDULE_FIELDS)
    .eq(column, value)
    .maybeSingle();
  if (error || !doctor) return null;

  const fromDate = DateTime.fromJSDate(opts.from).toISODate()!;
  const toDate = DateTime.fromJSDate(opts.to).toISODate()!;

  const [rulesRes, overridesRes] = await Promise.all([
    sb
      .from("availability_rules")
      .select("*")
      .eq("doctor_id", doctor.id)
      .eq("is_active", true),
    sb
      .from("availability_overrides")
      .select("*")
      .eq("doctor_id", doctor.id)
      .gte("date", fromDate)
      .lte("date", toDate),
  ]);

  const config: DoctorScheduleConfig = {
    timezone: doctor.timezone,
    slot_duration_min: doctor.slot_duration_min,
    buffer_min: doctor.buffer_min,
    min_notice_hours: doctor.min_notice_hours,
    booking_horizon_days: doctor.booking_horizon_days,
  };

  return {
    doctor,
    config,
    rules: (rulesRes.data ?? []) as AvailabilityRuleRow[],
    overrides: (overridesRes.data ?? []) as AvailabilityOverrideRow[],
  };
}

async function loadBusy(
  doctorId: string,
  from: Date,
  to: Date,
): Promise<BusyInterval[]> {
  if (!hasSupabaseAdmin()) return [];
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("appointments")
    .select("starts_at, ends_at, status")
    .eq("doctor_id", doctorId)
    .neq("status", "cancelled")
    .gte("starts_at", from.toISOString())
    .lte("starts_at", to.toISOString());
  return ((data ?? []) as { starts_at: string; ends_at: string }[]).map((r) => ({
    start: r.starts_at,
    end: r.ends_at,
  }));
}

/** Public: available slots for a doctor identified by slug. */
export async function getDoctorSlotsBySlug(params: {
  slug: string;
  mode: ConsultationMode;
  from: Date;
  to: Date;
}): Promise<{ context: ScheduleContext; days: SlotDay[] } | null> {
  const context = await loadContextByColumn("slug", params.slug, {
    from: params.from,
    to: params.to,
  });
  if (!context || !context.doctor.is_active) return null;

  const busy = await loadBusy(context.doctor.id, params.from, params.to);
  const days = buildSlots({
    config: context.config,
    rules: context.rules,
    overrides: context.overrides,
    busy,
    mode: params.mode,
    from: params.from,
    to: params.to,
  });
  return { context, days };
}

/** Server-side re-check used at booking time (defence in depth). */
export async function verifySlotBookable(params: {
  doctorId: string;
  mode: ConsultationMode;
  slotStartIso: string;
}): Promise<{ ok: boolean; context?: ScheduleContext }> {
  const start = new Date(params.slotStartIso);
  const context = await loadContextByColumn("id", params.doctorId, {
    from: new Date(start.getTime() - 86_400_000),
    to: new Date(start.getTime() + 86_400_000),
  });
  if (!context || !context.doctor.is_active) return { ok: false };

  const busy = await loadBusy(
    params.doctorId,
    new Date(start.getTime() - 86_400_000),
    new Date(start.getTime() + 86_400_000),
  );

  const ok = isSlotBookable({
    config: context.config,
    rules: context.rules,
    overrides: context.overrides,
    busy,
    mode: params.mode,
    slotStartIso: params.slotStartIso,
  });
  return { ok, context };
}
