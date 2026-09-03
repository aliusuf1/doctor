"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { usePoll } from "@/lib/hooks/use-poll";

interface Pulse {
  total: number;
  pending: number;
  latest: string | null;
}

/**
 * Watches this doctor's appointments for changes and *offers* a refresh rather
 * than forcing one — a silent auto-refresh would wipe an open row or a
 * half-typed Meet link while she is mid-action.
 */
export function LiveAppointments({ initial }: { initial: Pulse }) {
  const router = useRouter();
  const seen = useRef<Pulse>(initial);
  const [changed, setChanged] = useState(0); // net new bookings since load
  const [stale, setStale] = useState(false);

  usePoll(async () => {
    try {
      const res = await fetch("/api/dashboard/pulse", { cache: "no-store" });
      if (!res.ok) return;
      const next = (await res.json()) as Pulse;

      const isDifferent =
        next.total !== seen.current.total ||
        next.pending !== seen.current.pending ||
        next.latest !== seen.current.latest;

      if (isDifferent) {
        setChanged((n) => n + Math.max(0, next.total - seen.current.total));
        setStale(true);
        seen.current = next;
      }
    } catch {
      /* transient — the next tick retries */
    }
  }, 45_000);

  function refreshNow() {
    setStale(false);
    setChanged(0);
    router.refresh();
  }

  if (stale) {
    return (
      <button
        type="button"
        onClick={refreshNow}
        className="inline-flex items-center gap-1.5 rounded-full border border-ok bg-ok-tint px-3 py-1 text-xs font-semibold text-ok transition-colors hover:bg-ok hover:text-white"
      >
        <RefreshCw size={12} />
        {changed > 0
          ? `${changed} new booking${changed === 1 ? "" : "s"} — show`
          : "Updated — show"}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-faint">
      <span className="size-1.5 rounded-full bg-ok" />
      Live
      <button
        type="button"
        aria-label="Refresh now"
        onClick={refreshNow}
        className="ml-1 transition-colors hover:text-green"
      >
        <RefreshCw size={12} />
      </button>
    </span>
  );
}
