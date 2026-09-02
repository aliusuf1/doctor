import type { ReactNode } from "react";
import { Section } from "@/components/marketing/section";

/**
 * Back-compat shim. The redesign drops decorative section numbers and kicker
 * labels — this maps the old API onto the new <Section>. Prefer <Section>
 * directly in new code.
 */
export function NumberedSection({
  title,
  intro,
  children,
  id,
  className,
}: {
  index?: string;
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <Section title={title} lead={intro} id={id} className={className}>
      {children}
    </Section>
  );
}
