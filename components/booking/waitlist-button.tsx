"use client";

import { useState } from "react";
import { DateTime } from "luxon";
import { BellRing, Loader2 } from "lucide-react";

export function WaitlistButton({
  slug,
  defaultMode,
}: {
  slug: string;
  defaultMode: "online" | "in_person";
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({
    date: DateTime.now().plus({ days: 1 }).toISODate()!,
    mode: defaultMode,
    full_name: "",
    email: "",
    phone: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    setError(null);
    try {
      const res = await fetch(`/api/doctors/${slug}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not join");
      setState("done");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Could not join");
    }
  }

  if (state === "done") {
    return (
      <div className="card p-4 text-sm text-ok">
        You&rsquo;re on the waitlist. We&rsquo;ll email you if a slot opens on
        that day.
      </div>
    );
  }

  return (
    <div className="card p-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 text-sm text-green hover:underline"
        >
          <BellRing size={15} /> Fully booked on your day? Join the waitlist
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm font-semibold">Notify me if a slot opens</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              required
              className="field py-1.5 text-sm"
              value={f.date}
              min={DateTime.now().toISODate()!}
              onChange={(e) => setF((s) => ({ ...s, date: e.target.value }))}
            />
            <select
              className="field py-1.5 text-sm"
              value={f.mode}
              onChange={(e) =>
                setF((s) => ({
                  ...s,
                  mode: e.target.value as "online" | "in_person",
                }))
              }
            >
              <option value="online">Online</option>
              <option value="in_person">In person</option>
            </select>
          </div>
          <input
            required
            placeholder="Full name"
            className="field py-1.5 text-sm"
            value={f.full_name}
            onChange={(e) => setF((s) => ({ ...s, full_name: e.target.value }))}
          />
          <input
            required
            type="email"
            placeholder="Email"
            className="field py-1.5 text-sm"
            value={f.email}
            onChange={(e) => setF((s) => ({ ...s, email: e.target.value }))}
          />
          <input
            placeholder="Phone (optional)"
            className="field py-1.5 text-sm"
            value={f.phone}
            onChange={(e) => setF((s) => ({ ...s, phone: e.target.value }))}
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={state === "saving"}
              className="btn btn-primary flex-1 py-2 text-sm"
            >
              {state === "saving" && (
                <Loader2 size={14} className="animate-spin" />
              )}
              Join waitlist
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-outline py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
