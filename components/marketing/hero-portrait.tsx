import Image from "next/image";

/**
 * Hero portrait: Dr. Sana's photo inside a tall arch, a thin outline arch
 * offset behind it, a tan circular badge, and a floating availability card.
 */
const ARCH = "rounded-t-full rounded-b-[2px]";

export function HeroPortrait() {
  return (
    <div className="relative mx-auto w-full max-w-[30rem]">
      {/* thin outline arch behind */}
      <div
        className={`absolute left-1/2 top-3 h-[95%] w-[92%] -translate-x-1/2 border border-green/25 ${ARCH}`}
      />

      <div
        className={`relative aspect-[4/5.1] w-[86%] overflow-hidden bg-white ${ARCH}`}
      >
        <Image
          src="/dr-sana.avif"
          alt="Dr. Sana Siddiqui, Consultant Dermatologist"
          fill
          priority
          sizes="(max-width: 768px) 90vw, 40vw"
          className="object-cover object-top"
        />
      </div>

      {/* tan circular badge */}
      <span className="absolute right-0 top-6 z-10 grid size-[5.25rem] place-items-center rounded-full bg-tan text-center font-serif text-[0.8rem] italic leading-[1.2] text-white">
        Patient-first
        <br />
        care
      </span>

      {/* floating availability card */}
      <div className="absolute bottom-8 left-[-1.5rem] z-10 w-[15rem] bg-white px-5 py-3.5 shadow-[0_18px_40px_-22px_rgba(23,59,51,0.4)]">
        <div className="flex items-center gap-2.5">
          <span className="size-2.5 rounded-full bg-ok" />
          <span className="font-serif text-[0.95rem] text-forest">
            Appointments available
          </span>
        </div>
        <p className="mt-1 pl-5 text-[0.72rem] text-ink-faint">
          Online and in Karachi
        </p>
      </div>
    </div>
  );
}
