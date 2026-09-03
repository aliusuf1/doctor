import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import { buildSlots, isSlotBookable } from "@/lib/scheduling/engine";
import type {
  AvailabilityOverrideRow,
  AvailabilityRuleRow,
} from "@/lib/db/types";

const config = {
  timezone: "Asia/Karachi",
  slot_duration_min: 30,
  buffer_min: 0,
  min_notice_hours: 0,
  booking_horizon_days: 30,
};

function rule(
  weekday: number,
  start: string,
  end: string,
): AvailabilityRuleRow {
  return {
    id: `r-${weekday}-${start}`,
    doctor_id: "d1",
    weekday,
    start_time: start,
    end_time: end,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  };
}

function override(
  partial: Partial<AvailabilityOverrideRow> & {
    date: string;
    type: "block" | "extra";
  },
): AvailabilityOverrideRow {
  return {
    id: `o-${partial.date}`,
    doctor_id: "d1",
    start_time: null,
    end_time: null,
    reason: null,
    created_at: "2026-01-01T00:00:00Z",
    ...partial,
  };
}

// A fixed "now": Mon 2026-03-02 08:00 in Karachi.
const now = DateTime.fromISO("2026-03-02T08:00:00", {
  zone: "Asia/Karachi",
}).toJSDate();
const from = now;
const to = DateTime.fromJSDate(now).plus({ days: 7 }).toJSDate();

describe("buildSlots", () => {
  it("slices a weekly rule into fixed-length slots", () => {
    // Monday = weekday 1
    const days = buildSlots({
      config,
      rules: [rule(1, "17:00", "19:00")],
      overrides: [],
      busy: [],
      from,
      to,
      now,
    });
    const monday = days.find((d) => d.date === "2026-03-02");
    expect(monday?.slots.length).toBe(4); // 17:00, 17:30, 18:00, 18:30
    expect(
      DateTime.fromISO(monday!.slots[0].start).setZone("Asia/Karachi").toFormat("HH:mm"),
    ).toBe("17:00");
  });

  it("respects min_notice_hours", () => {
    const days = buildSlots({
      config: { ...config, min_notice_hours: 12 },
      rules: [rule(1, "17:00", "19:00")],
      overrides: [],
      busy: [],
      from,
      to,
      now,
    });
    // now = Mon 08:00, +12h = Mon 20:00 → all Monday evening slots excluded
    expect(days.find((d) => d.date === "2026-03-02")).toBeUndefined();
  });

  it("removes slots overlapping a busy interval", () => {
    const days = buildSlots({
      config,
      rules: [rule(1, "17:00", "19:00")],
      overrides: [],
      busy: [
        {
          start: DateTime.fromISO("2026-03-02T17:00:00", {
            zone: "Asia/Karachi",
          }).toUTC().toISO()!,
          end: DateTime.fromISO("2026-03-02T17:30:00", {
            zone: "Asia/Karachi",
          }).toUTC().toISO()!,
        },
      ],
      from,
      to,
      now,
    });
    const monday = days.find((d) => d.date === "2026-03-02");
    expect(monday?.slots.length).toBe(3);
    expect(
      DateTime.fromISO(monday!.slots[0].start).setZone("Asia/Karachi").toFormat("HH:mm"),
    ).toBe("17:30");
  });

  it("whole-day block removes all slots", () => {
    const days = buildSlots({
      config,
      rules: [rule(1, "17:00", "19:00")],
      overrides: [override({ date: "2026-03-02", type: "block" })],
      busy: [],
      from,
      to,
      now,
    });
    expect(days.find((d) => d.date === "2026-03-02")).toBeUndefined();
  });

  it("partial block subtracts only its window", () => {
    const days = buildSlots({
      config,
      rules: [rule(1, "17:00", "19:00")],
      overrides: [
        override({
          date: "2026-03-02",
          type: "block",
          start_time: "17:00",
          end_time: "18:00",
        }),
      ],
      busy: [],
      from,
      to,
      now,
    });
    const monday = days.find((d) => d.date === "2026-03-02");
    expect(monday?.slots.length).toBe(2); // 18:00, 18:30
  });

  it("extra override adds hours on a day with no rule", () => {
    const days = buildSlots({
      config,
      rules: [],
      overrides: [
        override({
          date: "2026-03-03",
          type: "extra",
          start_time: "10:00",
          end_time: "11:00",
        }),
      ],
      busy: [],
      from,
      to,
      now,
    });
    expect(days.find((d) => d.date === "2026-03-03")?.slots.length).toBe(2);
  });
});

describe("isSlotBookable", () => {
  const slotStart = DateTime.fromISO("2026-03-02T17:30:00", {
    zone: "Asia/Karachi",
  })
    .toUTC()
    .toISO()!;

  it("accepts a real slot", () => {
    expect(
      isSlotBookable({
        config,
        rules: [rule(1, "17:00", "19:00")],
        overrides: [],
        busy: [],
        slotStartIso: slotStart,
        now,
      }),
    ).toBe(true);
  });

  it("rejects an off-grid time", () => {
    const bad = DateTime.fromISO("2026-03-02T17:20:00", {
      zone: "Asia/Karachi",
    })
      .toUTC()
      .toISO()!;
    expect(
      isSlotBookable({
        config,
        rules: [rule(1, "17:00", "19:00")],
        overrides: [],
        busy: [],
        slotStartIso: bad,
        now,
      }),
    ).toBe(false);
  });

  it("rejects a slot that is now busy", () => {
    expect(
      isSlotBookable({
        config,
        rules: [rule(1, "17:00", "19:00")],
        overrides: [],
        busy: [{ start: slotStart, end: DateTime.fromISO(slotStart).plus({ minutes: 30 }).toISO()! }],
        slotStartIso: slotStart,
        now,
      }),
    ).toBe(false);
  });
});
