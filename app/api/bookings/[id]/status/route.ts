import { NextResponse } from "next/server";
import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/bookings/:id/status?token=<manage_token>
 * Tiny polling endpoint the patient's booking page uses to notice when the
 * clinic confirms, adds a video link, reschedules or cancels. Token-guarded —
 * returns only the fields that drive the page's state.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const { data } = await supabaseAdmin()
    .from("appointments")
    .select(
      "status, payment_status, meet_link, starts_at, updated_at, manage_token",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data || data.manage_token !== token) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      status: data.status,
      payment_status: data.payment_status,
      has_link: Boolean(data.meet_link),
      starts_at: data.starts_at,
      updated_at: data.updated_at,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
