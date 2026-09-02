import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedInsights } from "@/lib/data/insights";

export const metadata: Metadata = {
  title: "Dermatology insights",
  description:
    "Clear, medically reviewed guidance for common skin, hair and nail questions.",
};

export const revalidate = 300;

export default async function InsightsPage() {
  const articles = await listPublishedInsights();

  return (
    <>
      <section className="border-b border-line py-16 md:py-24">
        <div className="shell max-w-3xl">
          <p className="label">Dermatology insights</p>
          <h1 className="display mt-5 text-4xl md:text-6xl">
            Useful answers, without the noise.
          </h1>
          <p className="prose-body mt-6 text-lg">
            Clear, medically reviewed guidance for common skin, hair and nail
            questions. Information supports, but does not replace, a consultation.
          </p>
        </div>
      </section>

      <div className="shell py-12">
        {articles.length === 0 ? (
          <p className="text-sm text-ink-faint">
            No articles published yet.
          </p>
        ) : (
          <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link
                key={a.slug}
                href={`/insights/${a.slug}`}
                className="group bg-paper p-7 transition-colors hover:bg-cream"
              >
                <span className="badge border-tan-soft text-tan">
                  {a.category}
                </span>
                <h2 className="mt-4 font-serif text-xl leading-snug group-hover:text-green">
                  {a.title}
                </h2>
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
      </div>
    </>
  );
}
