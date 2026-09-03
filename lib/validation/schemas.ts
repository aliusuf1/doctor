import { z } from "zod";

export const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Use HH:MM");

export const doctorProfileSchema = z.object({
  full_name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  credentials: z.string().max(160).optional().or(z.literal("")),
  specialty: z.array(z.string().min(1)).max(12),
  headline: z.string().max(400).optional().or(z.literal("")),
  bio: z.string().max(4000).optional().or(z.literal("")),
  photo_url: z.string().url().optional().or(z.literal("")),
  clinic_name: z.string().max(160).optional().or(z.literal("")),
  clinic_address: z.string().max(400).optional().or(z.literal("")),
  city: z.string().min(2).max(80),
  timezone: z.string().min(3).max(64),
  consultation_fee_pkr: z.coerce.number().int().min(0).max(1_000_000),
  slot_duration_min: z.coerce.number().int().min(5).max(180),
  buffer_min: z.coerce.number().int().min(0).max(120),
  min_notice_hours: z.coerce.number().int().min(0).max(720),
  booking_horizon_days: z.coerce.number().int().min(1).max(120),
  cancellation_notice_hours: z.coerce.number().int().min(0).max(336),
  online_enabled: z.boolean(),
  bank_details: z.string().max(1200).optional().or(z.literal("")),
  standing_meet_link: z.string().url().optional().or(z.literal("")),
  google_calendar_id: z.string().max(200).optional().or(z.literal("")),
  license_number: z.string().max(120).optional().or(z.literal("")),
});
export type DoctorProfileInput = z.infer<typeof doctorProfileSchema>;

export const availabilityRuleSchema = z
  .object({
    weekday: z.coerce.number().int().min(0).max(6),
    start_time: timeString,
    end_time: timeString,
  })
  .refine((r) => r.start_time < r.end_time, {
    message: "End time must be after start time",
    path: ["end_time"],
  });

export const availabilityRulesSchema = z.object({
  rules: z.array(availabilityRuleSchema).max(60),
});

export const availabilityOverrideSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    type: z.enum(["block", "extra"]),
    start_time: timeString.optional().or(z.literal("")),
    end_time: timeString.optional().or(z.literal("")),
    reason: z.string().max(200).optional().or(z.literal("")),
  })
  .refine(
    (o) =>
      o.type === "block" ||
      (o.start_time && o.end_time && o.start_time < o.end_time),
    { message: "Extra hours need a valid start and end time", path: ["end_time"] },
  );

export const bookingSchema = z.object({
  doctor_slug: z.string().min(1),
  slot_start: z.string().datetime({ offset: true }),
  full_name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().min(6).max(30),
  concern: z.string().max(2000).optional().or(z.literal("")),
  whatsapp_opt_in: z.boolean().default(true),
  payment_method: z.enum(["online", "bank_transfer"]),
});
export type BookingInput = z.infer<typeof bookingSchema>;
