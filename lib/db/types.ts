/**
 * Hand-written row types mirroring `supabase/migrations`.
 * Regenerate/replace with `supabase gen types typescript` once a project exists.
 */

export type ConsultationMode = "online" | "in_person";
export type RuleMode = "online" | "in_person" | "both";
export type OverrideType = "block" | "extra";
export type AppointmentStatus =
  | "pending_payment"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";
export type PaymentMethod = "online" | "bank_transfer";
export type PaymentStatus =
  | "unpaid"
  | "submitted"
  | "verified"
  | "refunded"
  | "failed";
export type NotificationChannel = "email" | "whatsapp";

export interface DoctorRow {
  id: string;
  clerk_user_id: string;
  slug: string;
  full_name: string;
  credentials: string | null;
  specialty: string[];
  headline: string | null;
  bio: string | null;
  photo_url: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  city: string;
  timezone: string;
  consultation_fee_pkr: number | null;
  currency: string;
  slot_duration_min: number;
  buffer_min: number;
  min_notice_hours: number;
  booking_horizon_days: number;
  cancellation_notice_hours: number;
  online_enabled: boolean;
  in_person_enabled: boolean;
  bank_details: string | null;
  google_calendar_id: string | null;
  standing_meet_link: string | null;
  is_active: boolean;
  onboarded_at: string | null;
  next_available_at: string | null;
  calendar_token: string;
  license_number: string | null;
  license_path: string | null;
  verified: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewRow {
  id: string;
  appointment_id: string;
  doctor_id: string;
  rating: number;
  comment: string | null;
  patient_name: string;
  published: boolean;
  created_at: string;
}

export interface WaitlistEntryRow {
  id: string;
  doctor_id: string;
  date: string;
  mode: ConsultationMode;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  notified_at: string | null;
}

/** Columns exposed publicly via the `public_doctors` view. */
export type PublicDoctor = Pick<
  DoctorRow,
  | "slug"
  | "full_name"
  | "credentials"
  | "specialty"
  | "headline"
  | "bio"
  | "photo_url"
  | "clinic_name"
  | "city"
  | "timezone"
  | "consultation_fee_pkr"
  | "currency"
  | "slot_duration_min"
  | "online_enabled"
  | "in_person_enabled"
> & {
  verified: boolean;
  next_available_at: string | null;
  rating_avg: number;
  rating_count: number;
};

export interface AvailabilityRuleRow {
  id: string;
  doctor_id: string;
  weekday: number; // 0=Sun .. 6=Sat
  start_time: string; // "HH:MM" or "HH:MM:SS"
  end_time: string;
  mode: RuleMode;
  is_active: boolean;
  created_at: string;
}

export interface AvailabilityOverrideRow {
  id: string;
  doctor_id: string;
  date: string; // "YYYY-MM-DD"
  type: OverrideType;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_at: string;
}

export interface PatientRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  whatsapp_opt_in: boolean;
  created_at: string;
}

export interface AppointmentRow {
  id: string;
  doctor_id: string;
  patient_id: string;
  starts_at: string;
  ends_at: string;
  doctor_timezone: string;
  mode: ConsultationMode;
  status: AppointmentStatus;
  concern: string | null;
  fee_pkr: number | null;
  currency: string;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  payment_proof_path: string | null;
  meet_link: string | null;
  google_event_id: string | null;
  manage_token: string;
  reminded_24h_at: string | null;
  reminded_1h_at: string | null;
  reschedule_of: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface InsightRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  body_md: string;
  read_minutes: number;
  author_doctor_id: string | null;
  published: boolean;
  published_at: string | null;
  cover_url: string | null;
  created_at: string;
}

export interface PaymentRow {
  id: string;
  appointment_id: string;
  provider: string;
  provider_ref: string | null;
  amount_pkr: number;
  status: string;
  raw_payload: unknown;
  created_at: string;
}

export interface NotificationLogRow {
  id: string;
  appointment_id: string | null;
  channel: NotificationChannel;
  template: string;
  to_addr: string;
  status: string;
  error: string | null;
  created_at: string;
}
