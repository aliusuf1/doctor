"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DateTime } from "luxon";
import { Loader2, Video, MapPin, CheckCircle2 } from "lucide-react";
import { cn, formatPkr } from "@/lib/utils";

type Mode = "online" | "in_person";
interface Slot {
  start: string;
  end: string;
}
interface SlotDay {
  date: string;
  slots: Slot[];
}

interface Props {
  slug: string;
  doctorName: string;
  timezone: string;
  feePkr: number | null;
  onlineEnabled: boolean;
  inPersonEnabled: boolean;
  onlinePaymentsEnabled: boolean;
}

export function BookingWidget({
  slug,
  doctorName,
  timezone,
  feePkr,
  onlineEnabled,
  inPersonEnabled,
  onlinePaymentsEnabled,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const wantedSlot = params.get("slot");
  const wantedConcern = params.get("concern");
  const wantedMode = params.get("mode");
  const slotApplied = useRef(false);

  const [mode, setMode] = useState<Mode>(
    wantedMode === "in_person" && inPersonEnabled
      ? "in_person"
      : wantedMode === "online" && onlineEnabled
        ? "online"
        : onlineEnabled
          ? "online"
          : "in_person",
  );
  const [days, setDays] = useState<SlotDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    concern: wantedConcern ?? "",
    whatsapp_opt_in: true,
    consent: false,
    payment_method: onlinePaymentsEnabled
      ? ("online" as const)
      : ("bank_transfer" as const),
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const viewerZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );
  const showZoneHint = viewerZone && viewerZone !== timezone;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/doctors/${slug}/slots?mode=${mode}&days=21`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Failed to load");
        return r.json();
      })
      .then((data: { days: SlotDay[] }) => {
        if (cancelled) return;
        setDays(data.days);

        // Preselect a slot passed via ?slot=<iso> (once).
        if (wantedSlot && !slotApplied.current) {
          for (const d of data.days) {
            const hit = d.slots.find((s) => s.start === wantedSlot);
            if (hit) {
              setActiveDate(d.date);
              setSlot(hit);
              slotApplied.current = true;
              return;
            }
          }
        }
        setActiveDate(data.days[0]?.date ?? null);
        setSlot(null);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug, mode]);

  const activeDay = days.find((d) => d.date === activeDate);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot) return;
    setSubmitError(null);

    if (!form.consent) {
      setSubmitError("Please confirm the consent checkbox to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_slug: slug,
          mode,
          slot_start: slot.start,
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          concern: form.concern,
          whatsapp_opt_in: form.whatsapp_opt_in,
          payment_method: form.payment_method,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");
      if (data.redirect_url) {
        window.location.href = data.redirect_url as string;
        return;
      }
      router.push(`/booking/${data.manage_token}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Booking failed");
      setSubmitting(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line bg-cream-deep px-6 py-4">
        <p className="font-serif text-lg">Book a consultation</p>
        <p className="text-xs text-ink-faint">
          {feePkr != null ? `${formatPkr(feePkr)} · ` : ""}
          Instant confirmation once payment is verified
        </p>
      </div>

      <div className="space-y-6 p-6">
        {/* Mode toggle */}
        {onlineEnabled && inPersonEnabled && (
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["online", "Online", <Video key="v" size={15} />],
                ["in_person", "In person", <MapPin key="m" size={15} />],
              ] as const
            ).map(([value, label, icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded border px-3 py-2 text-sm transition-colors",
                  mode === value
                    ? "border-green bg-green text-paper"
                    : "border-line-strong hover:border-green",
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Slot picker */}
        {!slot && (
          <div>
            {loading ? (
              <div className="animate-pulse">
                <div className="flex gap-2 overflow-hidden pb-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 min-w-16 rounded border border-line bg-cream-deep"
                    />
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-9 rounded border border-line bg-cream-deep"
                    />
                  ))}
                </div>
              </div>
            ) : error ? (
              <p className="py-8 text-sm text-danger">{error}</p>
            ) : days.length === 0 ? (
              <p className="py-8 text-sm text-ink-faint">
                No open slots in the next three weeks. Please check back later.
              </p>
            ) : (
              <>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {days.map((d) => {
                    const dt = DateTime.fromISO(d.date, { zone: timezone });
                    return (
                      <button
                        key={d.date}
                        type="button"
                        onClick={() => setActiveDate(d.date)}
                        className={cn(
                          "flex min-w-16 flex-col items-center rounded border px-3 py-2 text-xs transition-colors",
                          activeDate === d.date
                            ? "border-green bg-green text-paper"
                            : "border-line hover:border-green",
                        )}
                      >
                        <span className="font-semibold uppercase">
                          {dt.toFormat("ccc")}
                        </span>
                        <span className="mt-0.5 text-sm">
                          {dt.toFormat("d")}
                        </span>
                        <span>{dt.toFormat("LLL")}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {activeDay?.slots.map((s, i) => {
                    const dt = DateTime.fromISO(s.start).setZone(timezone);
                    return (
                      <button
                        key={s.start}
                        type="button"
                        onClick={() => setSlot(s)}
                        style={{ animationDelay: `${Math.min(i * 18, 260)}ms` }}
                        className="pop-in rounded border border-line-strong px-2 py-2 text-sm transition-colors hover:border-green hover:bg-green-tint active:scale-95"
                      >
                        {dt.toFormat("h:mm a")}
                      </button>
                    );
                  })}
                </div>

                {showZoneHint && (
                  <p className="mt-3 text-xs text-ink-faint">
                    Times shown in the clinic timezone ({timezone}). Your device
                    is {viewerZone}.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Booking form */}
        {slot && (
          <form onSubmit={submit} className="space-y-4">
            <div className="flex items-center justify-between rounded border border-green bg-green-tint px-3 py-2 text-sm">
              <span>
                {DateTime.fromISO(slot.start)
                  .setZone(timezone)
                  .toFormat("cccc d LLL, h:mm a")}
                <span className="text-ink-faint"> · {mode === "online" ? "Online" : "In person"}</span>
              </span>
              <button
                type="button"
                className="text-xs underline"
                onClick={() => setSlot(null)}
              >
                Change
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="bf-name">
                  Full name
                </label>
                <input
                  id="bf-name"
                  required
                  className="field"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, full_name: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="field-label" htmlFor="bf-phone">
                  Phone / WhatsApp
                </label>
                <input
                  id="bf-phone"
                  required
                  placeholder="+92…"
                  className="field"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="bf-email">
                Email address
              </label>
              <input
                id="bf-email"
                type="email"
                required
                className="field"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="field-label" htmlFor="bf-concern">
                Briefly describe your concern
              </label>
              <textarea
                id="bf-concern"
                rows={3}
                className="field"
                value={form.concern}
                onChange={(e) =>
                  setForm((f) => ({ ...f, concern: e.target.value }))
                }
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="field-label">Payment method</legend>
              {onlinePaymentsEnabled && (
                <label className="flex items-center gap-2.5 text-sm">
                  <input
                    type="radio"
                    name="pm"
                    className="size-[17px] shrink-0 accent-flare"
                    checked={form.payment_method === "online"}
                    onChange={() =>
                      setForm((f) => ({ ...f, payment_method: "online" }))
                    }
                  />
                  Pay online now
                </label>
              )}
              <label className="flex items-center gap-2.5 text-sm">
                <input
                  type="radio"
                  name="pm"
                  className="size-[17px] shrink-0 accent-flare"
                  checked={form.payment_method === "bank_transfer"}
                  onChange={() =>
                    setForm((f) => ({
                      ...f,
                      payment_method: "bank_transfer",
                    }))
                  }
                />
                Bank transfer + upload receipt
              </label>
            </fieldset>

            <label className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-soft">
              <input
                type="checkbox"
                className="mt-0.5 size-[18px] shrink-0 accent-flare"
                checked={form.whatsapp_opt_in}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    whatsapp_opt_in: e.target.checked,
                  }))
                }
              />
              Send me appointment updates on WhatsApp.
            </label>

            <label className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-soft">
              <input
                type="checkbox"
                className="mt-0.5 size-[18px] shrink-0 accent-flare"
                checked={form.consent}
                onChange={(e) =>
                  setForm((f) => ({ ...f, consent: e.target.checked }))
                }
              />
              I consent to being contacted about this request and have read the
              privacy notice. I understand submitting this form does not itself
              constitute medical advice.
            </label>

            {submitError && (
              <p className="text-sm text-danger">{submitError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Booking…
                </>
              ) : form.payment_method === "online" ? (
                "Continue to payment"
              ) : (
                "Confirm booking"
              )}
            </button>

            <p className="flex items-start gap-1.5 text-xs text-ink-faint">
              <CheckCircle2 size={13} className="mt-0.5 shrink-0" />
              Your slot is held while payment is verified, then confirmed with{" "}
              {doctorName}.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
