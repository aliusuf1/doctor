import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { getDoctorSlotsBySlug } from "@/lib/data/schedule";

export const dynamic = "force-dynamic";

/**
 * GET /api/doctors/:slug/slots?from=YYYY-MM-DD&days=14
 * Returns bookable slots grouped by date (doctor timezone), each slot as
 * UTC ISO instants plus the doctor's timezone for client-side formatting.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(req.url);

  const fromParam = url.searchParams.get("from");
  const days = Math.min(
    45,
    Math.max(1, Number(url.searchParams.get("days") ?? "21")),
  );

  const fromBase = fromParam
    ? DateTime.fromISO(fromParam)
    : DateTime.now();
  if (!fromBase.isValid) {
    return NextResponse.json({ error: "Invalid 'from' date" }, { status: 400 });
  }

  const from = fromBase.startOf("day").toJSDate();
  const to = fromBase.plus({ days }).endOf("day").toJSDate();

  const result = await getDoctorSlotsBySlug({ slug, from, to });
  if (!result) {
    return NextResponse.json(
      { error: "Doctor not found or not accepting bookings" },
      { status: 404 },
    );
  }

  const { context, days: slotDays } = result;
  return NextResponse.json({
    doctor: {
      slug: context.doctor.slug,
      full_name: context.doctor.full_name,
      timezone: context.doctor.timezone,
      slot_duration_min: context.doctor.slot_duration_min,
      fee_pkr: context.doctor.consultation_fee_pkr,
      currency: context.doctor.currency,
      online_enabled: context.doctor.online_enabled,
    },
    days: slotDays,
  });
}
