import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { site } from "@/lib/site";
import { isConfigured } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Dermatologist in Karachi`,
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
    <html lang="en" className="antialiased">
      <body className="flex min-h-screen flex-col bg-bg text-ink">
        {children}
      </body>
    </html>
  );

  return isConfigured.clerk ? withClerk(shell) : shell;
}

function withClerk(shell: ReactNode) {
  return <ClerkProvider>{shell}</ClerkProvider>;
}
