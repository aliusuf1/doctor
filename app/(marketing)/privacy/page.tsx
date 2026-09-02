import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy notice" };

export default function PrivacyPage() {
  return (
    <article className="shell max-w-2xl py-16 md:py-24">
      <p className="label">Important</p>
      <h1 className="display mt-4 text-4xl">Privacy notice</h1>
      <p className="mt-3 text-sm text-ink-faint">
        Placeholder text — replace with your reviewed legal wording before
        launch.
      </p>

      <div className="prose-body mt-8 space-y-5 text-sm">
        <p>
          {site.name} collects the information you provide when requesting a
          consultation — your name, contact details, the concern you describe and
          any payment evidence you upload — in order to arrange and deliver that
          consultation.
        </p>
        <h2 className="font-serif text-lg text-ink">What we store</h2>
        <p>
          Booking details are stored in our database (Supabase). Payment receipts
          you upload are stored in private file storage accessible only to the
          treating specialist and platform administrators. Video consultations
          are conducted over Google Meet and are not recorded by {site.name}.
        </p>
        <h2 className="font-serif text-lg text-ink">Who can see it</h2>
        <p>
          The specialist you book with, and platform administrators for support
          and safety purposes. We do not sell your data or use it for
          advertising.
        </p>
        <h2 className="font-serif text-lg text-ink">Your choices</h2>
        <p>
          You can ask us to correct or delete your information by contacting{" "}
          <a className="underline" href={`mailto:${site.supportEmail}`}>
            {site.supportEmail}
          </a>
          . Some records may be retained where required for medical or legal
          reasons.
        </p>
        <p>{site.legal.infoOnly}</p>
      </div>
    </article>
  );
}
