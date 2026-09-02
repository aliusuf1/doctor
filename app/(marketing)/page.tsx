import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Section } from "@/components/marketing/section";
import { PhotoFrame } from "@/components/marketing/photo-frame";
import { Marquee } from "@/components/marketing/marquee";
import { CARE_AREAS, CLINICAL_NETWORK, HOW_IT_WORKS, site } from "@/lib/site";
import { listPublicDoctors } from "@/lib/data/doctors";
import { listPublishedInsights } from "@/lib/data/insights";
import { StarRating, VerifiedBadge, NextAvailable } from "@/components/ui/badges";
import { formatPkr } from "@/lib/utils";

export const revalidate = 300;

export default async function HomePage() {
  const [doctors, insights] = await Promise.all([
    listPublicDoctors({ limit: 3 }),
    listPublishedInsights({ limit: 3 }),
  ]);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-pine text-on-dark">
        <div className="shell grid items-center gap-10 py-12 md:grid-cols-[1.15fr_0.85fr] md:gap-14 md:py-16">
          <div className="intro">
            <h1 className="display text-[clamp(2.7rem,7vw,5.2rem)] font-extrabold">
              Specialist skin,
              <br />
              hair &amp; nail care,
              <br />
              <span className="text-flare">booked in minutes.</span>
            </h1>
            <p className="mt-7 max-w-md text-[1.05rem] leading-relaxed text-on-dark-soft">
              Choose a verified dermatologist, see the times they are genuinely
              free, and get an instant confirmation with a secure video link.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <Link href="/doctors" className="btn btn-primary">
                Find a specialist <ArrowRight size={16} />
              </Link>
              <Link href="/consultation" className="ulink">
                How it works
              </Link>
            </div>
            <dl className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-line-dark pt-6">
              {[
                ["Verified", "Credentials checked"],
                ["Instant", "Live calendar, no callback"],
                ["Secure", "Google Meet auto-generated"],
              ].map(([t, d]) => (
                <div key={t}>
                  <dt className="text-[0.85rem] font-semibold text-on-dark">
                    {t}
                  </dt>
                  <dd className="mt-1 text-[0.72rem] leading-snug text-on-dark-faint">
                    {d}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <PhotoFrame
              label="dermatology consultation"
              alt="A dermatology consultation"
              tone="dark"
              ratio="4 / 5"
              priority
              className="mx-auto w-full max-w-xs md:ml-auto md:mr-0"
            />
          </div>
        </div>
      </section>

      {/* ── Trust strip (marquee) ───────────────────────────────────── */}
      <div className="border-b border-line bg-paper-2 py-5">
        <div className="shell flex items-center gap-6">
          <span className="label shrink-0 text-flare">
            Trusted clinical network
          </span>
          <Marquee items={CLINICAL_NETWORK} className="min-w-0 flex-1" />
        </div>
      </div>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <Section
        title="How a consultation works"
        lead="Three steps, no phone tag. The fee is shown before you commit to anything."
      >
        <ol className="divide-y divide-line border-y border-line">
          {HOW_IT_WORKS.map((s) => (
            <li key={s.n} className="flex gap-6 py-7">
              <span className="display shrink-0 text-[2.4rem] font-extrabold leading-none text-flare">
                {s.n}
              </span>
              <div>
                <h3 className="display text-xl font-bold">{s.title}</h3>
                <p className="prose-body mt-1.5 max-w-lg text-[0.95rem]">
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── Conditions ───────────────────────────────────────────────── */}
      <Section
        title="What we treat"
        lead="Common skin, hair and nail concerns our dermatologists assess. Information supports — it does not replace — a consultation."
      >
        <div className="border-t border-line">
          {CARE_AREAS.map((c) => (
            <div
              key={c.n}
              className="group grid gap-1 border-b border-line py-5 md:grid-cols-[1fr_1.4fr] md:items-baseline md:gap-8"
            >
              <h3 className="display text-[1.4rem] font-bold transition-colors group-hover:text-flare md:text-[1.7rem]">
                {c.title}
              </h3>
              <p className="prose-body text-[0.92rem]">{c.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm text-ink-faint">
          Not sure where your concern fits? Describe it briefly when you book —
          your dermatologist will assess it properly.
        </p>
      </Section>

      {/* ── Specialists ──────────────────────────────────────────────── */}
      <Section
        title="Book a verified specialist"
        lead="Every dermatologist here manages their own calendar. What you see is genuinely open."
      >
        {doctors.length === 0 ? (
          <div className="card p-8 text-sm text-ink-faint">
            Specialists are being onboarded. Check back shortly, or{" "}
            <Link href="/sign-up" className="font-semibold text-flare underline">
              join as a specialist
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {doctors.map((d) => (
              <Link
                key={d.slug}
                href={`/doctors/${d.slug}`}
                className="card card-hover flex flex-col p-5"
              >
                <div className="flex items-start gap-4">
                  <PhotoFrame
                    src={d.photo_url}
                    label="specialist"
                    alt={d.full_name}
                    ratio="1 / 1"
                    className="w-16 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="display truncate text-lg font-bold">
                      {d.full_name}
                    </h3>
                    <p className="truncate text-xs text-ink-faint">
                      {d.credentials}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      {d.rating_count > 0 && (
                        <StarRating value={d.rating_avg} count={d.rating_count} />
                      )}
                      {d.verified && <VerifiedBadge compact />}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <NextAvailable
                    iso={d.next_available_at}
                    timezone={d.timezone}
                  />
                  <span className="text-xs font-semibold">
                    {formatPkr(d.consultation_fee_pkr)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
        <Link
          href="/doctors"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold"
        >
          Browse all specialists <ArrowRight size={15} className="text-flare" />
        </Link>
      </Section>

      {/* ── Insights ─────────────────────────────────────────────────── */}
      {insights.length > 0 && (
        <Section
          title="Plain answers, no noise"
          lead="Medically reviewed guidance for the questions people actually ask."
        >
          <ul className="border-t border-line">
            {insights.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/insights/${a.slug}`}
                  className="group flex items-start justify-between gap-6 border-b border-line py-6"
                >
                  <div>
                    <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-flare">
                      {a.category}
                    </span>
                    <h3 className="display mt-1 text-[1.3rem] font-bold group-hover:underline">
                      {a.title}
                    </h3>
                    <p className="prose-body mt-1 line-clamp-2 max-w-xl text-sm">
                      {a.excerpt}
                    </p>
                  </div>
                  <ArrowUpRight
                    size={22}
                    className="mt-1 shrink-0 text-ink-faint transition-colors group-hover:text-flare"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ── Closing CTA ──────────────────────────────────────────────── */}
      <section className="bg-pine text-on-dark">
        <div className="shell flex flex-col items-start gap-8 py-20 md:py-28">
          <h2 className="display max-w-3xl text-[clamp(2.2rem,5.5vw,4rem)] font-extrabold">
            A clear diagnosis and a plan you can follow. Start today.
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/doctors" className="btn btn-primary">
              Find a specialist <ArrowRight size={16} />
            </Link>
            <Link href="/consultation" className="btn btn-on-dark">
              What to expect
            </Link>
          </div>
          <p className="text-xs text-on-dark-faint">{site.legal.notEmergency}</p>
        </div>
      </section>
    </>
  );
}
