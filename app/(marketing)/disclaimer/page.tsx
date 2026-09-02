import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Medical disclaimer" };

export default function DisclaimerPage() {
  return (
    <article className="shell max-w-2xl py-16 md:py-24">
      <p className="label">Important</p>
      <h1 className="display mt-4 text-4xl">Medical disclaimer</h1>
      <p className="mt-3 text-sm text-ink-faint">
        Placeholder text — replace with your reviewed legal wording before
        launch.
      </p>

      <div className="prose-body mt-8 space-y-5 text-sm">
        <p>
          <strong>{site.legal.notEmergency}</strong> If you have severe pain,
          difficulty breathing, a rapidly spreading rash with fever, or any other
          urgent symptom, seek immediate in-person care.
        </p>
        <p>
          Content on {site.name} — including the Insights articles and the
          Conditions overview — is general information. It is not a diagnosis and
          does not create a doctor–patient relationship.
        </p>
        <p>
          Submitting a consultation request does not confirm an appointment and
          does not constitute medical advice. A diagnosis and treatment plan are
          provided only during a consultation with a specialist.
        </p>
        <p>
          Online consultation has limits. Where an in-person examination,
          procedure or investigation is needed, your dermatologist will advise
          you and, where appropriate, arrange onward care.
        </p>
        <p>{site.legal.infoOnly}</p>
      </div>
    </article>
  );
}
