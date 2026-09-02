import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * A marketing section: a large self-carrying heading (no kicker), an optional
 * lead paragraph, then content. Two-column on desktop — heading left, body
 * right — so the scroll has structure without decorative numbering.
 */
export function Section({
  title,
  lead,
  children,
  id,
  dark,
  className,
}: {
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  id?: string;
  dark?: boolean;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "border-t py-16 md:py-24",
        dark
          ? "border-line-dark bg-pine text-on-dark"
          : "border-line bg-paper",
        className,
      )}
    >
      <div className="shell grid gap-8 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:gap-14">
        <div className="rise-in">
          <h2 className="display text-[2.1rem] leading-[0.95] sm:text-[2.6rem] md:text-[3rem]">
            {title}
          </h2>
          {lead ? (
            <p
              className={cn(
                "mt-5 max-w-sm text-[1.02rem] leading-relaxed",
                dark ? "text-on-dark-soft" : "text-ink-soft",
              )}
            >
              {lead}
            </p>
          ) : null}
        </div>
        <div className="rise-in min-w-0">{children}</div>
      </div>
    </section>
  );
}
