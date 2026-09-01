import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-green text-paper">
      <div className="shell grid gap-10 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full border border-paper/40 font-serif text-sm">
              N
            </span>
            <span className="font-serif text-lg">{site.name}</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper/70">
            {site.tagline}
          </p>
        </div>

        <div>
          <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-paper/60">
            Explore
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-paper/85">
            {site.nav.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="hover:underline">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-paper/60">
            For clinicians
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-paper/85">
            <li>
              <Link href="/sign-up" className="hover:underline">
                Join as a specialist
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:underline">
                Doctor login
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-paper/60">
            Important
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-paper/85">
            <li>
              <Link href="/privacy" className="hover:underline">
                Privacy notice
              </Link>
            </li>
            <li>
              <Link href="/disclaimer" className="hover:underline">
                Medical disclaimer
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-paper/15">
        <div className="shell flex flex-col gap-1 py-6 text-xs text-paper/60 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. {site.legal.notEmergency}
          </p>
          <p>{site.legal.infoOnly}</p>
        </div>
      </div>
    </footer>
  );
}
