import { ImageResponse } from "next/og";
import { getPublicDoctor } from "@/lib/data/doctors";
import { site } from "@/lib/site";
import { formatPkr } from "@/lib/utils";

export const alt = "Specialist profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const d = await getPublicDoctor(slug);
  const name = d?.full_name ?? "Dermatology specialist";
  const line =
    d?.headline ??
    "Evidence-led skin, hair and nail care — online and in clinic.";
  const footer =
    `${d?.city ?? "Karachi"}` +
    (d?.consultation_fee_pkr ? ` · ${formatPkr(d.consultation_fee_pkr)}` : "") +
    " · Book online";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#f4efe4",
          color: "#1c1d1a",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 24, color: "#6b6f66" }}>
          {site.name} · Verified specialist
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", fontSize: 64 }}>{name}</div>
          <div style={{ display: "flex", fontSize: 26, color: "#2e4636" }}>
            {d?.credentials ?? "Consultant Dermatologist"}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#43463f",
              maxWidth: 940,
            }}
          >
            {line}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#6b6f66" }}>
          {footer}
        </div>
      </div>
    ),
    { ...size },
  );
}
