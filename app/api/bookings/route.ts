import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { bookingSchema } from "@/lib/validation/schemas";
import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabase/admin";
import { verifySlotBookable } from "@/lib/data/schedule";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getPaymentProvider } from "@/lib/payments";
import { notify } from "@/lib/notifications";
import { attachMeet, manageUrl, templateCtx } from "@/lib/data/appointments";
import { env } from "@/lib/env";
import { site } from "@/lib/site";
import type { AppointmentRow, DoctorRow, PatientRow } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!hasSupabaseAdmin()) {
    return NextResponse.json(
      { error: "Bookings are not available until the database is configured." },
      { status: 503 },
    );
  }

  const ip = clientIp(req);
  const rl = rateLimit(`book:${ip}`, { limit: 6, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid booking data" },
      { status: 422 },
    );
  }
  const v = parsed.data;
  const sb = supabaseAdmin();

  // 1. doctor
  const { data: doctor } = await sb
    .from("doctors")
    .select("*")
    .eq("slug", v.doctor_slug)
    .maybeSingle<DoctorRow>();
  if (!doctor || !doctor.is_active) {
    return NextResponse.json(
      { error: "This specialist is not currently accepting bookings." },
      { status: 404 },
    );
  }
  if (v.mode === "online" && !doctor.online_enabled) {
    return NextResponse.json(
      { error: "This specialist is not offering online consultations." },
      { status: 422 },
    );
  }
  if (v.mode === "in_person" && !doctor.in_person_enabled) {
    return NextResponse.json(
      { error: "This specialist is not offering in-person visits." },
      { status: 422 },
    );
  }
  if (v.payment_method === "online" && env.paymentProvider === "manual") {
    return NextResponse.json(
      { error: "Online payment is unavailable. Please choose bank transfer." },
      { status: 422 },
    );
  }
  if (v.payment_method === "bank_transfer" && !doctor.bank_details) {
    return NextResponse.json(
      { error: "Bank transfer details are not set up for this specialist." },
      { status: 422 },
    );
  }

  // 2. re-check the slot server-side
  const check = await verifySlotBookable({
    doctorId: doctor.id,
    mode: v.mode,
    slotStartIso: v.slot_start,
  });
  if (!check.ok) {
    return NextResponse.json(
      { error: "That time is no longer available. Please pick another slot." },
      { status: 409 },
    );
  }

  const start = DateTime.fromISO(v.slot_start, { zone: "utc" });
  const end = start.plus({ minutes: doctor.slot_duration_min });

  // 3. upsert patient (dedupe by email)
  const email = v.email.toLowerCase();
  const { data: existingPatient } = await sb
    .from("patients")
    .select("*")
    .eq("email", email)
    .maybeSingle<PatientRow>();

  let patient = existingPatient;
  if (patient) {
    await sb
      .from("patients")
      .update({
        full_name: v.full_name,
        phone: v.phone,
        whatsapp_opt_in: v.whatsapp_opt_in,
      })
      .eq("id", patient.id);
  } else {
    const { data: created, error: pErr } = await sb
      .from("patients")
      .insert({
        full_name: v.full_name,
        email,
        phone: v.phone,
        whatsapp_opt_in: v.whatsapp_opt_in,
      })
      .select("*")
      .single<PatientRow>();
    if (pErr || !created) {
      return NextResponse.json(
        { error: "Could not save your details. Please try again." },
        { status: 500 },
      );
    }
    patient = created;
  }

  // 4. insert appointment (relies on the DB exclusion constraint as the final
  //    race guard — a 23P01 means someone booked the slot microseconds earlier)
  const { data: appointment, error: aErr } = await sb
    .from("appointments")
    .insert({
      doctor_id: doctor.id,
      patient_id: patient.id,
      starts_at: start.toISO(),
      ends_at: end.toISO(),
      doctor_timezone: doctor.timezone,
      mode: v.mode,
      status: "pending_payment",
      concern: v.concern || null,
      fee_pkr: doctor.consultation_fee_pkr,
      currency: doctor.currency,
      payment_method: v.payment_method,
      payment_status: "unpaid",
    })
    .select("*")
    .single<AppointmentRow>();

  if (aErr || !appointment) {
    const conflict = aErr?.code === "23P01" || aErr?.code === "23505";
    return NextResponse.json(
      {
        error: conflict
          ? "That time was just taken. Please pick another slot."
          : "Could not create the booking. Please try again.",
      },
      { status: conflict ? 409 : 500 },
    );
  }

  // 5. Google Meet (online only; degrades to null / standing link)
  let current = appointment;
  if (v.mode === "online") {
    current = await attachMeet(appointment, doctor, patient);
  }

  // 6. notifications: patient ack + doctor alert (fire-and-forget)
  const ctx = templateCtx(current, doctor, patient);
  void notify({
    event: "booking_received",
    appointmentId: current.id,
    to: { email: patient.email, whatsapp: patient.phone, name: patient.full_name },
    ctx,
    whatsappOptIn: patient.whatsapp_opt_in,
  });
  void notify({
    event: "new_booking_doctor",
    appointmentId: current.id,
    to: { email: null, whatsapp: null, name: doctor.full_name },
    ctx: { ...ctx, manageUrl: `${site.url}/dashboard/appointments` },
  });

  // 7. payment branch
  if (v.payment_method === "online") {
    try {
      const provider = getPaymentProvider();
      const checkout = await provider.createCheckout({
        appointmentId: current.id,
        amountPkr: doctor.consultation_fee_pkr ?? 0,
        customerEmail: patient.email,
        customerName: patient.full_name,
        description: `Dermatology consultation with ${doctor.full_name}`,
        successUrl: manageUrl(current.manage_token),
        cancelUrl: `${manageUrl(current.manage_token)}?payment=cancelled`,
        webhookUrl: `${site.url}/api/webhooks/payments`,
      });
      if (checkout.providerRef) {
        await sb
          .from("appointments")
          .update({ payment_reference: checkout.providerRef })
          .eq("id", current.id);
      }
      return NextResponse.json({
        appointment_id: current.id,
        manage_token: current.manage_token,
        redirect_url: checkout.redirectUrl,
      });
    } catch (e) {
      console.error("checkout failed:", (e as Error).message);
      return NextResponse.json(
        {
          error:
            "Booking held, but we couldn't start the payment. Open your booking to pay by bank transfer.",
          manage_token: current.manage_token,
        },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({
    appointment_id: current.id,
    manage_token: current.manage_token,
    redirect_url: null,
  });
}
