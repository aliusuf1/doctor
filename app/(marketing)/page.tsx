import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { HeroPortrait } from "@/components/marketing/hero-portrait";
import { initials } from "@/lib/utils";
import { NumberedSection } from "@/components/marketing/numbered-section";
import { ButtonLink } from "@/components/ui/button";
import { CARE_AREAS, HOW_IT_WORKS, site } from "@/lib/site";
import { listPublicDoctors } from "@/lib/data/doctors";
import { listPublishedInsights } from "@/lib/data/insights";

export const revalidate = 300;

export default async function HomePage() {
  const [doctors, insights] = await Promise.all([
    listPublicDoctors({ limit: 3 }),
    listPublishedInsights({ limit: 3 }),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="bg-paper">
        <div className="shell grid items-start gap-10 py-12 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-10 md:py-16">
          <div>
            <span className="eyebrow eyebrow-rule">
              Evidence-led dermatology · Karachi &amp; online
            </span>
            <h1 className="display mt-7 text-[3.4rem] leading-[0.98] sm:text-[4rem] md:text-[4.8rem]">
              Clear answers.
              <br />
              <span className="italic text-green">Healthier skin.</span>
            </h1>
            <p className="prose-body mt-7 max-w-md text-[1.12rem]">
              Specialist care for skin, hair and nail concerns — grounded in
              careful assessment, realistic expectations and a plan built for
              you. Book a verified dermatologist with real-time availability.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-7">
              <Link href="/doctors" className="link-arrow">
                Book a consultation <ArrowRight size={15} />
              </Link>
              <Link
                href="/consultation"
                className="u-sans text-[0.9rem] text-ink-soft underline decoration-line-strong underline-offset-[5px] transition-colors hover:text-green hover:decoration-green"
              >
                How online consultation works
              </Link>
            </div>

            <dl className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-6">
              {[
                ["Verified specialists", "Credentials checked before listing"],
                ["Online + in person", "Convenient access, your choice"],
                ["Instant confirmation", "Live calendar, not a callback"],
              ].map(([t, d]) => (
                <div key={t}>
                  <dt className="u-sans text-[0.82rem] font-semibold">{t}</dt>
                  <dd className="u-sans mt-1 text-[0.72rem] leading-snug text-ink-faint">
                    {d}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex justify-center md:justify-end">
            <HeroPortrait />
          </div>
        </div>
      </section>

      {/* Affiliations strip */}
      <div className="border-y border-line bg-cream">
        <div className="shell flex flex-wrap items-center gap-x-10 gap-y-2 py-4">
          <span className="u-sans text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-tan">
            Professional affiliations
          </span>
          {[
            "Memon Medical Institute",
            "Abbasi Shaheed Hospital",
            "Karachi Medical & Dental College",
          ].map((n) => (
            <span
              key={n}
              className="u-sans text-[0.72rem] font-medium uppercase tracking-[0.12em] text-ink-faint"
            >
              {n}
            </span>
          ))}
        </div>
      </div>

      {/* 01 — Approach */}
      <NumberedSection
        index="01"
        eyebrow="A measured approach"
        title="Dermatology that begins with listening."
        intro={
          <>
            <p>
              Skin concerns affect comfort, confidence and everyday life. The
              right plan starts by understanding the complete picture — not by
              reaching for the quickest treatment.
            </p>
            <p className="mt-4">
              Every specialist on {site.shortName} works the same way: assess
              carefully, explain the options plainly, and agree on a realistic
              course of care you can actually follow.
            </p>
          </>
        }
      />

      {/* 02 — Areas of care */}
      <NumberedSection
        index="02"
        eyebrow="Areas of care"
        title="Care for the concerns that affect you."
        intro="Common areas our dermatologists assess. This information supports — it does not replace — an individual medical consultation."
      >
        <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {CARE_AREAS.map((c) => (
            <div key={c.n} className="bg-paper p-6">
              <span className="section-index">{c.n}</span>
              <h3 className="mt-3 font-serif text-xl">{c.title}</h3>
              <p className="prose-body mt-2 text-sm">{c.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-ink-faint">
          Not sure where your concern fits? Describe it briefly when you request
          an appointment.
        </p>
      </NumberedSection>

      {/* 03 — Online consultation */}
      <NumberedSection
        index="03"
        eyebrow="Online consultation"
        title="A specialist opinion, wherever you are."
        intro="Online consultation is a convenient first step for many visible skin concerns and follow-ups. Some conditions still need an in-person examination or procedure; your dermatologist will tell you when that applies."
      >
        <ol className="grid gap-6 sm:grid-cols-3">
          {HOW_IT_WORKS.map((s) => (
            <li key={s.n} className="card p-6">
              <span className="grid size-8 place-items-center rounded-full bg-green text-paper text-sm">
                {s.n}
              </span>
              <h3 className="mt-4 font-serif text-lg">{s.title}</h3>
              <p className="prose-body mt-2 text-sm">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8">
          <ButtonLink href="/doctors">
            Request online consultation <ArrowRight size={16} />
          </ButtonLink>
        </div>
      </NumberedSection>

      {/* 04 — Featured specialists */}
      <NumberedSection
        index="04"
        eyebrow="Our specialists"
        title="Verified dermatologists, real availability."
        intro="Each specialist manages their own calendar. What you see here is what is genuinely open."
      >
        {doctors.length === 0 ? (
          <div className="card p-8 text-sm text-ink-faint">
            Specialists are being onboarded. Check back shortly, or{" "}
            <Link href="/sign-up" className="underline">
              join as a specialist
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((d) => (
              <Link
                key={d.slug}
                href={`/doctors/${d.slug}`}
                className="card group p-6 transition-colors hover:border-green"
              >
                <div className="flex items-center gap-3">
                  {d.photo_url ? (
                    <Image
                      src={d.photo_url}
                      alt={d.full_name}
                      width={44}
                      height={44}
                      className="size-11 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid size-11 place-items-center rounded-full bg-green-tint font-serif text-green">
                      {initials(d.full_name)}
                    </span>
                  )}
                  <div>
                    <h3 className="font-serif text-lg leading-tight">
                      {d.full_name}
                    </h3>
                    <p className="text-xs text-ink-faint">{d.credentials}</p>
                  </div>
                </div>
                <p className="prose-body mt-4 line-clamp-3 text-sm">
                  {d.headline}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm text-green group-hover:underline">
                  View availability <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        )}
        <div className="mt-8">
          <ButtonLink href="/doctors" variant="outline">
            Browse all specialists
          </ButtonLink>
        </div>
      </NumberedSection>

      {/* 05 — Insights */}
      <NumberedSection
        index="05"
        eyebrow="Dermatology insights"
        title="Useful answers, without the noise."
        intro="Clear, medically reviewed guidance for common skin, hair and nail questions."
      >
        {insights.length === 0 ? (
          <p className="text-sm text-ink-faint">Articles coming soon.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-3">
            {insights.map((a) => (
              <Link
                key={a.slug}
                href={`/insights/${a.slug}`}
                className="card group p-6 transition-colors hover:border-green"
              >
                <span className="badge border-tan-soft text-tan">
                  {a.category}
                </span>
                <h3 className="mt-3 font-serif text-lg leading-snug">
                  {a.title}
                </h3>
                <p className="prose-body mt-2 line-clamp-3 text-sm">
                  {a.excerpt}
                </p>
                <span className="mt-4 block text-xs text-ink-faint">
                  {a.read_minutes} min read
                </span>
              </Link>
            ))}
          </div>
        )}
      </NumberedSection>

      {/* 06 — CTA */}
      <section className="border-t border-line bg-green py-20 text-paper md:py-28">
        <div className="shell grid gap-8 md:grid-cols-[7rem_1fr] md:gap-14">
          <span className="section-index">06</span>
          <div>
            <h2 className="display max-w-2xl text-3xl text-paper md:text-[2.6rem]">
              Ready for a clearer way forward?
            </h2>
            <p className="mt-5 max-w-xl text-paper/80">
              Choose a specialist, pick a time that genuinely works, and get
              instant confirmation with a secure video link.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <ButtonLink
                href="/doctors"
                className="bg-paper text-green hover:bg-white"
              >
                Find a specialist <ArrowRight size={16} />
              </ButtonLink>
              <ButtonLink
                href="/consultation"
                variant="outline"
                className="border-paper/40 text-paper hover:border-paper hover:text-paper"
              >
                What to expect
              </ButtonLink>
            </div>
            <p className="mt-8 text-xs text-paper/60">{site.legal.notEmergency}</p>
          </div>
        </div>
      </section>
    </>
  );
}
