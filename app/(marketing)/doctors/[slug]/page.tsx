import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Video } from "lucide-react";
import { DateTime } from "luxon";
import { BookingWidget } from "@/components/booking/booking-widget";
import { WaitlistButton } from "@/components/booking/waitlist-button";
import {
  getPublicDoctor,
  listDoctorReviews,
} from "@/lib/data/doctors";
import { StarRating, VerifiedBadge, NextAvailable } from "@/components/ui/badges";
import { isConfigured } from "@/lib/env";
import { formatPkr, initials } from "@/lib/utils";
import { site } from "@/lib/site";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: PageProps<"/doctors/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const doctor = await getPublicDoctor(slug);
  if (!doctor) return { title: "Specialist not found" };
  return {
    title: `${doctor.full_name} — ${doctor.credentials ?? "Dermatologist"}`,
    description: doctor.headline ?? site.description,
  };
}

export default async function DoctorProfilePage({
  params,
}: PageProps<"/doctors/[slug]">) {
  const { slug } = await params;
  const [doctor, reviews] = await Promise.all([
    getPublicDoctor(slug),
    listDoctorReviews(slug),
  ]);
  if (!doctor) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: doctor.full_name,
    medicalSpecialty: doctor.specialty,
    address: {
      "@type": "PostalAddress",
      addressLocality: doctor.city,
      addressCountry: site.country,
    },
    ...(doctor.rating_count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: doctor.rating_avg,
            reviewCount: doctor.rating_count,
          },
        }
      : {}),
    priceRange: doctor.consultation_fee_pkr
      ? formatPkr(doctor.consultation_fee_pkr)
      : undefined,
  };

  return (
    <div className="shell py-12 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/doctors"
        className="inline-flex items-center gap-1.5 text-sm text-ink-faint hover:text-green"
      >
        <ArrowLeft size={14} /> All specialists
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_24rem]">
        <div>
          <div className="flex items-start gap-5">
            {doctor.photo_url ? (
              <Image
                src={doctor.photo_url}
                alt={doctor.full_name}
                width={80}
                height={80}
                className="size-20 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="grid size-20 shrink-0 place-items-center rounded-full bg-green-tint font-serif text-2xl text-green">
                {initials(doctor.full_name)}
              </span>
            )}
            <div>
              <h1 className="display text-3xl md:text-4xl">
                {doctor.full_name}
              </h1>
              <p className="mt-1 text-sm text-ink-faint">{doctor.credentials}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                {doctor.rating_count > 0 && (
                  <StarRating
                    value={doctor.rating_avg}
                    count={doctor.rating_count}
                    size={15}
                  />
                )}
                {doctor.verified && <VerifiedBadge />}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {doctor.specialty?.map((s) => (
                  <span key={s} className="badge border-line text-ink-faint">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {doctor.headline && (
            <p className="prose-body mt-6 text-lg">{doctor.headline}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-ink-soft">
            {doctor.online_enabled && (
              <span className="inline-flex items-center gap-1.5">
                <Video size={15} /> Online consultation
              </span>
            )}
            {doctor.in_person_enabled && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} /> In person
                {doctor.clinic_name ? ` — ${doctor.clinic_name}` : ""},{" "}
                {doctor.city}
              </span>
            )}
            <span>Fee: {formatPkr(doctor.consultation_fee_pkr)}</span>
          </div>

          <div className="mt-4">
            <NextAvailable
              iso={doctor.next_available_at}
              timezone={doctor.timezone}
            />
          </div>

          {doctor.bio && (
            <div className="mt-10">
              <h2 className="section-index">About</h2>
              <div className="prose-body mt-3 max-w-2xl whitespace-pre-line">
                {doctor.bio}
              </div>
            </div>
          )}

          {reviews.length > 0 && (
            <div className="mt-12">
              <h2 className="section-index">
                Patient reviews ({doctor.rating_count})
              </h2>
              <ul className="mt-4 space-y-4">
                {reviews.map((r, i) => (
                  <li key={i} className="card p-5">
                    <div className="flex items-center justify-between">
                      <StarRating value={r.rating} size={13} />
                      <span className="text-xs text-ink-faint">
                        {DateTime.fromISO(r.created_at).toFormat("LLL yyyy")}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="prose-body mt-2 text-sm">
                        &ldquo;{r.comment}&rdquo;
                      </p>
                    )}
                    <p className="mt-2 text-xs text-ink-faint">
                      {r.patient_name}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10 rounded-lg border border-line bg-cream-deep p-5 text-sm text-ink-soft">
            {site.legal.infoOnly} {site.legal.notEmergency}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <BookingWidget
            slug={doctor.slug}
            doctorName={doctor.full_name}
            timezone={doctor.timezone}
            feePkr={doctor.consultation_fee_pkr}
            onlineEnabled={doctor.online_enabled}
            inPersonEnabled={doctor.in_person_enabled}
            onlinePaymentsEnabled={isConfigured.onlinePayments}
          />
          <WaitlistButton
            slug={doctor.slug}
            defaultMode={doctor.online_enabled ? "online" : "in_person"}
          />
        </aside>
      </div>
    </div>
  );
}
