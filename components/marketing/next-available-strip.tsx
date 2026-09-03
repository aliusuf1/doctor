"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
import { ArrowRight, CalendarClock } from "lucide-react";
import { site } from "@/lib/site";

interface Slot {
  start: string;
}
interface Day {
  date: string;
  slots: Slot[];
}

/**
 * Live "next available" chips pulled from Dr. Sana's real calendar. Each chip
 * links straight into the booking page. Degrades to a plain CTA on error / no
 * slots, and never blocks render.
 */
export function NextAvailableStrip() {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ok"; slots: string[]; tz: string }
    | { status: "empty" }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/doctors/${site.doctorSlug}/slots?days=21`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { days: Day[]; doctor?: { timezone?: string } }) => {
        if (cancelled) return;
        const flat = (data.days ?? []).flatMap((d) => d.slots.map((s) => s.start));
        if (flat.length === 0) {
          setState({ status: "empty" });
        } else {
          setState({
            status: "ok",
            slots: flat.slice(0, 3),
            tz: data.doctor?.timezone ?? "Asia/Karachi",
          });
        }
      })
      .catch(() => !cancelled && setState({ status: "empty" }));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-on-dark">
        <CalendarClock size={16} className="text-flare" />
        Next available
      </span>

      {state.status === "loading" && (
        <span className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-8 w-24 animate-pulse rounded-sm bg-white/10"
            />
          ))}
        </span>
      )}

      {state.status === "ok" &&
        state.slots.map((iso) => {
          const dt = DateTime.fromISO(iso).setZone(state.tz);
          const now = DateTime.now().setZone(state.tz);
          const day = dt.hasSame(now, "day")
            ? "Today"
            : dt.hasSame(now.plus({ days: 1 }), "day")
              ? "Tomorrow"
              : dt.toFormat("ccc d LLL");
          return (
            <Link
              key={iso}
              href={site.bookHref}
              className="rounded-sm border border-line-dark px-3 py-1.5 text-sm font-medium text-on-dark transition-colors hover:border-flare hover:text-flare"
            >
              {day} · {dt.toFormat("h:mm a")}
            </Link>
          );
        })}

      {state.status === "empty" && (
        <Link
          href={site.bookHref}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-dark hover:text-flare"
        >
          View the calendar <ArrowRight size={14} />
        </Link>
      )}

      {state.status === "ok" && (
        <Link
          href={site.bookHref}
          className="text-sm font-semibold text-on-dark-faint hover:text-on-dark"
        >
          more times →
        </Link>
      )}
    </div>
  );
}
