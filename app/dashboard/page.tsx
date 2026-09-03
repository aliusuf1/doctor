import Link from "next/link";
import { DateTime } from "luxon";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { getDoctorAccount } from "@/lib/data/doctor-account";
import { supabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase/admin";
import { formatPkr } from "@/lib/utils";
import { OnboardingForm } from "@/components/dashboard/onboarding-form";
import { LiveAppointments } from "@/components/dashboard/live-appointments";
import type { AppointmentRow } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export default async function DashboardOverview() {
  const account = await getDoctorAccount();
  if (!account?.doctor) {
    return (
      <p className="text-sm text-ink-faint">
        Could not load your specialist record. Check Supabase configuration.
      </p>
    );
  }

  const { doctor, needsOnboarding } = account;

  if (needsOnboarding) {
    return (
      <div>
        <h1 className="display text-3xl">Welcome to {" "}the network</h1>
        <p className="prose-body mt-2 max-w-xl text-sm">
          Complete your profile to go live. You can change any of this later from
          Profile &amp; settings.
        </p>
        <div className="mt-8">
          <OnboardingForm doctor={doctor} />
        </div>
      </div>
    );
  }

  let upcoming: AppointmentRow[] = [];
  let pendingPayment = 0;
  let history: Pick<AppointmentRow, "status" | "starts_at" | "fee_pkr">[] = [];
  let pulse = { total: 0, pending: 0, latest: null as string | null };
  if (hasSupabaseAdmin()) {
    const sb = supabaseAdmin();
    const since = DateTime.now().minus({ weeks: 8 }).startOf("week").toISO()!;
    const [{ data: up }, { count }, { data: hist }] = await Promise.all([
      sb
        .from("appointments")
        .select("*")
        .eq("doctor_id", doctor.id)
        .in("status", ["confirmed", "pending_payment"])
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(6),
      sb
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("doctor_id", doctor.id)
        .eq("status", "pending_payment")
        .eq("payment_status", "submitted"),
      sb
        .from("appointments")
        .select("status, starts_at, fee_pkr")
        .eq("doctor_id", doctor.id)
        .gte("starts_at", since),
    ]);
    upcoming = (up ?? []) as AppointmentRow[];
    pendingPayment = count ?? 0;
    history = (hist ?? []) as typeof history;

    const [{ count: total }, { data: latest }] = await Promise.all([
      sb
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("doctor_id", doctor.id),
      sb
        .from("appointments")
        .select("updated_at")
        .eq("doctor_id", doctor.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    pulse = {
      total: total ?? 0,
      pending: pendingPayment,
      latest: (latest?.updated_at as string | undefined) ?? null,
    };
  }

  // 8-week rollup
  const weeks = Array.from({ length: 8 }, (_, i) =>
    DateTime.now().minus({ weeks: 7 - i }).startOf("week"),
  );
  const weekly = weeks.map((w) => {
    const end = w.plus({ weeks: 1 });
    const inWeek = history.filter((h) => {
      const t = DateTime.fromISO(h.starts_at);
      return t >= w && t < end && h.status !== "cancelled";
    });
    return { label: w.toFormat("d LLL"), count: inWeek.length };
  });
  const maxWeek = Math.max(1, ...weekly.map((w) => w.count));
  const revenue = history
    .filter((h) => h.status === "completed")
    .reduce((s, h) => s + (h.fee_pkr ?? 0), 0);
  const done = history.filter((h) =>
    ["completed", "no_show"].includes(h.status),
  ).length;
  const noShows = history.filter((h) => h.status === "no_show").length;
  const noShowRate = done > 0 ? Math.round((noShows / done) * 100) : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-3xl">Overview</h1>
        <div className="flex items-center gap-3">
          {!doctor.is_active && (
            <span className="badge border-warn bg-warn-tint text-warn">
              <AlertTriangle size={13} /> Listing paused
            </span>
          )}
          <LiveAppointments initial={pulse} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Revenue (completed, 8 wks)"
          value={formatPkr(revenue)}
        />
        <Stat label="No-show rate (8 wks)" value={`${noShowRate}%`} />
        <Stat
          label="Receipts to verify"
          value={String(pendingPayment)}
          href="/dashboard/appointments?filter=pending"
        />
      </div>

      <div className="mt-4 rounded-lg border border-line bg-paper p-5">
        <p className="text-xs uppercase tracking-wide text-ink-faint">
          Bookings per week
        </p>
        <div className="mt-4 flex items-end gap-2" style={{ height: 96 }}>
          {weekly.map((w) => (
            <div
              key={w.label}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div
                className="w-full rounded-t bg-green"
                style={{
                  height: `${Math.max(4, (w.count / maxWeek) * 76)}px`,
                }}
                title={`${w.count} booking${w.count === 1 ? "" : "s"}`}
              />
              <span className="text-[0.6rem] text-ink-faint">{w.label}</span>
            </div>
          ))}
        </div>
      </div>

      {pendingPayment > 0 && (
        <Link
          href="/dashboard/appointments?filter=pending"
          className="mt-4 flex items-center gap-2 rounded-lg border border-warn bg-warn-tint px-4 py-3 text-sm text-warn"
        >
          <AlertTriangle size={16} />
          {pendingPayment} payment {pendingPayment === 1 ? "receipt" : "receipts"}{" "}
          waiting for your review
          <ArrowRight size={14} className="ml-auto" />
        </Link>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="section-index">Next appointments</h2>
          <Link
            href="/dashboard/appointments"
            className="text-sm text-green hover:underline"
          >
            All appointments
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-paper p-6 text-sm text-ink-faint">
            No upcoming appointments yet. Set your{" "}
            <Link href="/dashboard/availability" className="underline">
              availability
            </Link>{" "}
            so patients can book.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-paper">
            {upcoming.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/dashboard/appointments?open=${a.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3 text-sm transition-colors hover:bg-cream"
                >
                  <span className="font-medium">
                    {DateTime.fromISO(a.starts_at)
                      .setZone(doctor.timezone)
                      .toFormat("ccc d LLL, h:mm a")}
                  </span>
                  <span className="text-ink-faint">
                    {a.mode === "online" ? "Online" : "In person"}
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      className={`badge ${
                        a.status === "confirmed"
                          ? "border-ok bg-ok-tint text-ok"
                          : "border-warn bg-warn-tint text-warn"
                      }`}
                    >
                      {a.status === "confirmed" ? "Confirmed" : "Pending payment"}
                    </span>
                    <ArrowRight size={14} className="text-ink-faint" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="rounded-lg border border-line bg-paper p-5">
      <p className="text-xs uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-1 font-serif text-2xl">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
