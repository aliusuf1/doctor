import { getDoctorAccount } from "@/lib/data/doctor-account";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { ListingToggle } from "@/components/dashboard/listing-toggle";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const account = await getDoctorAccount();
  if (!account?.doctor) {
    return <p className="text-sm text-ink-faint">Could not load your record.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-3xl">Profile &amp; settings</h1>
        <ListingToggle
          active={account.doctor.is_active}
          onboarded={Boolean(account.doctor.onboarded_at)}
        />
      </div>
      <p className="prose-body mt-2 text-sm">
        Changes are reflected on your public page immediately.
      </p>
      <div className="mt-8">
        <ProfileForm doctor={account.doctor} mode="edit" />
      </div>
    </div>
  );
}
