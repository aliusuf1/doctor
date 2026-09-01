/**
 * Editorial arched "portrait" panel for the hero — pure CSS/SVG, no asset.
 * A clean tall arch, a thin outline arch offset behind it, a tan circular
 * badge and a floating status card, echoing the reference layout.
 * Swap the inner SVG for a real <Image> when brand photography exists.
 */
const ARCH = "rounded-[9rem_9rem_10px_10px]";

export function HeroPortrait() {
  return (
    <div className="relative mx-auto w-[19rem] max-w-full pb-10 sm:w-[21rem]">
      {/* thin outline arch, offset behind */}
      <div
        className={`absolute -right-4 top-5 h-full w-full border border-green/30 ${ARCH}`}
      />

      <div
        className={`relative aspect-[3/4] w-full overflow-hidden border border-line-strong ${ARCH}`}
      >
        <svg
          viewBox="0 0 340 452"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Illustration representing a specialist consultation"
        >
          <defs>
            <linearGradient id="hp-g" x1="0" y1="0" x2="0.15" y2="1">
              <stop offset="0" stopColor="#37583f" />
              <stop offset="1" stopColor="#1f3a2c" />
            </linearGradient>
          </defs>
          <rect width="340" height="452" fill="url(#hp-g)" />
          <circle cx="150" cy="150" r="120" fill="#ffffff" opacity="0.06" />
          <circle cx="150" cy="150" r="180" fill="#ffffff" opacity="0.04" />
          <circle cx="150" cy="150" r="240" fill="#ffffff" opacity="0.03" />
          <path
            d="M0 452 C 90 300, 150 420, 250 300 S 360 360, 340 452 Z"
            fill="#eef2ec"
            opacity="0.9"
          />
          <circle cx="235" cy="120" r="30" fill="#e6d5bd" />
        </svg>
      </div>

      {/* tan circular badge */}
      <span className="absolute right-2 top-6 z-10 grid size-[4.4rem] place-items-center rounded-full bg-tan text-center font-serif text-[0.7rem] italic leading-[1.15] text-green-deep">
        Patient-
        <br />
        first care
      </span>

      {/* floating status card */}
      <div className="card absolute -bottom-2 left-2 z-10 w-[70%] px-4 py-2.5 shadow-[0_14px_34px_-16px_rgba(31,58,44,0.4)]">
        <div className="flex items-center gap-2">
          <span className="size-2 animate-pulse rounded-full bg-ok" />
          <span className="u-sans text-[0.8rem] font-semibold">
            Appointments available
          </span>
        </div>
        <p className="u-sans mt-0.5 text-[0.7rem] text-ink-faint">
          Online, and in person in Karachi
        </p>
      </div>
    </div>
  );
}
