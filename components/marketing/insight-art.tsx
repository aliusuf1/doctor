/**
 * Decorative header panel for an insight card: soft overlapping circles in a
 * tinted field. Tone rotates per card so the row reads as a set.
 */
const TONES = [
  { bg: "#DCE7DC", ring: "#EAF1EA", disc: "#EEF4EE" }, // sage
  { bg: "#E7DCC8", ring: "#F2EADC", disc: "#F7F1E7" }, // tan
  { bg: "#D6E2E2", ring: "#E7EFEF", disc: "#EEF4F4" }, // blue-grey
];

export function InsightArt({
  index,
  category,
}: {
  index: number;
  category: string;
}) {
  const t = TONES[index % TONES.length];
  return (
    <div className="relative h-44 w-full overflow-hidden">
      <svg
        viewBox="0 0 400 176"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <rect width="400" height="176" fill={t.bg} />
        <circle cx="312" cy="62" r="86" fill={t.disc} />
        <circle cx="78" cy="150" r="52" fill="none" stroke={t.ring} strokeWidth="14" />
        <circle cx="212" cy="164" r="30" fill={t.ring} opacity="0.7" />
      </svg>
      <span className="absolute left-5 top-5 border-b border-tan pb-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-forest">
        {category}
      </span>
    </div>
  );
}
