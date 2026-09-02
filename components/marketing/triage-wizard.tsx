"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";

const AREAS = [
  { key: "skin", label: "Skin" },
  { key: "hair", label: "Hair & scalp" },
  { key: "nails", label: "Nails" },
] as const;

const CONCERNS: Record<string, string[]> = {
  skin: [
    "Acne or acne marks",
    "Dark patches / melasma / pigmentation",
    "Eczema, psoriasis or a persistent rash",
    "A suspected skin infection",
    "A mole or spot I want checked",
    "Something else",
  ],
  hair: [
    "Increased hair shedding or thinning",
    "A patch of hair loss",
    "An itchy or flaky scalp",
    "Something else",
  ],
  nails: [
    "Discolouration or thickening",
    "A nail lifting or separating",
    "Something else",
  ],
};

const DURATIONS = [
  "Less than 2 weeks",
  "2 to 8 weeks",
  "More than 2 months",
  "It comes and goes",
];

export function TriageWizard() {
  const [step, setStep] = useState(0); // 0 area, 1 concern, 2 duration, 3 result
  const [area, setArea] = useState<string | null>(null);
  const [concern, setConcern] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);

  const reset = () => {
    setStep(0);
    setArea(null);
    setConcern(null);
    setDuration(null);
  };

  const summary =
    concern && duration
      ? `${concern} — ${area === "hair" ? "hair/scalp" : area}, ${duration.toLowerCase()}.`
      : "";
  const bookUrl = `${site.bookHref}?mode=online&concern=${encodeURIComponent(summary)}`;

  const Progress = () => (
    <div className="mb-6 flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors",
            step > i ? "bg-flare" : step === i ? "bg-ink" : "bg-line",
          )}
        />
      ))}
    </div>
  );

  const OptionButton = ({
    children,
    onClick,
    active,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    active?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-between gap-3 rounded-sm border px-4 py-3 text-left text-[0.95rem] font-medium transition-colors",
        active
          ? "border-flare bg-flare-tint"
          : "border-line hover:border-ink hover:bg-paper-2",
      )}
    >
      {children}
      <ArrowRight size={15} className="shrink-0 text-flare" />
    </button>
  );

  return (
    <div className="rounded-sm border border-line bg-paper p-5 md:p-7">
      {step < 3 && <Progress />}

      {step === 0 && (
        <div>
          <h3 className="display text-[1.3rem] font-bold">
            Where is your concern?
          </h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {AREAS.map((a) => (
              <OptionButton
                key={a.key}
                active={area === a.key}
                onClick={() => {
                  setArea(a.key);
                  setConcern(null);
                  setStep(1);
                }}
              >
                {a.label}
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {step === 1 && area && (
        <div>
          <h3 className="display text-[1.3rem] font-bold">
            What best describes it?
          </h3>
          <div className="mt-4 grid gap-2">
            {CONCERNS[area].map((c) => (
              <OptionButton
                key={c}
                active={concern === c}
                onClick={() => {
                  setConcern(c);
                  setStep(2);
                }}
              >
                {c}
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 className="display text-[1.3rem] font-bold">
            How long has it been going on?
          </h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {DURATIONS.map((d) => (
              <OptionButton
                key={d}
                active={duration === d}
                onClick={() => {
                  setDuration(d);
                  setStep(3);
                }}
              >
                {d}
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 className="display text-[1.4rem] font-bold">
            An online consultation is a good first step.
          </h3>
          <p className="prose-body mt-3 text-[0.95rem]">
            Dr. Sana can assess this over video, explain the likely diagnosis and
            agree a plan. If an in-person examination, procedure or test is
            needed, she&rsquo;ll tell you and arrange it.
          </p>
          <div className="mt-4 rounded-sm border border-line bg-paper-2 px-4 py-3 text-sm">
            <span className="font-semibold text-ink-faint">
              We&rsquo;ll note:{" "}
            </span>
            {summary}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Link href={bookUrl} className="btn btn-primary">
              Book with this noted <ArrowRight size={16} />
            </Link>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-flare"
            >
              <RotateCcw size={14} /> Start over
            </button>
          </div>
        </div>
      )}

      {step > 0 && step < 3 && (
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-flare"
        >
          <ArrowLeft size={14} /> Back
        </button>
      )}

      <p className="mt-5 text-[0.7rem] text-ink-faint">
        This is a guide, not a diagnosis. {site.legal.notEmergency}
      </p>
    </div>
  );
}
