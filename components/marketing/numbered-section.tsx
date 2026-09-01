import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/reveal";

/**
 * A marketing section with an "01" index marker and an eyebrow label,
 * matching the reference site's numbered layout.
 */
export function NumberedSection({
  index,
  eyebrow,
  title,
  intro,
  children,
  id,
  className,
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn("border-t border-line py-16 md:py-20", className)}
    >
      <div className="shell">
        <div className="grid gap-8 md:grid-cols-[8rem_1fr] md:gap-16">
          <div className="flex items-baseline gap-4 md:flex-col md:gap-3">
            <span className="section-index">{index}</span>
            <span className="u-sans text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-ink-faint md:mt-1">
              {eyebrow}
            </span>
          </div>
          <Reveal>
            <h2 className="display max-w-2xl text-[2rem] md:text-[2.9rem]">
              {title}
            </h2>
            {intro ? (
              <div className="prose-body mt-6 max-w-xl text-[1.08rem]">
                {intro}
              </div>
            ) : null}
            {children ? <div className="mt-12">{children}</div> : null}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
