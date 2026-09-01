import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { CARE_AREAS, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Conditions we assess",
  description:
    "Common skin, hair and nail conditions assessed by dermatologists on Northline — acne, pigmentation, hair loss, eczema, psoriasis, skin infections and nail disorders.",
};

const DETAIL: Record<string, string[]> = {
  "01": [
    "Active inflammatory acne, comedonal acne and hormonal patterns.",
    "Post-inflammatory pigmentation and early scarring.",
    "Review of current products and prescription tolerance.",
  ],
  "02": [
    "Distinguishing melasma from post-inflammatory and other pigmentation.",
    "Identifying triggers: sun, heat, hormones and irritation.",
    "Staged plans that respect how your skin tolerates actives.",
  ],
  "03": [
    "Telogen effluvium, pattern hair loss and scalp inflammation.",
    "Which blood tests and scalp assessments are actually useful.",
    "Realistic timelines for regrowth and maintenance.",
  ],
  "04": [
    "Flare plans for eczema and psoriasis you can follow at home.",
    "Trigger identification and skin-barrier care.",
    "When to step up to systemic treatment and referral.",
  ],
  "05": [
    "Fungal, bacterial and viral skin presentations.",
    "When a swab, scraping or culture changes management.",
    "Clear guidance on contagion and household measures.",
  ],
  "06": [
    "Changes in nail colour, thickness, separation and shape.",
    "Fungal versus non-fungal causes.",
    "When a nail sample or imaging is warranted.",
  ],
};

export default function ConditionsPage() {
  return (
    <>
      <section className="border-b border-line py-16 md:py-24">
        <div className="shell max-w-3xl">
          <p className="eyebrow">Areas of care</p>
          <h1 className="display mt-5 text-4xl md:text-6xl">
            Care for the concerns that affect you.
          </h1>
          <p className="prose-body mt-6 text-lg">
            An overview of the areas our dermatologists commonly assess. This
            information supports — it does not replace — an individual medical
            consultation. {site.legal.notEmergency}
          </p>
        </div>
      </section>

      <div className="shell divide-y divide-line py-8">
        {CARE_AREAS.map((c) => (
          <section
            key={c.n}
            className="grid gap-6 py-12 md:grid-cols-[7rem_1fr]"
          >
            <span className="section-index">{c.n}</span>
            <div>
              <h2 className="font-serif text-2xl">{c.title}</h2>
              <p className="prose-body mt-3 max-w-2xl">{c.body}</p>
              <ul className="prose-body mt-5 grid max-w-2xl gap-2 text-sm">
                {DETAIL[c.n]?.map((d) => (
                  <li key={d} className="flex gap-2">
                    <span className="text-tan">—</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>

      <section className="border-t border-line bg-cream-deep py-16">
        <div className="shell flex flex-col items-start gap-4">
          <h2 className="font-serif text-2xl">Not sure where your concern fits?</h2>
          <p className="prose-body max-w-xl">
            Describe it briefly when you request an appointment. Your
            dermatologist will assess it properly during the consultation.
          </p>
          <ButtonLink href="/doctors">
            Find a specialist <ArrowRight size={16} />
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
