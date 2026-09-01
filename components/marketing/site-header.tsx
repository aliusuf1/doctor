"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur-sm">
      {/* utility bar */}
      <div className="bg-green text-paper">
        <div className="shell flex items-center justify-between py-1.5">
          <span className="u-sans text-[0.62rem] font-semibold uppercase tracking-[0.2em]">
            Online &amp; in-person dermatology consultations
          </span>
          <Link
            href="/doctors"
            className="u-sans hidden text-[0.62rem] font-semibold uppercase tracking-[0.2em] underline underline-offset-4 hover:no-underline sm:block"
          >
            Request an appointment
          </Link>
        </div>
      </div>

      <div className="border-b border-line">
        <div className="shell flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full border border-green font-serif text-sm text-green">
              N
            </span>
            <span className="leading-tight">
              <span className="block font-serif text-[1.15rem] tracking-tight">
                {site.name}
              </span>
              <span className="u-sans block text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-ink-faint">
                Specialist skin care
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="u-sans text-[0.82rem] text-ink-soft transition-colors hover:text-green"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-5 md:flex">
            <Link
              href="/doctors"
              className="btn btn-primary px-4 py-2 text-[0.8rem]"
            >
              Book consultation
            </Link>
            <Link
              href="/dashboard"
              className="u-sans text-[0.78rem] text-ink-faint transition-colors hover:text-green"
            >
              Doctor login
            </Link>
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "border-b border-line bg-paper md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav className="shell flex flex-col gap-1 py-3">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="u-sans py-2 text-sm text-ink-soft"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/doctors"
            className="btn btn-primary mt-2"
            onClick={() => setOpen(false)}
          >
            Book consultation
          </Link>
          <Link
            href="/dashboard"
            className="u-sans py-2 text-sm text-ink-faint"
            onClick={() => setOpen(false)}
          >
            Doctor login
          </Link>
        </nav>
      </div>
    </header>
  );
}
