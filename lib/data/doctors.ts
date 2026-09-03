import "server-only";
import { supabaseAnon } from "@/lib/supabase/anon";
import type { PublicDoctor } from "@/lib/db/types";

const PUBLIC_COLUMNS =
  "slug, full_name, credentials, specialty, headline, bio, photo_url, clinic_name, city, timezone, consultation_fee_pkr, currency, slot_duration_min, online_enabled, verified, next_available_at, rating_avg, rating_count";

export type DoctorSort = "soonest" | "price" | "rating";

export async function listPublicDoctors(
  opts: {
    limit?: number;
    specialty?: string;
    city?: string;
    q?: string;
    sort?: DoctorSort;
  } = {},
): Promise<PublicDoctor[]> {
  const sb = supabaseAnon();
  if (!sb) return [];

  let q = sb.from("public_doctors").select(PUBLIC_COLUMNS);
  if (opts.specialty) q = q.contains("specialty", [opts.specialty]);
  if (opts.city) q = q.eq("city", opts.city);
  if (opts.q) {
    const term = `%${opts.q}%`;
    q = q.or(`full_name.ilike.${term},headline.ilike.${term},credentials.ilike.${term}`);
  }

  if (opts.sort === "price") q = q.order("consultation_fee_pkr", { nullsFirst: false });
  else if (opts.sort === "rating") q = q.order("rating_avg", { ascending: false });
  else if (opts.sort === "soonest")
    q = q.order("next_available_at", { ascending: true, nullsFirst: false });
  else q = q.order("verified", { ascending: false }).order("full_name");

  if (opts.limit) q = q.limit(opts.limit);

  const { data, error } = await q;
  if (error) {
    console.error("listPublicDoctors:", error.message);
    return [];
  }
  return (data ?? []) as PublicDoctor[];
}

export async function getPublicDoctor(
  slug: string,
): Promise<PublicDoctor | null> {
  const sb = supabaseAnon();
  if (!sb) return null;
  const { data, error } = await sb
    .from("public_doctors")
    .select(PUBLIC_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("getPublicDoctor:", error.message);
    return null;
  }
  return (data as PublicDoctor) ?? null;
}

export async function listDoctorFacets(): Promise<{
  specialties: string[];
  cities: string[];
}> {
  const sb = supabaseAnon();
  if (!sb) return { specialties: [], cities: [] };
  const { data } = await sb.from("public_doctors").select("specialty, city");
  const specialties = new Set<string>();
  const cities = new Set<string>();
  for (const row of (data ?? []) as { specialty: string[]; city: string }[]) {
    row.specialty?.forEach((s) => specialties.add(s));
    if (row.city) cities.add(row.city);
  }
  return {
    specialties: [...specialties].sort(),
    cities: [...cities].sort(),
  };
}

export async function listDoctorReviews(
  slug: string,
  limit = 8,
): Promise<{ rating: number; comment: string | null; patient_name: string; created_at: string }[]> {
  const sb = supabaseAnon();
  if (!sb) return [];
  const { data, error } = await sb
    .from("public_reviews")
    .select("rating, comment, patient_name, created_at")
    .eq("doctor_slug", slug)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("listDoctorReviews:", error.message);
    return [];
  }
  return (data ?? []) as {
    rating: number;
    comment: string | null;
    patient_name: string;
    created_at: string;
  }[];
}
