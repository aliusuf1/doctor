"use client";

import { ProfileForm } from "@/components/dashboard/profile-form";
import type { DoctorRow } from "@/lib/db/types";

export function OnboardingForm({ doctor }: { doctor: DoctorRow }) {
  return <ProfileForm doctor={doctor} mode="onboarding" />;
}
