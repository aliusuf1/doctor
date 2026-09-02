import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Framed image slot: 1px box + vermilion corner tick.
 * With `src` it renders the real photo; without, a labelled placeholder block
 * so it is obvious what to swap in. Replace placeholders with real photography
 * of consultations / specialists.
 */
export function PhotoFrame({
  src,
  alt,
  label,
  className,
  ratio = "4 / 5",
  tone = "light",
  priority,
}: {
  src?: string | null;
  alt: string;
  label: string;
  className?: string;
  ratio?: string;
  tone?: "light" | "dark";
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "frame overflow-hidden",
        tone === "dark" ? "text-on-dark" : "text-ink",
        className,
      )}
      style={{ aspectRatio: ratio }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 40vw"
          className="object-cover"
        />
      ) : (
        <div className="grid h-full w-full place-items-center bg-moss-tint px-4 text-center">
          <span className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ink-faint">
            [ photo — {label} ]
          </span>
        </div>
      )}
    </div>
  );
}
