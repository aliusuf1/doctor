"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { saveDoctorProfile, type ActionResult } from "@/lib/actions/doctor";
import type { DoctorRow } from "@/lib/db/types";
import { slugify } from "@/lib/utils";
import { FileUpload } from "@/components/dashboard/file-upload";

const COMMON_TZ = [
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
];

export function ProfileForm({
  doctor,
  mode,
}: {
  doctor: DoctorRow;
  mode: "onboarding" | "edit";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  const [f, setF] = useState({
    full_name: doctor.full_name ?? "",
    slug: doctor.slug ?? "",
    credentials: doctor.credentials ?? "",
    specialty: (doctor.specialty ?? ["Dermatology"]).join(", "),
    headline: doctor.headline ?? "",
    bio: doctor.bio ?? "",
    photo_url: doctor.photo_url ?? "",
    clinic_name: doctor.clinic_name ?? "",
    clinic_address: doctor.clinic_address ?? "",
    city: doctor.city ?? "Karachi",
    timezone: doctor.timezone ?? "Asia/Karachi",
    consultation_fee_pkr: String(doctor.consultation_fee_pkr ?? 3000),
    slot_duration_min: String(doctor.slot_duration_min ?? 20),
    buffer_min: String(doctor.buffer_min ?? 0),
    min_notice_hours: String(doctor.min_notice_hours ?? 12),
    booking_horizon_days: String(doctor.booking_horizon_days ?? 30),
    cancellation_notice_hours: String(doctor.cancellation_notice_hours ?? 6),
    online_enabled: doctor.online_enabled ?? true,
    bank_details: doctor.bank_details ?? "",
    standing_meet_link: doctor.standing_meet_link ?? "",
    google_calendar_id: doctor.google_calendar_id ?? "",
    license_number: doctor.license_number ?? "",
  });

  const err = (k: string) => result?.fieldErrors?.[k];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    const payload = {
      ...f,
      specialty: f.specialty
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    startTransition(async () => {
      const res = await saveDoctorProfile(payload, {
        completeOnboarding: mode === "onboarding",
      });
      setResult(res);
      if (res.ok) {
        router.refresh();
        if (mode === "onboarding") router.push("/dashboard/availability");
      }
    });
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-8">
      <section className="space-y-4">
        <h2 className="section-index">Identity</h2>
        <Field label="Full name" error={err("full_name")}>
          <input
            className="field"
            value={f.full_name}
            onChange={(e) =>
              setF((s) => ({
                ...s,
                full_name: e.target.value,
                slug:
                  mode === "onboarding" && !doctor.onboarded_at
                    ? slugify(e.target.value)
                    : s.slug,
              }))
            }
            required
          />
        </Field>
        <Field
          label="Profile URL"
          error={err("slug")}
          hint={`/doctors/${f.slug || "your-name"}`}
        >
          <input
            className="field"
            value={f.slug}
            onChange={(e) =>
              setF((s) => ({ ...s, slug: slugify(e.target.value) }))
            }
            required
          />
        </Field>
        <Field label="Credentials" error={err("credentials")} hint="e.g. MBBS, FCPS, SCE">
          <input
            className="field"
            value={f.credentials}
            onChange={(e) => setF((s) => ({ ...s, credentials: e.target.value }))}
          />
        </Field>
        <Field label="Specialties" hint="Comma separated" error={err("specialty")}>
          <input
            className="field"
            value={f.specialty}
            onChange={(e) => setF((s) => ({ ...s, specialty: e.target.value }))}
          />
        </Field>
        <Field label="Headline" error={err("headline")}>
          <input
            className="field"
            value={f.headline}
            onChange={(e) => setF((s) => ({ ...s, headline: e.target.value }))}
            placeholder="One line patients see first"
          />
        </Field>
        <Field label="About / bio" error={err("bio")}>
          <textarea
            className="field"
            rows={5}
            value={f.bio}
            onChange={(e) => setF((s) => ({ ...s, bio: e.target.value }))}
          />
        </Field>
        <FileUpload
          kind="photo"
          accept="image/png,image/jpeg,image/webp"
          label="Profile photo"
          hint="Square JPG/PNG/WEBP, up to 6 MB."
          currentUrl={f.photo_url || null}
        />
        <Field
          label="…or photo URL"
          error={err("photo_url")}
          hint="Alternative to uploading — paste a hosted image URL"
        >
          <input
            className="field"
            value={f.photo_url}
            onChange={(e) => setF((s) => ({ ...s, photo_url: e.target.value }))}
          />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="section-index">Location & consultations</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" error={err("city")}>
            <input
              className="field"
              value={f.city}
              onChange={(e) => setF((s) => ({ ...s, city: e.target.value }))}
              required
            />
          </Field>
          <Field label="Timezone" error={err("timezone")}>
            <input
              className="field"
              list="tz-list"
              value={f.timezone}
              onChange={(e) => setF((s) => ({ ...s, timezone: e.target.value }))}
              required
            />
            <datalist id="tz-list">
              {COMMON_TZ.map((tz) => (
                <option key={tz} value={tz} />
              ))}
            </datalist>
          </Field>
        </div>
        <Field label="Clinic name" error={err("clinic_name")}>
          <input
            className="field"
            value={f.clinic_name}
            onChange={(e) => setF((s) => ({ ...s, clinic_name: e.target.value }))}
          />
        </Field>
        <Field label="Clinic address" error={err("clinic_address")}>
          <input
            className="field"
            value={f.clinic_address}
            onChange={(e) =>
              setF((s) => ({ ...s, clinic_address: e.target.value }))
            }
          />
        </Field>
        <div className="flex gap-6">
          <Toggle
            label="Offer online consultations"
            checked={f.online_enabled}
            onChange={(v) => setF((s) => ({ ...s, online_enabled: v }))}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="section-index">Booking rules</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Fee (PKR)" error={err("consultation_fee_pkr")}>
            <input
              type="number"
              className="field"
              value={f.consultation_fee_pkr}
              onChange={(e) =>
                setF((s) => ({ ...s, consultation_fee_pkr: e.target.value }))
              }
            />
          </Field>
          <Field label="Slot length (min)" error={err("slot_duration_min")}>
            <input
              type="number"
              className="field"
              value={f.slot_duration_min}
              onChange={(e) =>
                setF((s) => ({ ...s, slot_duration_min: e.target.value }))
              }
            />
          </Field>
          <Field label="Buffer (min)" error={err("buffer_min")}>
            <input
              type="number"
              className="field"
              value={f.buffer_min}
              onChange={(e) =>
                setF((s) => ({ ...s, buffer_min: e.target.value }))
              }
            />
          </Field>
          <Field label="Min notice (hours)" error={err("min_notice_hours")}>
            <input
              type="number"
              className="field"
              value={f.min_notice_hours}
              onChange={(e) =>
                setF((s) => ({ ...s, min_notice_hours: e.target.value }))
              }
            />
          </Field>
          <Field label="Booking horizon (days)" error={err("booking_horizon_days")}>
            <input
              type="number"
              className="field"
              value={f.booking_horizon_days}
              onChange={(e) =>
                setF((s) => ({ ...s, booking_horizon_days: e.target.value }))
              }
            />
          </Field>
          <Field
            label="Cancellation notice (hours)"
            error={err("cancellation_notice_hours")}
          >
            <input
              type="number"
              className="field"
              value={f.cancellation_notice_hours}
              onChange={(e) =>
                setF((s) => ({
                  ...s,
                  cancellation_notice_hours: e.target.value,
                }))
              }
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="section-index">Payments & video</h2>
        <Field
          label="Bank transfer details"
          error={err("bank_details")}
          hint="Shown to patients who choose bank transfer"
        >
          <textarea
            className="field"
            rows={3}
            value={f.bank_details}
            onChange={(e) =>
              setF((s) => ({ ...s, bank_details: e.target.value }))
            }
            placeholder={"Bank: …\nAccount title: …\nIBAN: …"}
          />
        </Field>
        <Field
          label="Standing meeting link"
          error={err("standing_meet_link")}
          hint="Used as a fallback if automatic Google Meet creation is unavailable"
        >
          <input
            className="field"
            value={f.standing_meet_link}
            onChange={(e) =>
              setF((s) => ({ ...s, standing_meet_link: e.target.value }))
            }
          />
        </Field>
        <Field
          label="Google Calendar ID"
          error={err("google_calendar_id")}
          hint="Optional — defaults to the platform scheduler calendar"
        >
          <input
            className="field"
            value={f.google_calendar_id}
            onChange={(e) =>
              setF((s) => ({ ...s, google_calendar_id: e.target.value }))
            }
          />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="section-index">Credentials &amp; verification</h2>
        <div className="flex items-center gap-2 text-sm">
          Status:
          {doctor.verified ? (
            <span className="badge border-ok bg-ok-tint text-ok">Verified</span>
          ) : doctor.license_path ? (
            <span className="badge border-warn bg-warn-tint text-warn">
              Under review
            </span>
          ) : (
            <span className="badge border-line text-ink-faint">
              Not submitted
            </span>
          )}
        </div>
        <Field
          label="Licence / registration number"
          error={err("license_number")}
          hint="e.g. PMDC / PMC registration number"
        >
          <input
            className="field"
            value={f.license_number}
            onChange={(e) =>
              setF((s) => ({ ...s, license_number: e.target.value }))
            }
          />
        </Field>
        <FileUpload
          kind="license"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          label="Licence document"
          hint="Private — visible only to platform admins. Re-uploading resets verification."
          currentUrl={doctor.license_path ? "on-file" : null}
        />
      </section>

      {result?.error && <p className="text-sm text-danger">{result.error}</p>}
      {result?.ok && mode === "edit" && (
        <p className="text-sm text-ok">Saved.</p>
      )}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending && <Loader2 size={16} className="animate-spin" />}
        {mode === "onboarding" ? "Save and continue" : "Save changes"}
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {hint && !error && (
        <span className="mt-1 block text-xs text-ink-faint">{hint}</span>
      )}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
