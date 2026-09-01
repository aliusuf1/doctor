import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Prose } from "@/components/marketing/prose";
import { getPublishedInsight } from "@/lib/data/insights";
import { site } from "@/lib/site";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: PageProps<"/insights/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedInsight(slug);
  if (!article) return { title: "Article not found" };
  return { title: article.title, description: article.excerpt };
}

export default async function InsightPage({
  params,
}: PageProps<"/insights/[slug]">) {
  const { slug } = await params;
  const article = await getPublishedInsight(slug);
  if (!article) notFound();

  return (
    <article className="shell max-w-2xl py-16 md:py-24">
      <Link
        href="/insights"
        className="inline-flex items-center gap-1.5 text-sm text-ink-faint hover:text-green"
      >
        <ArrowLeft size={14} /> All insights
      </Link>

      <span className="badge mt-8 border-tan-soft text-tan">
        {article.category}
      </span>
      <h1 className="display mt-4 text-3xl md:text-[2.6rem]">{article.title}</h1>
      <p className="mt-3 text-sm text-ink-faint">
        {article.read_minutes} min read · Medically reviewed
      </p>

      <div className="hairline my-8" />
      <Prose md={article.body_md} />

      <div className="mt-12 rounded-lg border border-line bg-cream-deep p-6 text-sm text-ink-soft">
        This article is general information and not a diagnosis.{" "}
        {site.legal.infoOnly}{" "}
        <Link href="/doctors" className="font-medium text-green underline">
          Book a consultation
        </Link>{" "}
        for advice specific to you.
      </div>
    </article>
  );
}
