"use client";

import { useId, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  key: string;
  title: ReactNode;
  aside?: ReactNode;
  content: ReactNode;
}

/**
 * Hairline accordion in the site's world (squared, 1px rules, vermilion mark).
 * Native <button> so keyboard + screen readers work; closed panels are removed
 * from the tree so links inside them aren't focusable.
 */
export function Accordion({
  items,
  defaultOpen,
  className,
}: {
  items: AccordionItem[];
  defaultOpen?: string;
  className?: string;
}) {
  const baseId = useId();
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(defaultOpen ? [defaultOpen] : []),
  );

  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className={cn("border-t border-line", className)}>
      {items.map((item) => {
        const isOpen = open.has(item.key);
        const panelId = `${baseId}-${item.key}`;
        return (
          <div key={item.key} className="border-b border-line">
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.key)}
                className="flex w-full items-center gap-4 py-5 text-left transition-colors hover:text-flare"
              >
                <Plus
                  size={18}
                  className={cn(
                    "shrink-0 text-flare transition-transform duration-200",
                    isOpen && "rotate-45",
                  )}
                />
                <span className="display flex-1 text-[1.2rem] font-bold md:text-[1.4rem]">
                  {item.title}
                </span>
                {item.aside ? (
                  <span className="shrink-0 text-xs text-ink-faint">
                    {item.aside}
                  </span>
                ) : null}
              </button>
            </h3>
            {isOpen && (
              <div
                id={panelId}
                role="region"
                className="animate-[rise_0.28s_cubic-bezier(0.16,1,0.3,1)] pb-6 pl-[2.1rem] pr-2 text-[0.95rem] leading-relaxed text-ink-soft"
              >
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
