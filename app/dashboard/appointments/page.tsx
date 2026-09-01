import { DateTime } from "luxon";
import { getDoctorAccount } from "@/lib/data/doctor-account";
import { supabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase/admin";
import { AppointmentsTable } from "@/components/dashboard/appointments-table";
import type { AppointmentRow, PatientRow } from "@/lib/db/types";

export const dynamic = "force-dynamic";

type Filter = "upcoming" | "pending" | "past" | "cancelled";

export default async function AppointmentsPage({
  searchParams,
}: PageProps<"/dashboard/appointments">) {
  const account = await getDoctorAccount();
  if (!account?.doctor) {
    return <p className="text-sm text-ink-faint">Could not load your record.</p>;
  }
  const sp = await searchParams;
  const filter: Filter =
    sp.filter === "pending" ||
    sp.filter === "past" ||
    sp.filter === "cancelled"
      ? sp.filter
      : "upcoming";

  let rows: (AppointmentRow & { patient: PatientRow | null })[] = [];
  if (hasSupabaseAdmin()) {
    const sb = supabaseAdmin();
    let q = sb
      .from("appointments")
      .select("*, patient:patients(*)")
      .eq("doctor_id", account.doctor.id);

    const nowIso = new Date().toISOString();
    if (filter === "upcoming")
      q = q
        .in("status", ["confirmed", "pending_payment"])
        .gte("starts_at", nowIso)
        .order("starts_at");
    else if (filter === "pending")
      q = q
        .eq("status", "pending_payment")
        .eq("payment_status", "submitted")
        .order("starts_at");
    else if (filter === "past")
      q = q
        .in("status", ["completed", "no_show", "confirmed"])
        .lt("starts_at", nowIso)
        .order("starts_at", { ascending: false });
    else q = q.eq("status", "cancelled").order("starts_at", { ascending: false });

    const { data } = await q.limit(200);
    rows = (data ?? []) as typeof rows;
  }

  const tabs: { key: Filter; label: string }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "pending", label: "Receipts to verify" },
    { key: "past", label: "Past" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div>
      <h1 className="display text-3xl">Appointments</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <a
            key={t.key}
            href={`/dashboard/appointments?filter=${t.key}`}
            className={`badge ${
              filter === t.key
                ? "border-green bg-green text-paper"
                : "border-line-strong"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      <div className="mt-6">
        {rows.length === 0 ? (
          <p className="rounded-lg border border-line bg-paper p-6 text-sm text-ink-faint">
            Nothing here.
          </p>
        ) : (
          <AppointmentsTable
            timezone={account.doctor.timezone}
            rows={rows.map((r) => ({
              id: r.id,
              startsAt: r.starts_at,
              mode: r.mode,
              status: r.status,
              paymentMethod: r.payment_method,
              paymentStatus: r.payment_status,
              hasProof: Boolean(r.payment_proof_path),
              meetLink: r.meet_link,
              concern: r.concern,
              feePkr: r.fee_pkr,
              patientName: r.patient?.full_name ?? "—",
              patientEmail: r.patient?.email ?? "",
              patientPhone: r.patient?.phone ?? "",
              startsAtLabel: DateTime.fromISO(r.starts_at)
                .setZone(account.doctor!.timezone)
                .toFormat("ccc d LLL yyyy, h:mm a"),
            }))}
          />
        )}
      </div>
    </div>
  );
}
