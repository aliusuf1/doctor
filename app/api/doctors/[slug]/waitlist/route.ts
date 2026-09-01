import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mode: z.enum(["online", "in_person"]),
  full_name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(30).optional().or(z.literal("")),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  const { slug } = await params;
  const rl = rateLimit(`waitlist:${clientIp(req)}`, { limit: 10, windowMs: 300_000 });
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  }
  const v = parsed.data;
  const sb = supabaseAdmin();

  const { data: doctor } = await sb
    .from("doctors")
    .select("id, is_active")
    .eq("slug", slug)
    .maybeSingle();
  if (!doctor || !doctor.is_active) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await sb.from("waitlist_entries").upsert(
    {
      doctor_id: doctor.id,
      date: v.date,
      mode: v.mode,
      full_name: v.full_name,
      email: v.email.toLowerCase(),
      phone: v.phone || null,
      notified_at: null,
    },
    { onConflict: "doctor_id,date,email" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
