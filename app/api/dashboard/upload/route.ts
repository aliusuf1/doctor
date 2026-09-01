import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireDoctor } from "@/lib/data/doctor-account";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const MAX = 6 * 1024 * 1024;
const IMG = ["image/jpeg", "image/png", "image/webp"];
const DOC = [...IMG, "application/pdf"];

/**
 * Doctor uploads a profile photo (public bucket) or a credential document
 * (private bucket). Auth = Clerk session + ownership.
 */
export async function POST(req: Request) {
  let acc;
  try {
    acc = await requireDoctor();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const kind = form.get("kind");
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  if (file.size > MAX) {
    return NextResponse.json({ error: "Max 6 MB" }, { status: 413 });
  }

  const sb = supabaseAdmin();
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const bytes = Buffer.from(await file.arrayBuffer());

  if (kind === "photo") {
    if (!IMG.includes(file.type)) {
      return NextResponse.json({ error: "Use JPG, PNG or WEBP" }, { status: 415 });
    }
    const path = `${acc.doctor.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await sb.storage
      .from("doctor-photos")
      .upload(path, bytes, { contentType: file.type, upsert: true });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const { data } = sb.storage.from("doctor-photos").getPublicUrl(path);
    const { error: updErr } = await sb
      .from("doctors")
      .update({ photo_url: data.publicUrl, updated_at: new Date().toISOString() })
      .eq("id", acc.doctor.id);
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
    revalidatePath("/");
    revalidatePath("/dashboard/profile");
    revalidatePath("/doctors");
    revalidatePath(`/doctors/${acc.doctor.slug}`);
    return NextResponse.json({ ok: true, url: data.publicUrl });
  }

  if (kind === "license") {
    if (!DOC.includes(file.type)) {
      return NextResponse.json(
        { error: "Use JPG, PNG, WEBP or PDF" },
        { status: 415 },
      );
    }
    const path = `${acc.doctor.id}/license-${Date.now()}.${ext}`;
    const { error } = await sb.storage
      .from("doctor-licenses")
      .upload(path, bytes, { contentType: file.type, upsert: true });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const { error: updErr } = await sb
      .from("doctors")
      .update({
        license_path: path,
        // any re-upload resets verification
        verified: false,
        verified_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", acc.doctor.id);
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/admin");
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
}
