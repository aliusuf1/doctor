import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search } from "lucide-react";
import {
  listPublicDoctors,
  listDoctorFacets,
  type DoctorSort,
} from "@/lib/data/doctors";
import { StarRating, VerifiedBadge, NextAvailable } from "@/components/ui/badges";
import { formatPkr, initials } from "@/lib/utils";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Find a specialist",
  description:
    "Browse verified dermatologists with real-time availability. Filter by specialty, city and consultation type.",
};

export const revalidate = 60;

export default async function DoctorsPage({
  searchParams,
}: PageProps<"/doctors">) {
  const sp = await searchParams;
  const specialty = typeof sp.specialty === "string" ? sp.specialty : undefined;
  const city = typeof sp.city === "string" ? sp.city : undefined;
  const mode =
    sp.mode === "online" || sp.mode === "in_person" ? sp.mode : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const sort: DoctorSort =
    sp.sort === "price" || sp.sort === "rating" ? sp.sort : "soonest";

  const [doctors, facets] = await Promise.all([
    listPublicDoctors({ specialty, city, mode, q, sort }),
    listDoctorFacets(),
  ]);

  const buildHref = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { specialty, city, mode, q, sort, ...patch };
    for (const [k, v] of Object.entries(merged)) {
      if (v && !(k === "sort" && v === "soonest")) next.set(k, v);
    }
    const qs = next.toString();
    return qs ? `/doctors?${qs}` : "/doctors";
  };

  const chip = (
    label: string,
    key: "specialty" | "city" | "mode",
    value: string,
    active: boolean,
  ) => (
    <Link
      key={`${key}:${value}`}
      href={buildHref({ [key]: active ? undefined : value })}
      className={`badge transition-colors ${
        active
          ? "border-green bg-green text-paper"
          : "border-line-strong hover:border-green"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <>
      <section className="border-b border-line py-14 md:py-20">
        <div className="shell max-w-3xl">
          <p className="eyebrow">Our specialists</p>
          <h1 className="display mt-5 text-4xl md:text-6xl">
            Verified dermatologists, real availability.
          </h1>
          <p className="prose-body mt-5 text-lg">
            Every specialist here manages their own calendar. What you see is
            what is genuinely open to book.
          </p>
        </div>
      </section>

      <div className="shell py-10">
        <form
          action="/doctors"
          className="mb-6 flex flex-wrap items-center gap-3"
        >
          <div className="relative flex-1 min-w-56">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by name or focus…"
              className="field pl-9"
            />
          </div>
          {specialty && <input type="hidden" name="specialty" value={specialty} />}
          {city && <input type="hidden" name="city" value={city} />}
          {mode && <input type="hidden" name="mode" value={mode} />}
          <select
            name="sort"
            defaultValue={sort}
            className="field w-auto"
          >
            <option value="soonest">Soonest available</option>
            <option value="rating">Highest rated</option>
            <option value="price">Lowest fee</option>
          </select>
          <button type="submit" className="btn btn-outline">
            Apply
          </button>
        </form>

        {(facets.specialties.length > 0 || facets.cities.length > 0) && (
          <div className="mb-8 flex flex-wrap gap-2">
            {facets.specialties.map((s) =>
              chip(s, "specialty", s, specialty === s),
            )}
            {facets.cities.map((c) => chip(c, "city", c, city === c))}
            {chip("Online", "mode", "online", mode === "online")}
            {chip("In person", "mode", "in_person", mode === "in_person")}
          </div>
        )}

        {doctors.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="font-serif text-xl">No specialists match yet</p>
            <p className="prose-body mx-auto mt-2 max-w-md text-sm">
              {site.name} is onboarding dermatologists. If you are a clinician,{" "}
              <Link href="/sign-up" className="underline">
                create an account
              </Link>{" "}
              to list your practice.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {doctors.map((d) => (
              <Link
                key={d.slug}
                href={`/doctors/${d.slug}`}
                className="card group flex flex-col p-6 transition-colors hover:border-green"
              >
                <div className="flex items-center gap-3">
                  {d.photo_url ? (
                    <Image
                      src={d.photo_url}
                      alt={d.full_name}
                      width={48}
                      height={48}
                      className="size-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid size-12 place-items-center rounded-full bg-green-tint font-serif text-green">
                      {initials(d.full_name)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate font-serif text-lg leading-tight">
                      {d.full_name}
                    </h2>
                    <p className="truncate text-xs text-ink-faint">
                      {d.credentials}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {d.rating_count > 0 && (
                    <StarRating value={d.rating_avg} count={d.rating_count} />
                  )}
                  {d.verified && <VerifiedBadge compact />}
                </div>

                <p className="prose-body mt-3 line-clamp-2 flex-1 text-sm">
                  {d.headline}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {d.specialty?.slice(0, 3).map((s) => (
                    <span key={s} className="badge border-line text-ink-faint">
                      {s}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <NextAvailable iso={d.next_available_at} timezone={d.timezone} />
                  <span className="text-xs font-medium">
                    {formatPkr(d.consultation_fee_pkr)}
                  </span>
                </div>

                <span className="mt-3 inline-flex items-center gap-1 text-sm text-green group-hover:underline">
                  View &amp; book <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
