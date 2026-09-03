"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Lock, Menu, X } from "lucide-react";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40">
      {/* utility bar */}
      <div className="bg-forest text-panel-on-dark">
        <div className="shell flex items-center justify-between py-1.5">
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.16em]">
            Online dermatology consultations
          </span>
          <div className="hidden items-center gap-6 sm:flex">
            <Link
              href={site.bookHref}
              className="text-[0.6rem] font-bold uppercase tracking-[0.16em] underline underline-offset-4 hover:no-underline"
            >
              Request an appointment
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-panel-on-dark/70 transition-colors hover:text-panel-on-dark"
            >
              <Lock size={10} />
              Doctor login
            </Link>
          </div>
        </div>
      </div>

      {/* main bar — translucent ivory */}
      <div className="border-b border-line bg-bg/[0.94] backdrop-blur-sm">
        <div className="shell flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full border border-green/60 font-serif text-sm text-green">
              SS
            </span>
            <span className="leading-tight">
              <span className="block font-serif text-[1.1rem] text-forest">
                {site.name}
              </span>
              <span className="block text-[0.58rem] font-bold uppercase tracking-[0.2em] text-ink-faint">
                {site.doctorTitle}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-active={pathname === item.href}
                className="nav-link text-[0.82rem] text-ink-soft transition-colors hover:text-green"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-[0.78rem] text-ink-faint transition-colors hover:text-green"
            >
              <Lock size={12} />
              Doctor login
            </Link>
            <Link
              href={site.bookHref}
              className="text-[0.82rem] font-semibold text-forest"
            >
              Book consultation
            </Link>
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            className="text-forest md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "grid overflow-hidden border-b border-line bg-bg transition-[grid-template-rows] duration-300 md:hidden",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr] border-b-0",
        )}
      >
        <nav className="shell flex min-h-0 flex-col gap-1 py-3">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="py-2 text-sm text-ink-soft"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={site.bookHref}
            className="btn btn-primary mt-2"
            onClick={() => setOpen(false)}
          >
            Book consultation
          </Link>
          <Link
            href="/dashboard"
            className="mt-1 inline-flex items-center gap-1.5 py-2 text-sm text-ink-faint"
            onClick={() => setOpen(false)}
          >
            <Lock size={12} />
            Doctor login
          </Link>
        </nav>
      </div>
    </header>
  );
}
