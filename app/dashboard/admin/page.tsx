import { redirect } from "next/navigation";
import { DateTime } from "luxon";
import { getDoctorAccount } from "@/lib/data/doctor-account";
import { supabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase/admin";
import { AdminDoctorRow } from "@/components/dashboard/admin-doctor-row";
import type { DoctorRow } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const account = await getDoctorAccount();
  if (!account) redirect("/sign-in");
  if (account.role !== "admin") {
    return (
      <p className="text-sm text-ink-faint">
        This area is for platform administrators only.
      </p>
    );
  }

  let doctors: DoctorRow[] = [];
  let counts = { appointments: 0, doctors: 0, upcoming: 0 };
  if (hasSupabaseAdmin()) {
    const sb = supabaseAdmin();
    const [{ data: docs }, { count: apptCount }, { count: upCount }] =
      await Promise.all([
        sb.from("doctors").select("*").order("created_at", { ascending: false }),
        sb.from("appointments").select("id", { count: "exact", head: true }),
        sb
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("status", "confirmed")
          .gte("starts_at", new Date().toISOString()),
      ]);
    doctors = (docs ?? []) as DoctorRow[];
    counts = {
      appointments: apptCount ?? 0,
      doctors: doctors.length,
      upcoming: upCount ?? 0,
    };
  }

  return (
    <div>
      <h1 className="display text-3xl">Admin</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Specialists", counts.doctors],
          ["Appointments (all time)", counts.appointments],
          ["Upcoming confirmed", counts.upcoming],
        ].map(([l, v]) => (
          <div key={l} className="rounded-lg border border-line bg-paper p-5">
            <p className="text-xs uppercase tracking-wide text-ink-faint">{l}</p>
            <p className="mt-1 font-serif text-2xl">{v}</p>
          </div>
        ))}
      </div>

      <h2 className="section-index mt-10">Specialists</h2>
      <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-paper">
        {doctors.map((d) => (
          <AdminDoctorRow
            key={d.id}
            id={d.id}
            name={d.full_name}
            slug={d.slug}
            active={d.is_active}
            onboarded={Boolean(d.onboarded_at)}
            verified={d.verified}
            hasLicense={Boolean(d.license_path)}
            joined={DateTime.fromISO(d.created_at).toFormat("d LLL yyyy")}
          />
        ))}
      </ul>
    </div>
  );
}
