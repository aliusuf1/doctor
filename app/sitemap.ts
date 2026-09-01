import type { MetadataRoute } from "next";
import { listPublicDoctors } from "@/lib/data/doctors";
import { listPublishedInsights } from "@/lib/data/insights";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [doctors, insights] = await Promise.all([
    listPublicDoctors(),
    listPublishedInsights(),
  ]);

  const staticRoutes = [
    "",
    "/doctors",
    "/consultation",
    "/conditions",
    "/insights",
    "/privacy",
    "/disclaimer",
  ].map((p) => ({
    url: `${site.url}${p}`,
    lastModified: new Date(),
  }));

  return [
    ...staticRoutes,
    ...doctors.map((d) => ({
      url: `${site.url}/doctors/${d.slug}`,
      lastModified: new Date(),
    })),
    ...insights.map((a) => ({
      url: `${site.url}/insights/${a.slug}`,
      lastModified: a.published_at ? new Date(a.published_at) : new Date(),
    })),
  ];
}
