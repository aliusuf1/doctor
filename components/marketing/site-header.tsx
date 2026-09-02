"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 8);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors duration-200",
        scrolled
          ? "bg-paper text-[#2f6d4f] shadow-[0_1px_0_var(--color-line)]"
          : "bg-pine text-on-dark",
      )}
    >
      <div className="shell flex items-center justify-between py-4">
        <Link
          href="/"
          className="display text-[1.35rem] font-extrabold tracking-[-0.04em]"
        >
          {site.shortName}
          <span className="text-flare">.</span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-active={pathname === item.href}
              className="nav-link text-[0.82rem] font-semibold"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link href="/doctors" className="btn btn-primary px-4 py-2 text-[0.8rem]">
            Book a consultation
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              "text-[0.78rem] font-semibold transition-opacity",
              scrolled ? "opacity-80 hover:opacity-100" : "opacity-70 hover:opacity-100",
            )}
          >
            Doctors
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div
        className={cn(
          "grid overflow-hidden bg-paper text-ink transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden",
          open ? "grid-rows-[1fr] border-b border-line" : "grid-rows-[0fr]",
        )}
      >
        <nav className="shell flex min-h-0 flex-col gap-1 py-3">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="py-2 text-sm font-semibold"
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
            Book a consultation
          </Link>
          <Link
            href="/dashboard"
            className="py-2 text-sm font-semibold text-ink-faint"
            onClick={() => setOpen(false)}
          >
            Doctor login
          </Link>
        </nav>
      </div>
    </header>
  );
}
