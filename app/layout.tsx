import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Newsreader } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { site } from "@/lib/site";
import { isConfigured } from "@/lib/env";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  const shell = (
    <html
      lang="en"
      className={`${inter.variable} ${newsreader.variable} antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-paper text-ink">
        {children}
      </body>
    </html>
  );

  // ClerkProvider requires a publishable key even to render. When Clerk is not
  // configured the marketing site still needs to work, so wrap only when keyed.
  return isConfigured.clerk ? withClerk(shell) : shell;
}

function withClerk(shell: ReactNode) {
  return <ClerkProvider>{shell}</ClerkProvider>;
}
