import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabase/admin";
import { loadAppointmentBundle } from "@/lib/data/appointments";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(800).optional().or(z.literal("")),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

  const rl = rateLimit(`review:${clientIp(req)}`, { limit: 8, windowMs: 300_000 });
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review" }, { status: 422 });
  }

  const bundle = await loadAppointmentBundle({ id });
  if (!bundle || bundle.appointment.manage_token !== token) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (bundle.appointment.status !== "completed") {
    return NextResponse.json(
      { error: "You can review once the consultation is complete." },
      { status: 409 },
    );
  }

  const sb = supabaseAdmin();
  const { error } = await sb.from("reviews").upsert(
    {
      appointment_id: id,
      doctor_id: bundle.appointment.doctor_id,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
      patient_name: bundle.patient.full_name,
      published: true,
    },
    { onConflict: "appointment_id" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
