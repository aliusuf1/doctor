import { cn } from "@/lib/utils";

/**
 * CSS-only infinite marquee. The list is rendered twice inside a track that
 * translates -50%, so the loop is seamless. Pauses on hover; static under
 * prefers-reduced-motion (the row just overflows and can be scrolled).
 */
export function Marquee({
  items,
  className,
  speedSeconds = 42,
}: {
  items: readonly string[];
  className?: string;
  speedSeconds?: number;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden",
        // edge fade
        "[mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]",
        className,
      )}
      aria-label="Trusted clinical network"
    >
      <div
        className="marquee-track flex w-max shrink-0 items-center gap-x-12 group-hover:[animation-play-state:paused]"
        style={{ animationDuration: `${speedSeconds}s` }}
      >
        {[...items, ...items].map((name, i) => (
          <span
            key={i}
            aria-hidden={i >= items.length}
            className="whitespace-nowrap text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink-faint"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
