import type { Metadata } from "next";
import { CARE_AREAS, CARE_AREA_DETAIL, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Conditions we assess",
  description:
    "Common skin, hair and nail conditions assessed by dermatologists on Northline — acne, pigmentation, hair loss, eczema, psoriasis, skin infections and nail disorders.",
};

const DETAIL = CARE_AREA_DETAIL;

export default function ConditionsPage() {
  return (
    <>
      <section className="border-b border-line py-16 md:py-24">
        <div className="shell max-w-3xl">
          <h1 className="display text-[clamp(2.4rem,6vw,4.5rem)] font-extrabold">
            What we treat.
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
        </div>
      </section>
    </>
  );
}
