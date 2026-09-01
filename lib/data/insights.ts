import "server-only";
import { supabaseAnon } from "@/lib/supabase/anon";
import type { InsightRow } from "@/lib/db/types";

export type PublicInsight = Pick<
  InsightRow,
  | "slug"
  | "title"
  | "category"
  | "excerpt"
  | "body_md"
  | "read_minutes"
  | "cover_url"
  | "published_at"
>;

const COLUMNS =
  "slug, title, category, excerpt, body_md, read_minutes, cover_url, published_at";

export async function listPublishedInsights(
  opts: { limit?: number } = {},
): Promise<PublicInsight[]> {
  const sb = supabaseAnon();
  if (!sb) return [];
  let q = sb
    .from("public_insights")
    .select(COLUMNS)
    .order("published_at", { ascending: false });
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) {
    console.error("listPublishedInsights:", error.message);
    return [];
  }
  return (data ?? []) as PublicInsight[];
}

export async function getPublishedInsight(
  slug: string,
): Promise<PublicInsight | null> {
  const sb = supabaseAnon();
  if (!sb) return null;
  const { data, error } = await sb
    .from("public_insights")
    .select(COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("getPublishedInsight:", error.message);
    return null;
  }
  return (data as PublicInsight) ?? null;
}
