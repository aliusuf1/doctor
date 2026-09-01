import Link from "next/link";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  CalendarClock,
  CalendarDays,
  LayoutDashboard,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { getDoctorAccount } from "@/lib/data/doctor-account";
import { isConfigured } from "@/lib/env";
import { site } from "@/lib/site";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/availability", label: "Availability", icon: CalendarDays },
  {
    href: "/dashboard/appointments",
    label: "Appointments",
    icon: CalendarClock,
  },
  { href: "/dashboard/profile", label: "Profile & settings", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isConfigured.clerk) {
    return (
      <main className="shell flex min-h-screen flex-col items-center justify-center gap-3 text-center">
        <h1 className="font-serif text-2xl">Dashboard not configured</h1>
        <p className="prose-body max-w-md text-sm">
          Set the Clerk and Supabase environment variables (see{" "}
          <code>.env.example</code> and <code>SETUP.md</code>) to enable the
          specialist dashboard.
        </p>
        <Link href="/" className="btn btn-outline mt-2">
          Back to site
        </Link>
      </main>
    );
  }

  const account = await getDoctorAccount();
  if (!account) redirect("/sign-in");

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="border-b border-line bg-paper">
        <div className="shell flex items-center justify-between py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full border border-green font-serif text-xs text-green">
              N
            </span>
            <span className="font-serif">{site.name}</span>
            <span className="badge border-line text-ink-faint">Specialist</span>
          </Link>
          <div className="flex items-center gap-4">
            {account.role === "admin" && (
              <Link
                href="/dashboard/admin"
                className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-green"
              >
                <ShieldCheck size={15} /> Admin
              </Link>
            )}
            <Link
              href="/"
              className="text-sm text-ink-faint hover:text-green"
            >
              View site
            </Link>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="shell flex flex-1 flex-col gap-8 py-8 md:flex-row">
        <nav className="flex gap-1 md:w-52 md:flex-col">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className="flex items-center gap-2 rounded px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-green-tint hover:text-green"
              >
                <Icon size={16} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
