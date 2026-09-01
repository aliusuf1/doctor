import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { isConfigured } from "@/lib/env";
import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Clerk user webhook. On user.created / user.updated we upsert a `doctors` stub
 * so the dashboard has a record to attach onboarding data to. (getDoctorAccount
 * also creates one lazily — this keeps things in sync if a user is created out
 * of band.) Configure the endpoint + signing secret in the Clerk dashboard.
 */
export async function POST(req: NextRequest) {
  if (!isConfigured.clerk || !hasSupabaseAdmin()) {
    return NextResponse.json(
      { ok: false, reason: "not configured" },
      { status: 503 },
    );
  }

  let evt: { type: string; data: Record<string, unknown> };
  try {
    evt = (await verifyWebhook(req)) as unknown as typeof evt;
  } catch {
    return NextResponse.json(
      { ok: false, reason: "bad signature" },
      { status: 400 },
    );
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const data = evt.data;
    const id = data.id as string;
    const first = (data.first_name as string) ?? "";
    const last = (data.last_name as string) ?? "";
    const name = `${first} ${last}`.trim() || "New Specialist";
    const sb = supabaseAdmin();

    const { data: existing } = await sb
      .from("doctors")
      .select("id")
      .eq("clerk_user_id", id)
      .maybeSingle();

    if (!existing) {
      const base = slugify(name) || "specialist";
      let slug = base;
      for (let i = 2; i < 60; i++) {
        const { data: clash } = await sb
          .from("doctors")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (!clash) break;
        slug = `${base}-${i}`;
      }
      await sb.from("doctors").insert({
        clerk_user_id: id,
        slug,
        full_name: name,
        is_active: false,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
