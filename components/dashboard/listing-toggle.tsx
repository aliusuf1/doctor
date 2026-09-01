"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setListingActive } from "@/lib/actions/doctor";

export function ListingToggle({
  active,
  onboarded,
}: {
  active: boolean;
  onboarded: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  if (!onboarded) return null;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`badge ${
          active
            ? "border-ok bg-ok-tint text-ok"
            : "border-warn bg-warn-tint text-warn"
        }`}
      >
        {active ? "Listing live" : "Listing paused"}
      </span>
      <button
        type="button"
        className="btn btn-outline px-3 py-1.5 text-xs"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setErr(null);
            const r = await setListingActive(!active);
            if (r.ok) router.refresh();
            else setErr(r.error ?? "Failed");
          })
        }
      >
        {active ? "Pause bookings" : "Go live"}
      </button>
      {err && <span className="text-xs text-danger">{err}</span>}
    </div>
  );
}
