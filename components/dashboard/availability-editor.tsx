"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DateTime } from "luxon";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  addOverride,
  deleteOverride,
  saveWeeklyRules,
} from "@/lib/actions/doctor";

type RuleMode = "online" | "in_person" | "both";
interface Rule {
  weekday: number;
  start_time: string;
  end_time: string;
  mode: RuleMode;
}
interface Override {
  id: string;
  date: string;
  type: "block" | "extra";
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}
interface PreviewDay {
  date: string;
  count: number;
  first: string | null;
  last: string | null;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AvailabilityEditor({
  timezone,
  slotMinutes,
  initialRules,
  initialOverrides,
  preview,
}: {
  timezone: string;
  slotMinutes: number;
  initialRules: Rule[];
  initialOverrides: Override[];
  preview: PreviewDay[];
}) {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [overrides, setOverrides] = useState<Override[]>(initialOverrides);
  const [savingRules, startRules] = useTransition();
  const [ovPending, startOv] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const [ov, setOv] = useState({
    date: DateTime.now().plus({ days: 1 }).toISODate()!,
    type: "block" as "block" | "extra",
    start_time: "17:00",
    end_time: "20:00",
    reason: "",
  });

  function addRow(weekday: number) {
    setRules((r) => [
      ...r,
      { weekday, start_time: "17:00", end_time: "20:00", mode: "both" },
    ]);
  }
  function updateRow(idx: number, patch: Partial<Rule>) {
    setRules((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }
  function removeRow(idx: number) {
    setRules((r) => r.filter((_, i) => i !== idx));
  }

  function persistRules() {
    setMsg(null);
    startRules(async () => {
      const res = await saveWeeklyRules({ rules });
      setMsg(res.ok ? "Weekly template saved." : (res.error ?? "Failed"));
      if (res.ok) router.refresh();
    });
  }

  function submitOverride() {
    setMsg(null);
    startOv(async () => {
      const res = await addOverride(ov);
      if (res.ok) {
        router.refresh();
        setMsg("Override added.");
        // optimistic: reload from router.refresh will hydrate real ids
      } else {
        setMsg(res.error ?? "Failed");
      }
    });
  }

  function removeOverride(id: string) {
    startOv(async () => {
      const res = await deleteOverride(id);
      if (res.ok) {
        setOverrides((o) => o.filter((x) => x.id !== id));
        router.refresh();
      } else setMsg(res.error ?? "Failed");
    });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-10">
        {/* Weekly template */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="section-index">Weekly template</h2>
            <button
              onClick={persistRules}
              disabled={savingRules}
              className="btn btn-primary px-3 py-1.5 text-xs"
            >
              {savingRules && <Loader2 size={14} className="animate-spin" />}
              Save template
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {DAYS.map((label, weekday) => {
              const rows = rules
                .map((r, idx) => ({ r, idx }))
                .filter((x) => x.r.weekday === weekday);
              return (
                <div
                  key={weekday}
                  className="rounded-lg border border-line bg-paper p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{label}</span>
                    <button
                      onClick={() => addRow(weekday)}
                      className="inline-flex items-center gap-1 text-xs text-green hover:underline"
                    >
                      <Plus size={12} /> Add hours
                    </button>
                  </div>
                  {rows.length === 0 ? (
                    <p className="mt-2 text-xs text-ink-faint">Unavailable</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {rows.map(({ r, idx }) => (
                        <div
                          key={idx}
                          className="flex flex-wrap items-center gap-2 text-sm"
                        >
                          <input
                            type="time"
                            className="field w-28 py-1"
                            value={r.start_time}
                            onChange={(e) =>
                              updateRow(idx, { start_time: e.target.value })
                            }
                          />
                          <span className="text-ink-faint">to</span>
                          <input
                            type="time"
                            className="field w-28 py-1"
                            value={r.end_time}
                            onChange={(e) =>
                              updateRow(idx, { end_time: e.target.value })
                            }
                          />
                          <select
                            className="field w-32 py-1"
                            value={r.mode}
                            onChange={(e) =>
                              updateRow(idx, {
                                mode: e.target.value as RuleMode,
                              })
                            }
                          >
                            <option value="both">Both</option>
                            <option value="online">Online</option>
                            <option value="in_person">In person</option>
                          </select>
                          <button
                            onClick={() => removeRow(idx)}
                            className="text-ink-faint hover:text-danger"
                            aria-label="Remove"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Overrides */}
        <section>
          <h2 className="section-index">Date overrides</h2>
          <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-line bg-paper p-3">
            <label className="text-xs">
              <span className="field-label">Date</span>
              <input
                type="date"
                className="field py-1"
                value={ov.date}
                onChange={(e) => setOv((s) => ({ ...s, date: e.target.value }))}
              />
            </label>
            <label className="text-xs">
              <span className="field-label">Type</span>
              <select
                className="field py-1"
                value={ov.type}
                onChange={(e) =>
                  setOv((s) => ({
                    ...s,
                    type: e.target.value as "block" | "extra",
                  }))
                }
              >
                <option value="block">Block</option>
                <option value="extra">Extra hours</option>
              </select>
            </label>
            {ov.type === "extra" || ov.type === "block" ? (
              <>
                <label className="text-xs">
                  <span className="field-label">
                    {ov.type === "block" ? "From (optional)" : "From"}
                  </span>
                  <input
                    type="time"
                    className="field w-28 py-1"
                    value={ov.start_time}
                    onChange={(e) =>
                      setOv((s) => ({ ...s, start_time: e.target.value }))
                    }
                  />
                </label>
                <label className="text-xs">
                  <span className="field-label">
                    {ov.type === "block" ? "To (optional)" : "To"}
                  </span>
                  <input
                    type="time"
                    className="field w-28 py-1"
                    value={ov.end_time}
                    onChange={(e) =>
                      setOv((s) => ({ ...s, end_time: e.target.value }))
                    }
                  />
                </label>
              </>
            ) : null}
            <button
              onClick={submitOverride}
              disabled={ovPending}
              className="btn btn-primary px-3 py-1.5 text-xs"
            >
              {ovPending && <Loader2 size={14} className="animate-spin" />}
              Add
            </button>
          </div>
          <p className="mt-2 text-xs text-ink-faint">
            Block with no times = whole day off. Block with a time range = that
            window only.
          </p>

          <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-paper">
            {overrides.length === 0 && (
              <li className="px-4 py-3 text-xs text-ink-faint">
                No upcoming overrides.
              </li>
            )}
            {overrides.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span>
                  {DateTime.fromISO(o.date).toFormat("ccc d LLL")} ·{" "}
                  <span
                    className={
                      o.type === "block" ? "text-danger" : "text-ok"
                    }
                  >
                    {o.type === "block" ? "Blocked" : "Extra"}
                  </span>
                  {o.start_time && o.end_time
                    ? ` ${o.start_time}–${o.end_time}`
                    : " (all day)"}
                </span>
                <button
                  onClick={() => removeOverride(o.id)}
                  className="text-ink-faint hover:text-danger"
                  aria-label="Delete override"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {msg && <p className="text-sm text-ink-soft">{msg}</p>}
      </div>

      {/* Preview */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-lg border border-line bg-cream-deep p-4">
          <h2 className="section-index">What patients see</h2>
          <p className="mt-1 text-xs text-ink-faint">
            Next 14 days · {slotMinutes}-min slots · unsaved template changes not
            included
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {preview.length === 0 && (
              <li className="text-ink-faint">No open slots.</li>
            )}
            {preview.map((d) => (
              <li key={d.date} className="flex justify-between">
                <span>{DateTime.fromISO(d.date).toFormat("ccc d LLL")}</span>
                <span className="text-ink-faint">
                  {d.count} slot{d.count === 1 ? "" : "s"}
                  {d.first
                    ? ` · ${DateTime.fromISO(d.first)
                        .setZone(timezone)
                        .toFormat("h:mma")
                        .toLowerCase()}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
