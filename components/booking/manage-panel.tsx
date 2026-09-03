"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DateTime } from "luxon";
import { Loader2, Upload, CalendarClock, XCircle } from "lucide-react";

interface Slot {
  start: string;
  end: string;
}
interface SlotDay {
  date: string;
  slots: Slot[];
}

export function ManagePanel({
  appointmentId,
  token,
  slug,
  timezone,
  status,
  paymentMethod,
  paymentStatus,
  hasProof,
  bankDetails,
  cancellationNoticeHours,
  startsAtIso,
}: {
  appointmentId: string;
  token: string;
  slug: string;
  timezone: string;
  status: string;
  paymentMethod: "online" | "bank_transfer" | null;
  paymentStatus: string;
  hasProof: boolean;
  bankDetails: string | null;
  cancellationNoticeHours: number;
  startsAtIso: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [showResched, setShowResched] = useState(false);
  const [days, setDays] = useState<SlotDay[]>([]);
  const [activeDate, setActiveDate] = useState<string | null>(null);

  const locked =
    status === "cancelled" || status === "completed" || status === "no_show";
  const hoursUntil = DateTime.fromISO(startsAtIso).diffNow("hours").hours;
  const changeable = !locked && hoursUntil >= cancellationNoticeHours;

  useEffect(() => {
    if (!showResched) return;
    fetch(`/api/doctors/${slug}/slots?days=21`)
      .then((r) => r.json())
      .then((d: { days: SlotDay[] }) => {
        setDays(d.days ?? []);
        setActiveDate(d.days?.[0]?.date ?? null);
      })
      .catch(() => setError("Could not load availability"));
  }, [showResched, slug]);

  async function uploadProof(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy("proof");
    setError(null);
    setOk(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(
        `/api/bookings/${appointmentId}/proof?token=${token}`,
        { method: "POST", body: fd },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setOk("Receipt uploaded. The specialist will verify and confirm.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  async function doCancel() {
    if (!confirm("Cancel this appointment?")) return;
    setBusy("cancel");
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${appointmentId}/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function doReschedule(slotStart: string) {
    setBusy("resched");
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${appointmentId}/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reschedule",
          token,
          slot_start: slotStart,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setShowResched(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  const activeDay = days.find((d) => d.date === activeDate);

  return (
    <div className="mt-6 space-y-4">
      {bankDetails && paymentStatus !== "verified" && (
        <div className="card p-5">
          <h2 className="font-serif text-lg">Pay by bank transfer</h2>
          <pre className="mt-3 whitespace-pre-wrap rounded bg-cream-deep p-3 text-xs text-ink-soft">
            {bankDetails}
          </pre>
          <form onSubmit={uploadProof} className="mt-4 space-y-3">
            <span className="field-label">Upload your payment receipt</span>

            <label className="flex cursor-pointer items-center gap-3 rounded border border-dashed border-line-strong bg-white px-3 py-2.5 text-sm hover:border-flare">
              <span className="btn btn-outline shrink-0 px-3 py-1.5 text-xs">
                Choose file
              </span>
              <span className="truncate text-ink-soft">
                {file ? file.name : "JPG, PNG, WEBP or PDF · up to 6 MB"}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setError(null);
                  setOk(null);
                }}
                className="hidden"
              />
            </label>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={!file || busy === "proof"}
            >
              {busy === "proof" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {hasProof ? "Replace receipt" : "Upload receipt"}
            </button>

            {!file && !hasProof && (
              <p className="text-xs text-ink-faint">
                Choose your receipt image above, then press upload.
              </p>
            )}
            {hasProof && (
              <p className="text-xs text-ok">
                A receipt is on file and awaiting verification. You can replace it
                above.
              </p>
            )}
          </form>
        </div>
      )}

      {paymentMethod === "online" &&
        paymentStatus !== "verified" &&
        status === "pending_payment" && (
          <div className="card p-5 text-sm text-ink-soft">
            Payment not completed.{" "}
            <a
              className="font-medium text-green underline"
              href={`/doctors/${slug}`}
            >
              Start a new booking
            </a>{" "}
            or contact the clinic if you were charged.
          </div>
        )}

      {changeable && (
        <div className="card p-5">
          <h2 className="font-serif text-lg">Change this appointment</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setShowResched((v) => !v)}
              className="btn btn-outline px-3 py-2 text-sm"
              disabled={busy !== null}
            >
              <CalendarClock size={15} /> Reschedule
            </button>
            <button
              onClick={doCancel}
              className="btn btn-outline px-3 py-2 text-sm"
              disabled={busy !== null}
            >
              {busy === "cancel" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <XCircle size={15} />
              )}
              Cancel
            </button>
          </div>

          {showResched && (
            <div className="mt-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {days.map((d) => (
                  <button
                    key={d.date}
                    onClick={() => setActiveDate(d.date)}
                    className={`min-w-16 rounded border px-2 py-2 text-xs ${
                      activeDate === d.date
                        ? "border-green bg-green text-paper"
                        : "border-line"
                    }`}
                  >
                    {DateTime.fromISO(d.date, { zone: timezone }).toFormat(
                      "ccc d",
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {activeDay?.slots.map((s) => (
                  <button
                    key={s.start}
                    onClick={() => doReschedule(s.start)}
                    disabled={busy === "resched"}
                    className="rounded border border-line-strong px-2 py-2 text-sm hover:border-green hover:bg-green-tint"
                  >
                    {DateTime.fromISO(s.start)
                      .setZone(timezone)
                      .toFormat("h:mm a")}
                  </button>
                ))}
                {activeDay && activeDay.slots.length === 0 && (
                  <p className="col-span-full text-xs text-ink-faint">
                    No open slots that day.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!changeable && !locked && (
        <p className="text-xs text-ink-faint">
          Within {cancellationNoticeHours} hours of the appointment — contact the
          clinic to make changes.
        </p>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
      {ok && <p className="text-sm text-ok">{ok}</p>}
    </div>
  );
}
