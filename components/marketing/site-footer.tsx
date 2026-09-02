import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-pine text-on-dark">
      <div className="shell py-16">
        <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <p className="display text-[2.4rem] font-extrabold leading-none tracking-[-0.04em]">
              {site.shortName}
              <span className="text-flare">.</span>
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-on-dark-soft">
              {site.tagline}
            </p>
          </div>

          <FooterCol
            title="Care"
            links={site.nav.map((n) => ({ label: n.label, href: n.href }))}
          />
          <FooterCol
            title="Clinicians"
            links={[
              { label: "Join as a specialist", href: "/sign-up" },
              { label: "Doctor login", href: "/dashboard" },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              { label: "Privacy notice", href: "/privacy" },
              { label: "Medical disclaimer", href: "/disclaimer" },
            ]}
          />
        </div>

        <div className="mt-14 flex flex-col gap-1 border-t border-line-dark pt-6 text-xs text-on-dark-faint md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. {site.legal.notEmergency}
          </p>
          <p>{site.legal.infoOnly}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-on-dark-faint">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-on-dark-soft transition-colors hover:text-on-dark"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
