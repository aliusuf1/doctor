"use server";

import { revalidatePath } from "next/cache";
import { getDoctorAccount } from "@/lib/data/doctor-account";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/actions/doctor";

async function requireAdmin() {
  const acc = await getDoctorAccount();
  if (!acc || acc.role !== "admin") throw new Error("FORBIDDEN");
  return acc;
}

export async function adminSetDoctorActive(
  doctorId: string,
  active: boolean,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Forbidden" };
  }
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("doctors")
    .update({ is_active: active, updated_at: new Date().toISOString() })
    .eq("id", doctorId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/admin");
  revalidatePath("/doctors");
  return { ok: true };
}

export async function adminSetVerified(
  doctorId: string,
  verified: boolean,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Forbidden" };
  }
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("doctors")
    .update({
      verified,
      verified_at: verified ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", doctorId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/admin");
  revalidatePath("/doctors");
  return { ok: true };
}

export async function adminGetLicenseUrl(
  doctorId: string,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Forbidden" };
  }
  const sb = supabaseAdmin();
  const { data: doctor } = await sb
    .from("doctors")
    .select("license_path")
    .eq("id", doctorId)
    .maybeSingle<{ license_path: string | null }>();
  if (!doctor?.license_path) return { ok: false, error: "No document on file" };
  const { data, error } = await sb.storage
    .from("doctor-licenses")
    .createSignedUrl(doctor.license_path, 300);
  if (error || !data) return { ok: false, error: error?.message ?? "Failed" };
  return { ok: true, url: data.signedUrl };
}
