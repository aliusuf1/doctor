import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { HeroPortrait } from "@/components/marketing/hero-portrait";
import { Section, Accent } from "@/components/marketing/section";
import { InsightArt } from "@/components/marketing/insight-art";
import { CARE_AREAS, HOW_IT_WORKS, site } from "@/lib/site";
import { listPublishedInsights } from "@/lib/data/insights";

export const revalidate = 300;

const CREDENTIALS = [
  "MBBS, FCPS and SCE qualifications",
  "Consultant at Memon Medical Institute",
  "Assistant Professor of Dermatology",
  "Clinical practice at Abbasi Shaheed Hospital",
];

const AFFILIATIONS = [
  "Memon Medical Institute",
  "Abbasi Shaheed Hospital",
  "Karachi Medical & Dental College",
];

export default async function HomePage() {
  const insights = await listPublishedInsights({ limit: 3 });

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* split ground: cream left, sage right */}
        <div className="absolute inset-0 hidden md:block">
          <div className="h-full w-1/2 bg-panel" />
        </div>
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-mint/45 md:block" />

        <div className="shell relative grid items-center gap-12 py-14 md:grid-cols-2 md:gap-10 md:py-20">
          <div className="md:pr-10">
            <span className="eyebrow eyebrow-rule">
              Evidence-led dermatology • Karachi &amp; online
            </span>
            <h1 className="display mt-7 text-[3.2rem] leading-[0.9] sm:text-[4rem] md:text-[4.8rem]">
              Clear answers.
              <br />
              <Accent>Healthier skin.</Accent>
            </h1>
            <p className="prose-body mt-7 max-w-md font-serif text-[1.1rem] leading-[1.55]">
              Specialist care for skin, hair and nail concerns — grounded in
              careful assessment, realistic expectations and a plan made for you.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-8">
              <Link href={site.bookHref} className="link-arrow">
                Book a consultation <ArrowRight size={15} />
              </Link>
              <Link href="/consultation" className="ulink">
                How online consultation works
              </Link>
            </div>

            <dl className="mt-14 grid max-w-xl grid-cols-3 border-t border-line-strong/60 pt-6">
              {[
                ["MBBS, FCPS, SCE", "Specialist qualifications"],
                ["Academic + clinical", "Teaching and patient care"],
                ["Online consultations", "Convenient access"],
              ].map(([t, d], i) => (
                <div
                  key={t}
                  className={i > 0 ? "border-l border-line-strong/60 pl-5" : "pr-5"}
                >
                  <dt className="font-serif text-[0.95rem] text-forest">{t}</dt>
                  <dd className="mt-1.5 text-[0.72rem] leading-snug text-ink-faint">
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

      {/* ── Professional affiliations ───────────────────────────────── */}
      <div className="border-y border-line bg-white">
        <div className="shell flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-5">
          <span className="section-label text-tan">Professional affiliations</span>
          {AFFILIATIONS.map((n, i) => (
            <span key={n} className="flex items-center gap-6">
              {i > 0 && <span className="text-tan">•</span>}
              <span className="font-serif text-[0.95rem] text-forest">{n}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── 01 · A measured approach ────────────────────────────────── */}
      <Section
        id="about"
        index="01"
        label="A measured approach"
        title={
          <>
            Dermatology that
            <br />
            begins with <Accent>listening.</Accent>
          </>
        }
        lead={
          <>
            <p className="font-serif text-[1.15rem] leading-[1.5] text-ink">
              Skin concerns can affect comfort, confidence and everyday life. The
              right plan starts by understanding the complete picture — not by
              reaching for the quickest treatment.
            </p>
            <p className="mt-4">
              Dr. Sana combines academic expertise with clinical experience to
              assess each concern carefully, explain the options clearly and
              agree on a realistic course of care.
            </p>
            <Link href={site.bookHref} className="link-arrow mt-6">
              Meet Dr. Sana <ArrowRight size={14} />
            </Link>
          </>
        }
      />

      {/* ── 02 · Areas of care (dark) ──────────────────────────────── */}
      <Section
        tone="dark"
        index="02"
        label="Areas of care"
        title={
          <>
            Care for the concerns that
            <br />
            affect <Accent dark>you.</Accent>
          </>
        }
        lead="Browse the areas Dr. Sana assesses most often. This information supports — but does not replace — an individual medical consultation."
        leadAlign="bottom"
      >
        <div className="grid border border-line-on-dark sm:grid-cols-2 lg:grid-cols-3">
          {CARE_AREAS.map((c) => (
            <Link
              key={c.n}
              href={`${site.bookHref}?concern=${encodeURIComponent(c.title)}`}
              className="group flex min-h-[15rem] flex-col border-b border-r border-line-on-dark p-7 transition-colors last:border-b-0 hover:bg-white/[0.04]"
            >
              <span className="font-serif text-[0.8rem] text-tan">{c.n}</span>
              <h3 className="mt-5 font-serif text-[1.3rem] text-white">
                {c.title}
              </h3>
              <p className="mt-3 text-[0.82rem] leading-relaxed text-panel-on-dark/65">
                {c.body}
              </p>
              <span className="mt-auto flex justify-end pt-6">
                <span className="arrow-box">
                  <ArrowRight size={14} />
                </span>
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-center text-[0.85rem] text-panel-on-dark/70">
          Not sure where your concern fits?{" "}
          <Link
            href={site.bookHref}
            className="font-semibold text-white underline underline-offset-4"
          >
            Tell us briefly when requesting an appointment.
          </Link>
        </p>
      </Section>

      {/* ── 03 · Online consultation ───────────────────────────────── */}
      <section className="border-t border-line bg-bg py-16 md:py-24">
        <div className="shell grid items-center gap-12 md:grid-cols-2 md:gap-16">
          {/* left: mint panel with dark card */}
          <div className="relative grid place-items-center bg-mint/55 p-10 md:p-14">
            <div className="absolute size-[19rem] rounded-full bg-white/45" />
            <div className="relative w-full max-w-[17rem] bg-forest px-8 py-12 text-center">
              <span className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-panel-on-dark/70">
                Online consultation
              </span>
              <span className="mx-auto mt-8 grid size-[4.5rem] place-items-center rounded-full bg-panel-on-dark font-serif text-[1.5rem] text-forest">
                SS
              </span>
              <p className="mt-8 font-serif text-[1.2rem] leading-snug text-white">
                Private. Convenient.
                <br />
                Clinically focused.
              </p>
              <p className="mt-6 text-[0.72rem] text-panel-on-dark/70">
                Connect from wherever you are.
              </p>
            </div>
          </div>

          {/* right: copy + steps */}
          <div>
            <div className="flex items-baseline gap-4">
              <span className="section-index">03</span>
              <span className="section-label">Online consultation</span>
            </div>
            <h2 className="display mt-5 text-[2.1rem] sm:text-[2.6rem]">
              A specialist opinion,
              <br />
              <Accent>wherever you are.</Accent>
            </h2>
            <p className="prose-body mt-5 max-w-md text-[0.95rem]">
              Online consultation is a convenient first step for many visible
              skin concerns and for follow-ups. Some conditions still need an
              in-person examination, procedure or investigation; Dr. Sana will
              advise you when that is the case.
            </p>

            <ol className="mt-9 border-t border-line">
              {HOW_IT_WORKS.map((s, i) => (
                <li
                  key={s.n}
                  className="flex items-start gap-4 border-b border-line py-5"
                >
                  <span className="step-num">{i + 1}</span>
                  <div>
                    <h3 className="font-serif text-[1.05rem] text-forest">
                      {s.title}
                    </h3>
                    <p className="prose-body mt-1 text-[0.85rem]">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <Link href={site.bookHref} className="link-arrow mt-8">
              Request online consultation <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 04 · Experience & credentials ──────────────────────────── */}
      <section className="border-t border-line bg-panel py-16 md:py-24">
        <div className="shell grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <div className="flex items-baseline gap-4">
              <span className="section-index">04</span>
              <span className="section-label">Experience &amp; credentials</span>
            </div>
            <h2 className="display mt-5 text-[2.4rem] sm:text-[3.1rem]">
              Academic rigour.
              <br />
              <Accent>Human care.</Accent>
            </h2>
            <p className="prose-body mt-6 max-w-md text-[0.95rem]">
              Dr. Sana Siddiqui is a consultant dermatologist whose work spans
              patient care and medical education. Her approach favours evidence,
              clarity and treatment plans that patients can understand and
              follow.
            </p>

            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {CREDENTIALS.map((c) => (
                <li key={c} className="flex gap-2.5 text-[0.85rem] text-forest">
                  <Check size={14} className="mt-0.5 shrink-0 text-tan" />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          {/* quote card */}
          <figure className="self-start bg-green px-9 py-10 md:px-11 md:py-12">
            <span className="block font-serif text-[2.4rem] leading-none text-tan">
              &ldquo;
            </span>
            <blockquote className="mt-5 font-serif text-[1.3rem] italic leading-[1.45] text-white">
              Good dermatology is not about promising overnight results. It is
              about the right diagnosis, a plan you understand and steady
              progress you can trust.
            </blockquote>
            <figcaption className="mt-6 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-panel-on-dark/70">
              Dr. Sana Siddiqui
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── 05 · Dermatology insights ──────────────────────────────── */}
      {insights.length > 0 && (
        <Section
          index="05"
          label="Dermatology insights"
          title={
            <>
              Useful answers, without
              <br />
              the <Accent>noise.</Accent>
            </>
          }
          lead="Clear, medically reviewed guidance for common skin, hair and nail questions."
          leadAlign="bottom"
        >
          <div className="grid gap-8 md:grid-cols-3">
            {insights.map((a, i) => (
              <Link
                key={a.slug}
                href={`/insights/${a.slug}`}
                className="group border-b border-line pb-6"
              >
                <InsightArt index={i} category={a.category} />
                <p className="mt-5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-tan">
                  {a.category} • {a.read_minutes} min read
                </p>
                <h3 className="mt-2.5 font-serif text-[1.35rem] leading-snug text-forest group-hover:text-green">
                  {a.title}
                </h3>
                <p className="prose-body mt-2.5 text-[0.85rem]">{a.excerpt}</p>
                <span className="link-arrow mt-5 text-[0.8rem]">
                  Read the guide <ArrowRight size={13} />
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* ── 06 · Request an appointment ────────────────────────────── */}
      <Section
        id="book"
        tone="panel"
        index="06"
        label="Request an appointment"
        title={
          <>
            Ready for a clearer
            <br />
            way <Accent>forward?</Accent>
          </>
        }
        lead="Choose a time that genuinely works, see the consultation fee before you commit, and get an instant confirmation with a secure video link."
        leadAlign="bottom"
      >
        <div className="grid gap-8 border-y border-line py-9 sm:grid-cols-3">
          {[
            [
              "No diagnosis by form",
              "Your concern is assessed during the consultation.",
            ],
            [
              "Clear confirmation",
              "Fee and logistics are shown before you book.",
            ],
            [
              "Not for emergencies",
              "Seek urgent local medical care when needed.",
            ],
          ].map(([t, d]) => (
            <div key={t}>
              <p className="font-serif text-[1.05rem] text-forest">{t}</p>
              <p className="prose-body mt-1.5 text-[0.85rem]">{d}</p>
            </div>
          ))}
        </div>
        <Link href={site.bookHref} className="btn btn-primary mt-9">
          Book a consultation <ArrowRight size={15} />
        </Link>
      </Section>
    </>
  );
}
