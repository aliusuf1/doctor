import { BadgeCheck, Star } from "lucide-react";
import { DateTime } from "luxon";

export function StarRating({
  value,
  count,
  size = 14,
}: {
  value: number;
  count?: number;
  size?: number;
}) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
      <span className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={size}
            className={
              rounded >= n
                ? "fill-tan text-tan"
                : rounded >= n - 0.5
                  ? "fill-tan/40 text-tan"
                  : "text-line-strong"
            }
          />
        ))}
      </span>
      {value > 0 ? <span className="font-medium">{value.toFixed(1)}</span> : null}
      {count != null && count > 0 ? (
        <span className="text-ink-faint">({count})</span>
      ) : null}
    </span>
  );
}

export function VerifiedBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-ok">
      <BadgeCheck size={compact ? 14 : 16} />
      {compact ? "Verified" : "Verified specialist"}
    </span>
  );
}

export function NextAvailable({
  iso,
  timezone,
}: {
  iso: string | null;
  timezone: string;
}) {
  if (!iso) {
    return <span className="text-xs text-ink-faint">Availability coming soon</span>;
  }
  const dt = DateTime.fromISO(iso).setZone(timezone);
  const now = DateTime.now().setZone(timezone);
  let label: string;
  if (dt.hasSame(now, "day")) label = `today ${dt.toFormat("h:mm a")}`;
  else if (dt.hasSame(now.plus({ days: 1 }), "day"))
    label = `tomorrow ${dt.toFormat("h:mm a")}`;
  else label = dt.toFormat("ccc d LLL, h:mm a");
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ok">
      <span className="size-1.5 rounded-full bg-ok" />
      Next: {label}
    </span>
  );
}
