import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import { ArrowLeft, CheckCircle2, Clock, Video, MapPin } from "lucide-react";
import { hasSupabaseAdmin } from "@/lib/supabase/admin";
import { loadAppointmentBundle } from "@/lib/data/appointments";
import { ManagePanel } from "@/components/booking/manage-panel";
import { ReviewForm } from "@/components/booking/review-form";
import { formatPkr } from "@/lib/utils";
import { site } from "@/lib/site";
import { env } from "@/lib/env";
import { waMeLink } from "@/lib/wa";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your booking",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending_payment: {
    label: "Awaiting payment",
    cls: "border-warn bg-warn-tint text-warn",
  },
  confirmed: { label: "Confirmed", cls: "border-ok bg-ok-tint text-ok" },
  completed: { label: "Completed", cls: "border-line bg-cream-deep text-ink-soft" },
  cancelled: { label: "Cancelled", cls: "border-danger bg-danger-tint text-danger" },
  no_show: { label: "Missed", cls: "border-danger bg-danger-tint text-danger" },
};

export default async function BookingManagePage({
  params,
}: PageProps<"/booking/[token]">) {
  const { token } = await params;

  if (!hasSupabaseAdmin()) notFound();
  const bundle = await loadAppointmentBundle({ token });
  if (!bundle) notFound();

  const { appointment: a, doctor: d, patient: p } = bundle;
  const tz = a.doctor_timezone || d.timezone;
  const start = DateTime.fromISO(a.starts_at).setZone(tz);
  const status = STATUS_LABEL[a.status] ?? STATUS_LABEL.pending_payment;
  const awaitingBank =
    a.status === "pending_payment" && a.payment_method === "bank_transfer";
  const waLink = waMeLink(
    env.clinicWhatsappNumber,
    `Hello, this is ${p.full_name} about my consultation with ${d.full_name} on ${start.toFormat(
      "d LLL, h:mm a",
    )} (ref ${a.id.slice(0, 8)}).`,
  );

  return (
    <main className="min-h-screen bg-cream py-12">
      <div className="shell max-w-xl">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft transition-colors hover:text-flare"
          >
            <ArrowLeft size={15} /> Back to homepage
          </Link>
          <span className="font-display text-sm font-bold">{site.name}</span>
        </div>

        <div className="card mt-6 overflow-hidden">
          <div className="border-b border-line bg-cream-deep px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="font-serif text-xl">Consultation with {d.full_name}</h1>
              <span className={`badge ${status.cls}`}>{status.label}</span>
            </div>
          </div>

          <div className="space-y-4 p-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-ink-faint" />
              {start.toFormat("cccc d LLLL yyyy, h:mm a")}{" "}
              <span className="text-ink-faint">({tz})</span>
            </div>
            <div className="flex items-center gap-2">
              {a.mode === "online" ? (
                <Video size={16} className="text-ink-faint" />
              ) : (
                <MapPin size={16} className="text-ink-faint" />
              )}
              {a.mode === "online"
                ? "Online video consultation"
                : `In person — ${d.clinic_name ?? d.city}`}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-ink-faint">Fee</span>
              {formatPkr(a.fee_pkr)}
            </div>

            {a.status === "confirmed" && a.mode === "online" && a.meet_link && (
              <a
                href={a.meet_link}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary w-full"
              >
                <Video size={16} /> Join Google Meet
              </a>
            )}

            {a.status === "confirmed" && a.mode === "online" && !a.meet_link && (
              <p className="rounded border border-warn bg-warn-tint px-3 py-2 text-xs text-warn">
                Your video link will appear here shortly before the appointment.
              </p>
            )}

            {(a.status === "confirmed" || a.status === "pending_payment") && (
              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href={`/api/bookings/${a.id}/calendar?token=${token}`}
                  className="btn btn-outline px-3 py-2 text-xs"
                >
                  Add to calendar
                </a>
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline px-3 py-2 text-xs"
                  >
                    Message the clinic on WhatsApp
                  </a>
                )}
              </div>
            )}

            {a.status === "confirmed" && (
              <p className="flex items-center gap-1.5 text-xs text-ok">
                <CheckCircle2 size={13} /> You&rsquo;ll get reminders by email
                {env.whatsappProvider !== "none" ? " and WhatsApp" : ""} before it
                starts.
              </p>
            )}
          </div>
        </div>

        {a.status === "completed" && (
          <div className="mt-6">
            <ReviewForm appointmentId={a.id} token={token} doctorName={d.full_name} />
          </div>
        )}

        <ManagePanel
          appointmentId={a.id}
          token={token}
          slug={d.slug}
          mode={a.mode}
          timezone={tz}
          status={a.status}
          paymentMethod={a.payment_method}
          paymentStatus={a.payment_status}
          hasProof={Boolean(a.payment_proof_path)}
          bankDetails={awaitingBank ? d.bank_details : null}
          cancellationNoticeHours={d.cancellation_notice_hours}
          startsAtIso={a.starts_at}
        />

        <div className="mt-8 flex justify-center">
          <Link href="/" className="btn btn-outline px-4 py-2 text-xs">
            <ArrowLeft size={14} /> Back to homepage
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-ink-faint">
          {site.legal.notEmergency}
        </p>
      </div>
    </main>
  );
}
