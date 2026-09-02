import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-panel">
      <div className="shell grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full border border-green/60 font-serif text-xs text-green">
              SS
            </span>
            <span className="leading-tight">
              <span className="block font-serif text-forest">{site.name}</span>
              <span className="block text-[0.56rem] font-bold uppercase tracking-[0.2em] text-ink-faint">
                {site.doctorTitle}
              </span>
            </span>
          </div>
          <p className="prose-body mt-4 max-w-xs text-sm">{site.tagline}</p>
        </div>

        <FooterCol
          title="Explore"
          links={[
            { label: "About", href: "/#about" },
            { label: "Conditions", href: "/conditions" },
            { label: "Online consultation", href: "/consultation" },
            { label: "Insights", href: "/insights" },
          ]}
        />
        <FooterCol
          title="Appointments"
          links={[
            { label: "Online consultation", href: site.bookHref },
            { label: "In-person visit", href: site.bookHref },
            { label: `${site.city}, ${site.country}`, href: site.bookHref },
          ]}
        />
        <FooterCol
          title="Important"
          links={[
            { label: "Privacy notice", href: "/privacy" },
            { label: "Medical disclaimer", href: "/disclaimer" },
            { label: "Clinic login", href: "/dashboard" },
          ]}
        />
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col gap-1 py-5 text-xs text-ink-faint md:flex-row md:items-center md:justify-between">
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
      <h3 className="section-label">{title}</h3>
      <ul className="mt-4 space-y-2 text-sm">
        {links.map((l, i) => (
          <li key={`${l.href}-${i}`}>
            <Link
              href={l.href}
              className="text-ink-soft transition-colors hover:text-green"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
