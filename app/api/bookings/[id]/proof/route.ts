import { NextResponse } from "next/server";
import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications";
import { loadAppointmentBundle, templateCtx } from "@/lib/data/appointments";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

const MAX_BYTES = 6 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "pdf"];
const PROOF_BUCKET = "payment-proofs";

/**
 * Patient uploads a bank-transfer receipt. Auth is the manage token (passed as
 * ?token=), not a login. Stores to a PRIVATE bucket; the doctor reviews it in
 * the dashboard via a signed URL.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  const { id } = await params;
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const rl = rateLimit(`proof:${clientIp(req)}`, { limit: 10, windowMs: 300_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many uploads" }, { status: 429 });
  }

  const sb = supabaseAdmin();
  const bundle = await loadAppointmentBundle({ id });
  if (!bundle || bundle.appointment.manage_token !== token) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (bundle.appointment.status === "cancelled") {
    return NextResponse.json(
      { error: "This booking was cancelled." },
      { status: 409 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "That file looks empty." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 6 MB)" }, { status: 413 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const typeOk = !file.type || ALLOWED_TYPES.includes(file.type.toLowerCase());
  const extOk = ALLOWED_EXT.includes(ext);
  if (!typeOk && !extOk) {
    return NextResponse.json(
      { error: "Use a JPG, PNG, WEBP or PDF" },
      { status: 415 },
    );
  }
  const safeExt = extOk ? ext : file.type === "application/pdf" ? "pdf" : "jpg";
  const path = `${bundle.appointment.doctor_id}/${id}-${Date.now()}.${safeExt}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await sb.storage
    .from(PROOF_BUCKET)
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
  if (upErr) {
    return NextResponse.json(
      { error: `Upload failed: ${upErr.message}` },
      { status: 500 },
    );
  }

  await sb
    .from("appointments")
    .update({
      payment_proof_path: path,
      payment_status: "submitted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  void notify({
    event: "proof_received_doctor",
    appointmentId: id,
    to: { email: null, whatsapp: null, name: bundle.doctor.full_name },
    ctx: {
      ...templateCtx(bundle.appointment, bundle.doctor, bundle.patient),
      manageUrl: `${site.url}/dashboard/appointments`,
    },
  });

  return NextResponse.json({ ok: true });
}
