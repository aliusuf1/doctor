"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Subtle entrance animation. IMPORTANT: content is visible by default — the
 * animation is a progressive enhancement layered on top, so nothing can ever be
 * hidden by a missing/!firing IntersectionObserver or an odd viewport.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li";
}) {
  const ref = useRef<HTMLElement | null>(null);
  // start "primed" only for the animated path; SSR + no-JS => visible
  const [phase, setPhase] = useState<"static" | "hidden" | "in">("static");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined"
    ) {
      return; // stay static/visible
    }

    const vh = window.innerHeight || 0;
    const rect = el.getBoundingClientRect();
    // Only animate elements that are genuinely below the fold in a real viewport.
    if (vh < 200 || rect.top < vh * 0.9) return;

    setPhase("hidden");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPhase("in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    const t = setTimeout(() => setPhase("in"), 1400); // fail-open
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, []);

  return (
    <Tag
      ref={ref as never}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-out motion-reduce:transition-none",
        phase === "hidden"
          ? "translate-y-3 opacity-0"
          : "translate-y-0 opacity-100",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
