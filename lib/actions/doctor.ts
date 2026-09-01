"use server";

import { revalidatePath } from "next/cache";
import { requireDoctor } from "@/lib/data/doctor-account";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { refreshNextAvailable } from "@/lib/data/next-available";
import {
  availabilityOverrideSchema,
  availabilityRulesSchema,
  doctorProfileSchema,
} from "@/lib/validation/schemas";

export interface ActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function zodToFieldErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path.map(String).join(".") || "_";
    if (!out[key]) out[key] = i.message;
  }
  return out;
}

export async function saveDoctorProfile(
  raw: unknown,
  opts: { completeOnboarding?: boolean } = {},
): Promise<ActionResult> {
  const acc = await requireDoctor();
  const parsed = doctorProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: zodToFieldErrors(parsed.error.issues),
    };
  }
  const v = parsed.data;
  const sb = supabaseAdmin();

  // slug uniqueness (excluding self)
  const { data: clash } = await sb
    .from("doctors")
    .select("id")
    .eq("slug", v.slug)
    .neq("id", acc.doctor.id)
    .maybeSingle();
  if (clash) {
    return {
      ok: false,
      error: "That profile URL is taken.",
      fieldErrors: { slug: "Already in use — try another." },
    };
  }

  const patch: Record<string, unknown> = {
    ...v,
    credentials: v.credentials || null,
    headline: v.headline || null,
    bio: v.bio || null,
    clinic_name: v.clinic_name || null,
    clinic_address: v.clinic_address || null,
    bank_details: v.bank_details || null,
    standing_meet_link: v.standing_meet_link || null,
    google_calendar_id: v.google_calendar_id || null,
    license_number: v.license_number || null,
    updated_at: new Date().toISOString(),
  };
  // photo_url is owned by the upload widget (/api/dashboard/upload). Only let
  // this form SET it (when a URL was pasted); never let an empty field clear it.
  if (v.photo_url) patch.photo_url = v.photo_url;
  else delete patch.photo_url;

  if (opts.completeOnboarding && !acc.doctor.onboarded_at) {
    patch.onboarded_at = new Date().toISOString();
    patch.is_active = true;
  }

  const { error } = await sb
    .from("doctors")
    .update(patch)
    .eq("id", acc.doctor.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/doctors");
  revalidatePath(`/doctors/${v.slug}`);
  return { ok: true };
}

export async function setListingActive(active: boolean): Promise<ActionResult> {
  const acc = await requireDoctor();
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("doctors")
    .update({ is_active: active, updated_at: new Date().toISOString() })
    .eq("id", acc.doctor.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/doctors");
  revalidatePath(`/doctors/${acc.doctor.slug}`);
  return { ok: true };
}

/** Replace the entire weekly template in one transaction-like operation. */
export async function saveWeeklyRules(raw: unknown): Promise<ActionResult> {
  const acc = await requireDoctor();
  const parsed = availabilityRulesSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some rows are invalid.",
      fieldErrors: zodToFieldErrors(parsed.error.issues),
    };
  }
  const sb = supabaseAdmin();
  const { error: delErr } = await sb
    .from("availability_rules")
    .delete()
    .eq("doctor_id", acc.doctor.id);
  if (delErr) return { ok: false, error: delErr.message };

  if (parsed.data.rules.length > 0) {
    const rows = parsed.data.rules.map((r) => ({
      doctor_id: acc.doctor.id,
      weekday: r.weekday,
      start_time: r.start_time,
      end_time: r.end_time,
      mode: r.mode,
      is_active: true,
    }));
    const { error: insErr } = await sb.from("availability_rules").insert(rows);
    if (insErr) return { ok: false, error: insErr.message };
  }

  await refreshNextAvailable(acc.doctor.id);
  revalidatePath("/dashboard/availability");
  revalidatePath("/doctors");
  revalidatePath(`/doctors/${acc.doctor.slug}`);
  return { ok: true };
}

export async function addOverride(raw: unknown): Promise<ActionResult> {
  const acc = await requireDoctor();
  const parsed = availabilityOverrideSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid override.",
    };
  }
  const v = parsed.data;
  const sb = supabaseAdmin();
  const { error } = await sb.from("availability_overrides").insert({
    doctor_id: acc.doctor.id,
    date: v.date,
    type: v.type,
    start_time: v.type === "extra" ? v.start_time || null : v.start_time || null,
    end_time: v.type === "extra" ? v.end_time || null : v.end_time || null,
    reason: v.reason || null,
  });
  if (error) return { ok: false, error: error.message };
  await refreshNextAvailable(acc.doctor.id);
  revalidatePath("/dashboard/availability");
  revalidatePath("/doctors");
  revalidatePath(`/doctors/${acc.doctor.slug}`);
  return { ok: true };
}

export async function deleteOverride(id: string): Promise<ActionResult> {
  const acc = await requireDoctor();
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("availability_overrides")
    .delete()
    .eq("id", id)
    .eq("doctor_id", acc.doctor.id);
  if (error) return { ok: false, error: error.message };
  await refreshNextAvailable(acc.doctor.id);
  revalidatePath("/dashboard/availability");
  revalidatePath("/doctors");
  revalidatePath(`/doctors/${acc.doctor.slug}`);
  return { ok: true };
}
