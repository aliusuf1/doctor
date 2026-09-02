import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { site } from "@/lib/site";
import { isConfigured } from "@/lib/env";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — online & in-person dermatology`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    url: site.url,
    siteName: site.name,
    type: "website",
  },
  robots: { index: true, follow: true },
};

/*
  THESIS: A specialist's read, stated with total confidence. Refuses the
  soft-wellness gradient hero and the warm-cream editorial-serif look it
  replaces. One idea: real availability you can act on now.
  OWN-WORLD: Near-black pine ground (#0E1E17) + warm off-white (#FAF9F5) + one
  vermilion accent (#FF5A36). Oversized Bricolage Grotesque display, Inter UI.
  1px hairlines, squared 3px corners, framed photography with a vermilion
  corner tick. No eyebrows, no decorative 01/02 section numbers.
  STORY: Visitor sees "specialist skin, hair & nail care, booked online,
  confirmed instantly", scrolls how-it-works / conditions / real specialists /
  insights, ends on a dark CTA band, clicks Find a specialist.
  FIRST VIEWPORT: Full-bleed pine band. Left ~60%: 3-line Bricolage headline
  with one word in vermilion, one supporting line, a filled-vermilion
  "Find a specialist" CTA + quiet "How it works" link. Right ~40%: a framed
  consultation photo overlapping the band's lower edge. Minimal header,
  transparent over pine, solid on scroll.
  FORM: dark statement band + asymmetric editorial grid (user-pinned; no roll).
  FINISH: unreviewed and undocumented is unfinished; this build ends with the
  finish review, the verdict, and DESIGN.md
*/

export default function RootLayout({ children }: LayoutProps<"/">) {
  const shell = (
    <html
      lang="en"
      className={`${inter.variable} ${bricolage.variable} antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-paper text-ink">
        <div
          hidden
          dangerouslySetInnerHTML={{
            __html:
              "<!-- impeccable:direction seed=user-pinned:bold-modern | " +
              "THESIS: a specialist's read stated with total confidence; refuses the soft-wellness gradient hero and the warm-cream editorial-serif look it replaces. | " +
              "OWN-WORLD: near-black pine #0E1E17 + off-white #FAF9F5 + vermilion #FF5A36; oversized Bricolage Grotesque display, Inter UI; 1px hairlines, squared 3px corners, framed photography with a vermilion corner tick; no eyebrows, no 01/02 markers. | " +
              "STORY: visitor sees specialist skin/hair/nail care booked online with instant confirmation, scrolls how-it-works / conditions / real specialists / insights, ends on a dark CTA band, clicks Find a specialist. | " +
              "FIRST VIEWPORT: full-bleed pine band; left ~60% a 3-line Bricolage headline with one vermilion word, one supporting line, a filled-vermilion Find a specialist CTA + quiet How it works link; right ~40% a framed consultation photo overlapping the band's lower edge; minimal header transparent over pine, solid on scroll. | " +
              "FORM: dark statement band + asymmetric editorial grid (user-pinned; no roll). | " +
              "FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md -->",
          }}
        />
        {children}
      </body>
    </html>
  );

  return isConfigured.clerk ? withClerk(shell) : shell;
}

function withClerk(shell: ReactNode) {
  return <ClerkProvider>{shell}</ClerkProvider>;
}
