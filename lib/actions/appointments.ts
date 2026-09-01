"use server";

import { revalidatePath } from "next/cache";
import { requireDoctor } from "@/lib/data/doctor-account";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  cancelAppointment,
  confirmAppointment,
  loadAppointmentBundle,
} from "@/lib/data/appointments";
import type { ActionResult } from "@/lib/actions/doctor";

async function ownAppointment(id: string) {
  const acc = await requireDoctor();
  const bundle = await loadAppointmentBundle({ id });
  if (!bundle || bundle.appointment.doctor_id !== acc.doctor.id) {
    return null;
  }
  return { acc, bundle };
}

export async function verifyPaymentAndConfirm(id: string): Promise<ActionResult> {
  const owned = await ownAppointment(id);
  if (!owned) return { ok: false, error: "Not found" };
  const sb = supabaseAdmin();
  await sb
    .from("appointments")
    .update({ payment_status: "verified", updated_at: new Date().toISOString() })
    .eq("id", id);
  const res = await confirmAppointment(id);
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard");
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

export async function markStatus(
  id: string,
  status: "completed" | "no_show",
): Promise<ActionResult> {
  const owned = await ownAppointment(id);
  if (!owned) return { ok: false, error: "Not found" };
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("appointments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/appointments");
  return { ok: true };
}

export async function doctorCancel(
  id: string,
  reason: string,
): Promise<ActionResult> {
  const owned = await ownAppointment(id);
  if (!owned) return { ok: false, error: "Not found" };
  const res = await cancelAppointment(id, "doctor", reason || "Cancelled by clinic");
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard");
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

export async function setMeetLink(
  id: string,
  link: string,
): Promise<ActionResult> {
  const owned = await ownAppointment(id);
  if (!owned) return { ok: false, error: "Not found" };
  try {
    if (link) new URL(link);
  } catch {
    return { ok: false, error: "Enter a valid URL" };
  }
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("appointments")
    .update({ meet_link: link || null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/appointments");
  return { ok: true };
}

/** Signed URL for the doctor to view an uploaded payment receipt. */
export async function getProofUrl(id: string): Promise<{
  ok: boolean;
  url?: string;
  error?: string;
}> {
  const owned = await ownAppointment(id);
  if (!owned) return { ok: false, error: "Not found" };
  const path = owned.bundle.appointment.payment_proof_path;
  if (!path) return { ok: false, error: "No receipt on file" };
  const sb = supabaseAdmin();
  const { data, error } = await sb.storage
    .from("payment-proofs")
    .createSignedUrl(path, 300);
  if (error || !data) return { ok: false, error: error?.message ?? "Failed" };
  return { ok: true, url: data.signedUrl };
}
