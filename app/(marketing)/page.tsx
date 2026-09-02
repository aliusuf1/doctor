import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Section } from "@/components/marketing/section";
import { PhotoFrame } from "@/components/marketing/photo-frame";
import { Marquee } from "@/components/marketing/marquee";
import { Accordion } from "@/components/marketing/accordion";
import { NextAvailableStrip } from "@/components/marketing/next-available-strip";
import { AvailabilityExplorer } from "@/components/marketing/availability-explorer";
import { TriageWizard } from "@/components/marketing/triage-wizard";
import {
  CARE_AREAS,
  CARE_AREA_DETAIL,
  CLINICAL_NETWORK,
  FAQ,
  HOW_IT_WORKS,
  site,
} from "@/lib/site";
import { listPublishedInsights } from "@/lib/data/insights";

export const revalidate = 300;

const CREDENTIALS = [
  "MBBS, FCPS and SCE (Dermatology)",
  "Consultant Dermatologist, Memon Medical Institute",
  "Assistant Professor of Dermatology",
  "Clinical practice at Abbasi Shaheed Hospital",
];

export default async function HomePage() {
  const insights = await listPublishedInsights({ limit: 3 });

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-pine text-on-dark">
        <div className="shell grid items-center gap-10 py-12 md:grid-cols-[1.15fr_0.85fr] md:gap-14 md:py-16">
          <div className="intro">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-flare">
              {site.doctorCredentials} · {site.city} &amp; online
            </p>
            <h1 className="display mt-4 text-[clamp(2.7rem,7vw,5.2rem)] font-extrabold">
              Clear answers.
              <br />
              <span className="text-flare">Healthier skin.</span>
            </h1>
            <p className="mt-7 max-w-md text-[1.05rem] leading-relaxed text-on-dark-soft">
              Specialist care for skin, hair and nail concerns with Dr. Sana
              Siddiqui — careful assessment, realistic expectations, and a plan
              you can actually follow. See her real availability and book in
              minutes.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <Link href={site.bookHref} className="btn btn-primary">
                Book a consultation <ArrowRight size={16} />
              </Link>
              <Link href="/consultation" className="ulink">
                How it works
              </Link>
            </div>

            <div className="mt-8 border-t border-line-dark pt-6">
              <NextAvailableStrip />
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-line-dark pt-6">
              {[
                ["Online + in person", "Karachi clinic or video"],
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
              src="/dr-sana.avif"
              label="Dr. Sana Siddiqui"
              alt="Dr. Sana Siddiqui, Consultant Dermatologist"
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
            Trained &amp; practised at
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

      {/* ── Availability explorer (interactive) ─────────────────────── */}
      <Section
        title="See when Dr. Sana is free"
        lead="Her live calendar. Days with a dot have open times — pick one and it carries straight into booking."
      >
        <AvailabilityExplorer onlineEnabled inPersonEnabled />
      </Section>

      {/* ── Meet Dr. Sana ───────────────────────────────────────────── */}
      <Section
        title="Meet Dr. Sana Siddiqui"
        lead="A consultant dermatologist whose work spans patient care and medical education. Her approach favours evidence, clarity and treatment plans patients can understand and follow."
      >
        <div className="grid gap-8 md:grid-cols-[13rem_1fr] md:items-start">
          <PhotoFrame
            src="/dr-sana.avif"
            label="Dr. Sana Siddiqui"
            alt="Dr. Sana Siddiqui"
            ratio="4 / 5"
            className="w-full max-w-[13rem]"
          />
          <div>
            <ul className="border-t border-line">
              {CREDENTIALS.map((c) => (
                <li
                  key={c}
                  className="flex gap-3 border-b border-line py-3 text-[0.95rem]"
                >
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-flare" />
                  {c}
                </li>
              ))}
            </ul>
            <blockquote className="mt-7 text-[1.15rem] font-medium leading-relaxed text-ink">
              &ldquo;Good dermatology is not about promising overnight results.
              It is the right diagnosis, a plan you understand, and steady
              progress you can trust.&rdquo;
            </blockquote>
            <Link
              href={site.bookHref}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold"
            >
              See availability &amp; book{" "}
              <ArrowRight size={15} className="text-flare" />
            </Link>
          </div>
        </div>
      </Section>

      {/* ── Triage wizard (interactive) ────────────────────────────── */}
      <Section
        title="Not sure what it is?"
        lead="Answer three quick questions. We'll suggest whether an online consultation fits and carry your answers into the booking."
      >
        <TriageWizard />
      </Section>

      {/* ── Conditions (interactive) ────────────────────────────────── */}
      <Section
        title="What we treat"
        lead="Common skin, hair and nail concerns Dr. Sana assesses. Open one to see what a consultation covers. Information supports — it does not replace — a consultation."
      >
        <Accordion
          items={CARE_AREAS.map((c) => ({
            key: c.n,
            title: c.title,
            content: (
              <div>
                <p>{c.body}</p>
                <ul className="mt-3 space-y-1.5">
                  {(CARE_AREA_DETAIL[c.n] ?? []).map((d) => (
                    <li key={d} className="flex gap-2">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-flare" />
                      {d}
                    </li>
                  ))}
                </ul>
                <Link
                  href={site.bookHref}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-flare"
                >
                  Book about this <ArrowRight size={14} className="text-flare" />
                </Link>
              </div>
            ),
          }))}
        />
        <p className="mt-5 text-sm text-ink-faint">
          Not sure where your concern fits? Describe it briefly when you book —
          Dr. Sana will assess it properly during the consultation.
        </p>
      </Section>

      {/* ── FAQ (interactive) ───────────────────────────────────────── */}
      <Section
        title="Questions, answered"
        lead="The things people ask before booking their first consultation."
      >
        <Accordion
          defaultOpen={FAQ[0].q}
          items={FAQ.map((f) => ({
            key: f.q,
            title: f.q,
            content: <p>{f.a}</p>,
          }))}
        />
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
            <Link href={site.bookHref} className="btn btn-primary">
              Book a consultation <ArrowRight size={16} />
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
