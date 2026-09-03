import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NumberedSection } from "@/components/marketing/numbered-section";
import { HOW_IT_WORKS, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "How online consultation works",
  description:
    "What to expect from an online dermatology consultation on Northline: booking, payment, the video call, and follow-up.",
};

export default function ConsultationPage() {
  return (
    <>
      <section className="border-b border-line py-16 md:py-24">
        <div className="shell max-w-3xl">
          <h1 className="display text-[clamp(2.4rem,6vw,4.5rem)] font-extrabold">
            A specialist opinion,{" "}
            <span className="text-flare">wherever you are.</span>
          </h1>
          <p className="prose-body mt-6 text-lg">
            Online consultation is a convenient first step for many visible skin,
            hair and nail concerns, and for follow-ups. Some conditions still
            need an in-person examination, a procedure or an investigation — your
            dermatologist will tell you clearly when that is the case.
          </p>
          <Link
            href={site.bookHref}
            className="btn btn-primary mt-8 px-9 py-4 text-[0.95rem]"
          >
            Book a consultation <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <NumberedSection
        index="01"
        eyebrow="The process"
        title="Three steps, no phone tag."
      >
        <ol className="grid gap-6 md:grid-cols-3">
          {HOW_IT_WORKS.map((s) => (
            <li key={s.n} className="card p-6">
              <span className="grid size-8 place-items-center rounded-full bg-green text-paper text-sm">
                {s.n}
              </span>
              <h3 className="mt-4 font-serif text-lg">{s.title}</h3>
              <p className="prose-body mt-2 text-sm">{s.body}</p>
            </li>
          ))}
        </ol>
      </NumberedSection>

      <NumberedSection
        index="02"
        eyebrow="Payment"
        title="The fee is shown before you book."
        intro="Each specialist sets their own consultation fee. You will see it on the specialist's page and again at checkout."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-6">
            <h3 className="font-serif text-lg">Pay online</h3>
            <p className="prose-body mt-2 text-sm">
              Pay by card or wallet through a secure Pakistani payment gateway.
              Your slot is confirmed the moment payment succeeds.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-serif text-lg">Bank transfer</h3>
            <p className="prose-body mt-2 text-sm">
              Transfer the fee to the account shown after booking and upload the
              receipt. The specialist verifies it and your appointment is
              confirmed — usually within a few hours.
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-ink-faint">
          Until payment is verified, the slot is held for {site.shortName}&rsquo;s
          hold window and then released.
        </p>
      </NumberedSection>

      <NumberedSection
        index="03"
        eyebrow="The call"
        title="What you need for the video consultation."
      >
        <ul className="prose-body grid gap-3 text-sm md:grid-cols-2">
          <li className="card p-4">
            A phone or laptop with a working camera, in good, natural light.
          </li>
          <li className="card p-4">
            A stable internet connection. A Google Meet link is generated
            automatically and emailed to you.
          </li>
          <li className="card p-4">
            Any photographs of the affected area taken over the last few weeks.
          </li>
          <li className="card p-4">
            A list of products and medicines you currently use.
          </li>
        </ul>
      </NumberedSection>

      <NumberedSection
        index="04"
        eyebrow="Afterwards"
        title="A plan you can actually follow."
        intro="After the consultation your dermatologist shares a written plan: the working diagnosis, what to do, what to expect and when to follow up. Prescriptions are issued where appropriate."
      />

      {/* Closing CTA */}
      <section className="border-t border-line bg-panel py-20 md:py-28">
        <div className="shell flex flex-col items-center gap-7 text-center">
          <h2 className="display text-[2.2rem] sm:text-[2.8rem] md:text-[3.2rem]">
            Ready to book?
          </h2>
          <p className="prose-body max-w-md text-[1.05rem]">
            See {site.name}&rsquo;s real availability, pick a time that suits
            you, and get an instant confirmation with a secure video link.
          </p>
          <Link
            href={site.bookHref}
            className="btn btn-primary px-12 py-5 text-[1.05rem]"
          >
            Book a consultation <ArrowRight size={20} />
          </Link>
          <p className="text-xs text-ink-faint">{site.legal.notEmergency}</p>
        </div>
      </section>
    </>
  );
}
