"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
import { ChevronLeft, ChevronRight, Loader2, Video, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";

type Mode = "online" | "in_person";
interface Slot {
  start: string;
  end: string;
}

/**
 * Full month availability explorer pulled live from Dr. Sana's calendar.
 * Navigate months, pick a day, pick a time — the time deep-links into the
 * booking page with the slot preselected (?slot=…&mode=…).
 */
export function AvailabilityExplorer({
  onlineEnabled,
  inPersonEnabled,
}: {
  onlineEnabled: boolean;
  inPersonEnabled: boolean;
}) {
  const today = useMemo(() => DateTime.now().setZone(site.timezone ?? "Asia/Karachi"), []);
  const [mode, setMode] = useState<Mode>(onlineEnabled ? "online" : "in_person");
  const [month, setMonth] = useState<DateTime>(today.startOf("month"));
  const [byDate, setByDate] = useState<Record<string, Slot[]>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [tz, setTz] = useState("Asia/Karachi");

  const load = useCallback(
    (m: DateTime, md: Mode) => {
      setLoading(true);
      const from = m.toISODate()!;
      const days = m.daysInMonth ?? 31;
      fetch(
        `/api/doctors/${site.doctorSlug}/slots?mode=${md}&from=${from}&days=${days}`,
      )
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then(
          (data: {
            days: { date: string; slots: Slot[] }[];
            doctor?: { timezone?: string };
          }) => {
            const map: Record<string, Slot[]> = {};
            for (const d of data.days ?? []) map[d.date] = d.slots;
            setByDate(map);
            setTz(data.doctor?.timezone ?? "Asia/Karachi");
            setSelected((prev) => (prev && map[prev]?.length ? prev : null));
          },
        )
        .catch(() => setByDate({}))
        .finally(() => setLoading(false));
    },
    [],
  );

  useEffect(() => {
    load(month, mode);
  }, [month, mode, load]);

  const gridStart = month.startOf("week").minus({ days: 1 }); // week starts Sunday
  const cells = Array.from({ length: 42 }, (_, i) => gridStart.plus({ days: i }));
  const canGoBack = month > today.startOf("month");
  const selectedSlots = selected ? (byDate[selected] ?? []) : [];

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_16rem] md:items-start">
      <div>
        {onlineEnabled && inPersonEnabled && (
          <div className="mb-4 inline-flex rounded-sm border border-line p-0.5 text-xs font-semibold">
            {(
              [
                ["online", "Online", Video],
                ["in_person", "In person", MapPin],
              ] as const
            ).map(([v, label, Icon]) => (
              <button
                key={v}
                type="button"
                onClick={() => setMode(v)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[2px] px-3 py-1.5 transition-colors",
                  mode === v ? "bg-ink text-paper" : "text-ink-soft",
                )}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            disabled={!canGoBack}
            onClick={() => setMonth((m) => m.minus({ months: 1 }))}
            className="rounded-sm border border-line p-1.5 transition-colors enabled:hover:border-ink disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="display text-lg font-bold">
            {month.toFormat("LLLL yyyy")}
          </span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setMonth((m) => m.plus({ months: 1 }))}
            className="rounded-sm border border-line p-1.5 transition-colors hover:border-ink"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="relative mt-4">
          {loading && (
            <div className="absolute inset-0 z-10 grid place-items-center bg-paper/70">
              <Loader2 size={20} className="animate-spin text-ink-faint" />
            </div>
          )}

          <div className="grid grid-cols-7 gap-1 text-center text-[0.62rem] font-bold uppercase tracking-wide text-ink-faint">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((c) => {
              const iso = c.toISODate()!;
              const inMonth = c.month === month.month;
              const count = byDate[iso]?.length ?? 0;
              const isPast = c < today.startOf("day");
              const isSel = selected === iso;
              const disabled = !inMonth || isPast || count === 0;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelected(iso)}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center rounded-sm border text-sm transition-colors",
                    isSel
                      ? "border-flare bg-flare text-white"
                      : disabled
                        ? "border-transparent text-ink-faint/50"
                        : "border-line hover:border-ink",
                  )}
                >
                  <span
                    className={cn(!inMonth && "opacity-40", "leading-none")}
                  >
                    {c.day}
                  </span>
                  {count > 0 && !isSel && (
                    <span className="mt-1 size-1 rounded-full bg-flare" />
                  )}
                  {isSel && (
                    <span className="mt-0.5 text-[0.55rem] font-semibold">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* time column */}
      <div className="rounded-sm border border-line p-4 md:sticky md:top-24">
        {!selected ? (
          <p className="text-sm text-ink-faint">
            Pick a highlighted day to see open times. Dots mark days with
            availability.
          </p>
        ) : selectedSlots.length === 0 ? (
          <p className="text-sm text-ink-faint">No open times that day.</p>
        ) : (
          <>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">
              {DateTime.fromISO(selected).toFormat("cccc d LLL")}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {selectedSlots.map((s) => (
                <Link
                  key={s.start}
                  href={`${site.bookHref}?mode=${mode}&slot=${encodeURIComponent(s.start)}`}
                  className="rounded-sm border border-line px-2 py-2 text-center text-sm font-medium transition-colors hover:border-flare hover:text-flare"
                >
                  {DateTime.fromISO(s.start).setZone(tz).toFormat("h:mm a")}
                </Link>
              ))}
            </div>
            <p className="mt-3 text-[0.7rem] text-ink-faint">
              Times in {tz}. Choosing one takes you to booking with it held.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
