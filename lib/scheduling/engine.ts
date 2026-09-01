import { DateTime, Interval } from "luxon";
import type {
  AvailabilityOverrideRow,
  AvailabilityRuleRow,
  ConsultationMode,
} from "@/lib/db/types";

export interface DoctorScheduleConfig {
  timezone: string;
  slot_duration_min: number;
  buffer_min: number;
  min_notice_hours: number;
  booking_horizon_days: number;
}

export interface BusyInterval {
  start: string; // ISO (UTC)
  end: string; // ISO (UTC)
}

export interface Slot {
  /** ISO UTC instant the slot starts */
  start: string;
  /** ISO UTC instant the slot ends */
  end: string;
}

export interface SlotDay {
  /** YYYY-MM-DD in the doctor's timezone */
  date: string;
  slots: Slot[];
}

function parseHms(t: string): { hour: number; minute: number } {
  const [h, m] = t.split(":");
  return { hour: Number(h), minute: Number(m ?? 0) };
}

function ruleMatchesMode(rule: AvailabilityRuleRow, mode: ConsultationMode) {
  return rule.mode === "both" || rule.mode === mode;
}

/**
 * Build the list of bookable slots for a doctor between `from` and `to`.
 *
 * Algorithm, per calendar day in the doctor's timezone:
 *   1. weekly `availability_rules` for that weekday (filtered by mode) → intervals
 *   2. add `extra` overrides for that date
 *   3. subtract `block` overrides (whole-day when no times given)
 *   4. slice each remaining interval into (slot_duration + buffer) steps
 *   5. drop slots that start before now + min_notice_hours
 *   6. drop slots overlapping any busy interval (existing appointments)
 *   7. clamp to [now, now + booking_horizon_days]
 */
export function buildSlots(params: {
  config: DoctorScheduleConfig;
  rules: AvailabilityRuleRow[];
  overrides: AvailabilityOverrideRow[];
  busy: BusyInterval[];
  mode: ConsultationMode;
  from: Date;
  to: Date;
  now?: Date;
}): SlotDay[] {
  const {
    config,
    rules,
    overrides,
    busy,
    mode,
    from,
    to,
    now = new Date(),
  } = params;

  const zone = config.timezone || "Asia/Karachi";
  const step = Math.max(
    5,
    (config.slot_duration_min || 20) + (config.buffer_min || 0),
  );
  const slotLen = config.slot_duration_min || 20;

  const nowDt = DateTime.fromJSDate(now, { zone });
  const earliest = nowDt.plus({ hours: config.min_notice_hours || 0 });
  const horizon = nowDt
    .plus({ days: config.booking_horizon_days || 30 })
    .endOf("day");

  let cursor = DateTime.fromJSDate(from, { zone }).startOf("day");
  const end = DateTime.fromJSDate(to, { zone }).endOf("day");
  const windowStart = earliest;
  const windowEnd = DateTime.min(end, horizon);

  const busyIntervals = busy
    .map((b) =>
      Interval.fromDateTimes(
        DateTime.fromISO(b.start, { zone }),
        DateTime.fromISO(b.end, { zone }),
      ),
    )
    .filter((i) => i.isValid);

  const overridesByDate = new Map<string, AvailabilityOverrideRow[]>();
  for (const o of overrides) {
    const list = overridesByDate.get(o.date) ?? [];
    list.push(o);
    overridesByDate.set(o.date, list);
  }

  const days: SlotDay[] = [];

  while (cursor <= end) {
    const dateKey = cursor.toISODate()!;
    const weekdayLuxon = cursor.weekday % 7; // Luxon: 1=Mon..7=Sun -> 0=Sun..6=Sat
    const dayOverrides = overridesByDate.get(dateKey) ?? [];

    const wholeDayBlocked = dayOverrides.some(
      (o) => o.type === "block" && !o.start_time && !o.end_time,
    );

    let intervals: Interval[] = [];

    if (!wholeDayBlocked) {
      // 1. weekly rules
      for (const rule of rules) {
        if (rule.is_active === false) continue;
        if (rule.weekday !== weekdayLuxon) continue;
        if (!ruleMatchesMode(rule, mode)) continue;
        const s = parseHms(rule.start_time);
        const e = parseHms(rule.end_time);
        const start = cursor.set(s);
        const finish = cursor.set(e);
        if (finish > start) {
          intervals.push(Interval.fromDateTimes(start, finish));
        }
      }

      // 2. extra overrides
      for (const o of dayOverrides) {
        if (o.type !== "extra" || !o.start_time || !o.end_time) continue;
        const start = cursor.set(parseHms(o.start_time));
        const finish = cursor.set(parseHms(o.end_time));
        if (finish > start) {
          intervals.push(Interval.fromDateTimes(start, finish));
        }
      }

      intervals = Interval.merge(intervals);

      // 3. subtract partial blocks
      for (const o of dayOverrides) {
        if (o.type !== "block") continue;
        if (!o.start_time || !o.end_time) continue;
        const bStart = cursor.set(parseHms(o.start_time));
        const bFinish = cursor.set(parseHms(o.end_time));
        const blockInt = Interval.fromDateTimes(bStart, bFinish);
        intervals = intervals.flatMap((i) => i.difference(blockInt));
      }
    }

    // 4-6. slice
    const slots: Slot[] = [];
    for (const int of intervals) {
      let slotStart = int.start!;
      while (slotStart.plus({ minutes: slotLen }) <= int.end!) {
        const slotEnd = slotStart.plus({ minutes: slotLen });
        const inWindow = slotStart >= windowStart && slotStart <= windowEnd;
        const clashes = busyIntervals.some((b) =>
          b.overlaps(Interval.fromDateTimes(slotStart, slotEnd)),
        );
        if (inWindow && !clashes) {
          slots.push({
            start: slotStart.toUTC().toISO()!,
            end: slotEnd.toUTC().toISO()!,
          });
        }
        slotStart = slotStart.plus({ minutes: step });
      }
    }

    if (slots.length > 0 && cursor >= windowStart.startOf("day")) {
      days.push({ date: dateKey, slots });
    }
    cursor = cursor.plus({ days: 1 });
  }

  void windowEnd;
  return days;
}

/** True when `slotStartIso` is a valid, currently-bookable slot start. */
export function isSlotBookable(params: {
  config: DoctorScheduleConfig;
  rules: AvailabilityRuleRow[];
  overrides: AvailabilityOverrideRow[];
  busy: BusyInterval[];
  mode: ConsultationMode;
  slotStartIso: string;
  now?: Date;
}): boolean {
  const start = DateTime.fromISO(params.slotStartIso, { zone: "utc" });
  if (!start.isValid) return false;
  const from = start.minus({ days: 1 }).toJSDate();
  const to = start.plus({ days: 1 }).toJSDate();
  const days = buildSlots({ ...params, from, to });
  const target = start.toUTC().toISO();
  return days.some((d) => d.slots.some((s) => s.start === target));
}
