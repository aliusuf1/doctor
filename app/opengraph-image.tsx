import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = site.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
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
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              border: "2px solid #2e4636",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2e4636",
              fontSize: 22,
            }}
          >
            N
          </div>
          <div style={{ display: "flex", fontSize: 26 }}>{site.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", fontSize: 72, color: "#2e4636" }}>
            Clear answers. Healthier skin.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#43463f",
              maxWidth: 820,
            }}
          >
            {site.tagline}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#6b6f66" }}>
          Online and in-person dermatology · Karachi
        </div>
      </div>
    ),
    { ...size },
  );
}
