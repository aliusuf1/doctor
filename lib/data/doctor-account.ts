import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase/admin";
import { isConfigured } from "@/lib/env";
import { slugify } from "@/lib/utils";
import type { DoctorRow } from "@/lib/db/types";

export interface DoctorAccount {
  clerkUserId: string;
  role: "doctor" | "admin";
  doctor: DoctorRow | null;
  needsOnboarding: boolean;
}

/**
 * Resolve the signed-in Clerk user to their `doctors` row, creating a stub row
 * on first visit. Returns null when the user is not signed in.
 */
export async function getDoctorAccount(): Promise<DoctorAccount | null> {
  if (!isConfigured.clerk) return null;
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const role =
    (user?.publicMetadata?.role as "doctor" | "admin" | undefined) ?? "doctor";

  if (!hasSupabaseAdmin()) {
    return { clerkUserId: userId, role, doctor: null, needsOnboarding: true };
  }

  const sb = supabaseAdmin();
  let { data: doctor } = await sb
    .from("doctors")
    .select("*")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!doctor) {
    const name =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
      "New Specialist";
    const base = slugify(name) || "specialist";
    let slug = base;
    for (let i = 2; i < 50; i++) {
      const { data: clash } = await sb
        .from("doctors")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!clash) break;
      slug = `${base}-${i}`;
    }

    const { data: created, error } = await sb
      .from("doctors")
      .insert({
        clerk_user_id: userId,
        slug,
        full_name: name,
        is_active: false, // hidden until onboarding completes
      })
      .select("*")
      .single();
    if (error) {
      console.error("create doctor stub:", error.message);
      return { clerkUserId: userId, role, doctor: null, needsOnboarding: true };
    }
    doctor = created;
  }

  const d = doctor as DoctorRow;
  return {
    clerkUserId: userId,
    role,
    doctor: d,
    needsOnboarding: !d.onboarded_at,
  };
}

export async function requireDoctor(): Promise<DoctorAccount & { doctor: DoctorRow }> {
  const acc = await getDoctorAccount();
  if (!acc) throw new Error("UNAUTHENTICATED");
  if (!acc.doctor) throw new Error("NO_DOCTOR_RECORD");
  return acc as DoctorAccount & { doctor: DoctorRow };
}
