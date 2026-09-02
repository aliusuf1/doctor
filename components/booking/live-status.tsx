"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { usePoll } from "@/lib/hooks/use-poll";

interface Snapshot {
  status: string;
  payment_status: string;
  has_link: boolean;
  starts_at: string;
  updated_at: string;
}

/**
 * Watches the patient's own appointment and re-renders the page when the
 * clinic changes anything — confirmed, video link added, rescheduled or
 * cancelled — so the patient never has to refresh manually.
 */
export function LiveStatus({
  appointmentId,
  token,
  initial,
}: {
  appointmentId: string;
  token: string;
  initial: Snapshot;
}) {
  const router = useRouter();
  const last = useRef<Snapshot>(initial);
  const [justUpdated, setJustUpdated] = useState(false);

  usePoll(async () => {
    try {
      const res = await fetch(
        `/api/bookings/${appointmentId}/status?token=${token}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const next = (await res.json()) as Snapshot;

      const changed =
        next.status !== last.current.status ||
        next.payment_status !== last.current.payment_status ||
        next.has_link !== last.current.has_link ||
        next.starts_at !== last.current.starts_at;

      last.current = next;
      if (changed) {
        setJustUpdated(true);
        router.refresh();
        setTimeout(() => setJustUpdated(false), 4000);
      }
    } catch {
      /* offline or transient — the next tick retries */
    }
  }, 15_000);

  return (
    <p className="mt-4 flex items-center justify-center gap-1.5 text-[0.7rem] text-ink-faint">
      {justUpdated ? (
        <span className="font-semibold text-ok">Just updated</span>
      ) : (
        <>
          <RefreshCw size={11} />
          This page updates itself — no need to refresh.
        </>
      )}
    </p>
  );
}
