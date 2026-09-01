"use client";

import { useState } from "react";
import { DateTime } from "luxon";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Day {
  date: string; // YYYY-MM-DD
  open: number;
  booked: number;
  blocked: boolean;
}

/**
 * Read-oriented month grid of what patients see. Use the editor below it to make
 * changes; this view updates on save.
 */
export function MonthCalendar({
  days,
  timezone,
}: {
  days: Day[];
  timezone: string;
}) {
  const [month, setMonth] = useState(() =>
    DateTime.now().setZone(timezone).startOf("month"),
  );
  const map = new Map(days.map((d) => [d.date, d]));

  const gridStart = month.startOf("week").minus({ days: 1 }); // week starts Sunday
  const cells = Array.from({ length: 42 }, (_, i) => gridStart.plus({ days: i }));
  const today = DateTime.now().setZone(timezone).toISODate();

  return (
    <div className="rounded-lg border border-line bg-paper p-4">
      <div className="flex items-center justify-between">
        <h2 className="section-index">Month view · what patients see</h2>
        <div className="flex items-center gap-2">
          <button
            aria-label="Previous month"
            onClick={() => setMonth((m) => m.minus({ months: 1 }))}
            className="rounded border border-line p-1 hover:border-green"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-medium">
            {month.toFormat("LLLL yyyy")}
          </span>
          <button
            aria-label="Next month"
            onClick={() => setMonth((m) => m.plus({ months: 1 }))}
            className="rounded border border-line p-1 hover:border-green"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[0.65rem] font-semibold uppercase text-ink-faint">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((c) => {
          const iso = c.toISODate()!;
          const info = map.get(iso);
          const inMonth = c.month === month.month;
          const isToday = iso === today;
          return (
            <div
              key={iso}
              className={`min-h-[3.4rem] rounded border p-1 text-left ${
                inMonth ? "border-line" : "border-transparent opacity-40"
              } ${isToday ? "ring-1 ring-green" : ""} ${
                info?.blocked ? "bg-danger-tint" : ""
              }`}
            >
              <div className="text-[0.7rem] text-ink-faint">{c.day}</div>
              {info?.blocked ? (
                <div className="text-[0.62rem] font-medium text-danger">
                  Off
                </div>
              ) : info && info.open > 0 ? (
                <div className="text-[0.62rem] font-medium text-ok">
                  {info.open} open
                </div>
              ) : null}
              {info && info.booked > 0 && (
                <div className="text-[0.62rem] text-ink-soft">
                  {info.booked} booked
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
