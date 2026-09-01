import { NextResponse } from "next/server";
import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabase/admin";
import { getPaymentProvider } from "@/lib/payments";
import { confirmAppointment } from "@/lib/data/appointments";

export const dynamic = "force-dynamic";

/** Payment gateway callback. Verifies the signature, then confirms the booking. */
export async function POST(req: Request) {
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const provider = getPaymentProvider();
  const result = await provider.verifyWebhook(req);

  if (result.status === "ignored" || !result.appointmentId) {
    return NextResponse.json({ received: true, handled: false });
  }

  const sb = supabaseAdmin();
  const { data: appointment } = await sb
    .from("appointments")
    .select("id, status, payment_status, fee_pkr")
    .eq("id", result.appointmentId)
    .maybeSingle();

  if (!appointment) {
    return NextResponse.json({ received: true, handled: false });
  }

  await sb.from("payments").insert({
    appointment_id: result.appointmentId,
    provider: provider.id,
    provider_ref: result.providerRef,
    amount_pkr: result.amountPkr ?? appointment.fee_pkr ?? 0,
    status: result.status,
    raw_payload: result.raw as never,
  });

  if (result.status === "paid") {
    await sb
      .from("appointments")
      .update({
        payment_status: "verified",
        payment_reference: result.providerRef,
        updated_at: new Date().toISOString(),
      })
      .eq("id", result.appointmentId);
    await confirmAppointment(result.appointmentId);
  } else {
    await sb
      .from("appointments")
      .update({ payment_status: "failed" })
      .eq("id", result.appointmentId);
  }

  return NextResponse.json({ received: true, handled: true });
}
