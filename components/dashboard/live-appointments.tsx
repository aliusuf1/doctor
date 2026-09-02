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
 * Keeps the dashboard current: polls a lightweight fingerprint of this
 * doctor's appointments and re-renders the page when a new booking arrives or
 * a status changes. Also catches up the moment the tab regains focus.
 */
export function LiveAppointments({ initial }: { initial: Pulse }) {
  const router = useRouter();
  const last = useRef<Pulse>(initial);
  const [newCount, setNewCount] = useState(0);

  usePoll(async () => {
    try {
      const res = await fetch("/api/dashboard/pulse", { cache: "no-store" });
      if (!res.ok) return;
      const next = (await res.json()) as Pulse;

      const changed =
        next.total !== last.current.total ||
        next.pending !== last.current.pending ||
        next.latest !== last.current.latest;

      const arrived = Math.max(0, next.total - last.current.total);
      last.current = next;

      if (changed) {
        if (arrived > 0) {
          setNewCount((n) => n + arrived);
          setTimeout(() => setNewCount(0), 8000);
        }
        router.refresh();
      }
    } catch {
      /* transient — the next tick retries */
    }
  }, 20_000);

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-faint">
      {newCount > 0 ? (
        <span className="font-semibold text-ok">
          {newCount} new booking{newCount === 1 ? "" : "s"}
        </span>
      ) : (
        <>
          <span className="size-1.5 animate-pulse rounded-full bg-ok" />
          Live
        </>
      )}
      <button
        type="button"
        aria-label="Refresh now"
        onClick={() => router.refresh()}
        className="ml-1 transition-colors hover:text-green"
      >
        <RefreshCw size={12} />
      </button>
    </span>
  );
}
