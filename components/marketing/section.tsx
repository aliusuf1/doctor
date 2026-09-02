import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "bg" | "panel" | "dark";

const TONE: Record<Tone, string> = {
  bg: "bg-bg border-line",
  panel: "bg-panel border-line",
  dark: "bg-forest border-line-on-dark text-panel-on-dark",
};

/**
 * Numbered marketing section. The eyebrow row (tan index + green label) sits
 * above a two-column band: a large serif heading on the left, the lead
 * paragraph on the right. Children run full width below.
 */
export function Section({
  index,
  label,
  title,
  lead,
  children,
  id,
  tone = "bg",
  leadAlign = "top",
  className,
}: {
  index?: string;
  label?: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  id?: string;
  tone?: Tone;
  leadAlign?: "top" | "bottom";
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <section
      id={id}
      className={cn("border-t py-16 md:py-24", TONE[tone], className)}
    >
      <div className="shell">
        {(index || label) && (
          <div className="flex items-baseline gap-4">
            {index ? <span className="section-index">{index}</span> : null}
            {label ? (
              <span
                className={cn(
                  "text-[0.625rem] font-bold uppercase tracking-[0.17em]",
                  dark ? "text-panel-on-dark/70" : "text-green",
                )}
              >
                {label}
              </span>
            ) : null}
          </div>
        )}

        <div
          className={cn(
            "mt-6 grid gap-6 md:grid-cols-2 md:gap-16",
            leadAlign === "bottom" ? "md:items-end" : "md:items-start",
          )}
        >
          <h2
            className={cn(
              "display text-[2.2rem] sm:text-[2.8rem] md:text-[3.4rem]",
              dark && "text-white",
            )}
          >
            {title}
          </h2>
          {lead ? (
            <div
              className={cn(
                "max-w-md text-[0.95rem] leading-relaxed",
                dark ? "text-panel-on-dark/75" : "text-ink-soft",
              )}
            >
              {lead}
            </div>
          ) : null}
        </div>

        {children ? <div className="mt-12">{children}</div> : null}
      </div>
    </section>
  );
}

/** Italic green accent used inside section headings. */
export function Accent({
  children,
  dark,
}: {
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <em
      className={cn("italic", dark ? "text-mint/70" : "text-green")}
      style={{ fontStyle: "italic" }}
    >
      {children}
    </em>
  );
}
