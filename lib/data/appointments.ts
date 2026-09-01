import "server-only";
import { DateTime } from "luxon";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { site } from "@/lib/site";
import { notify } from "@/lib/notifications";
import {
  createMeetEvent,
  deleteMeetEvent,
  updateMeetEvent,
} from "@/lib/google/calendar";
import { refreshNextAvailable } from "@/lib/data/next-available";
import { notifyWaitlistForDate } from "@/lib/data/waitlist";
import type {
  AppointmentRow,
  DoctorRow,
  PatientRow,
} from "@/lib/db/types";
import type { TemplateContext } from "@/lib/notifications/templates";

export function manageUrl(token: string) {
  return `${site.url}/booking/${token}`;
}

export function templateCtx(
  a: AppointmentRow,
  d: Pick<DoctorRow, "full_name" | "timezone" | "bank_details">,
  p: Pick<PatientRow, "full_name">,
): TemplateContext {
  return {
    patientName: p.full_name,
    doctorName: d.full_name,
    startsAtIso: a.starts_at,
    timezone: a.doctor_timezone || d.timezone,
    mode: a.mode,
    feePkr: a.fee_pkr,
    meetLink: a.meet_link,
    manageUrl: manageUrl(a.manage_token),
    bankDetails: d.bank_details,
  };
}

export async function loadAppointmentBundle(
  where: { id: string } | { token: string },
) {
  const sb = supabaseAdmin();
  let q = sb.from("appointments").select("*");
  q = "id" in where ? q.eq("id", where.id) : q.eq("manage_token", where.token);
  const { data: appointment } = await q.maybeSingle<AppointmentRow>();
  if (!appointment) return null;

  const [{ data: doctor }, { data: patient }] = await Promise.all([
    sb.from("doctors").select("*").eq("id", appointment.doctor_id).single(),
    sb.from("patients").select("*").eq("id", appointment.patient_id).single(),
  ]);
  return {
    appointment,
    doctor: doctor as DoctorRow,
    patient: patient as PatientRow,
  };
}

/** Generate + attach a Google Meet event for an online appointment. */
export async function attachMeet(
  appointment: AppointmentRow,
  doctor: DoctorRow,
  patient: PatientRow,
) {
  if (appointment.mode !== "online") return appointment;
  const res = await createMeetEvent({
    calendarId: doctor.google_calendar_id ?? undefined,
    summary: `Dermatology consultation — ${patient.full_name} with ${doctor.full_name}`,
    description:
      (appointment.concern ? `Concern: ${appointment.concern}\n\n` : "") +
      `Booked via ${site.name}. Manage: ${manageUrl(appointment.manage_token)}`,
    startIso: appointment.starts_at,
    endIso: appointment.ends_at,
    timezone: appointment.doctor_timezone || doctor.timezone,
    attendees: [
      { email: patient.email, displayName: patient.full_name },
      env.googleImpersonatedUser
        ? { email: env.googleImpersonatedUser, displayName: doctor.full_name }
        : { email: patient.email },
    ],
  });

  const meetLink = res.meetLink ?? doctor.standing_meet_link ?? null;
  const { data: updated } = await supabaseAdmin()
    .from("appointments")
    .update({
      meet_link: meetLink,
      google_event_id: res.eventId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointment.id)
    .select("*")
    .single();
  return (updated as AppointmentRow) ?? { ...appointment, meet_link: meetLink };
}

export async function confirmAppointment(id: string, opts: { reason?: string } = {}) {
  void opts;
  const sb = supabaseAdmin();
  const bundle = await loadAppointmentBundle({ id });
  if (!bundle) return { ok: false as const, error: "Not found" };
  const { appointment, doctor, patient } = bundle;
  if (appointment.status === "confirmed") return { ok: true as const };

  let current = appointment;
  if (appointment.mode === "online" && !appointment.meet_link) {
    current = await attachMeet(appointment, doctor, patient);
  }

  const { data: updated } = await sb
    .from("appointments")
    .update({
      status: "confirmed",
      payment_status:
        current.payment_method === "online" ? "verified" : current.payment_status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  const a = (updated as AppointmentRow) ?? current;
  await notify({
    event: "appointment_confirmed",
    appointmentId: a.id,
    to: {
      email: patient.email,
      whatsapp: patient.phone,
      name: patient.full_name,
    },
    ctx: templateCtx(a, doctor, patient),
    whatsappOptIn: patient.whatsapp_opt_in,
  });
  return { ok: true as const };
}

export async function cancelAppointment(
  id: string,
  by: "patient" | "doctor" | "system",
  reason?: string,
) {
  const sb = supabaseAdmin();
  const bundle = await loadAppointmentBundle({ id });
  if (!bundle) return { ok: false as const, error: "Not found" };
  const { appointment, doctor, patient } = bundle;

  if (appointment.google_event_id) {
    await deleteMeetEvent(
      appointment.google_event_id,
      doctor.google_calendar_id ?? undefined,
    );
  }

  await sb
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_by: by,
      cancellation_reason: reason ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (by !== "system") {
    await notify({
      event: by === "doctor" ? "cancelled_by_doctor" : "cancelled_by_patient",
      appointmentId: id,
      to: {
        email: patient.email,
        whatsapp: patient.phone,
        name: patient.full_name,
      },
      ctx: { ...templateCtx(appointment, doctor, patient), reason: reason ?? null },
      whatsappOptIn: patient.whatsapp_opt_in,
    });
  }

  // A slot just freed up — recompute soonest availability and ping the waitlist.
  await refreshNextAvailable(doctor.id);
  const freedDate = DateTime.fromISO(appointment.starts_at)
    .setZone(appointment.doctor_timezone || doctor.timezone)
    .toISODate();
  if (freedDate) {
    void notifyWaitlistForDate(doctor.id, freedDate);
  }
  return { ok: true as const };
}

export async function rescheduleAppointment(params: {
  id: string;
  newStartIso: string;
  by: "patient" | "doctor";
}) {
  const sb = supabaseAdmin();
  const bundle = await loadAppointmentBundle({ id: params.id });
  if (!bundle) return { ok: false as const, error: "Not found" };
  const { appointment, doctor, patient } = bundle;

  const start = DateTime.fromISO(params.newStartIso, { zone: "utc" });
  const end = start.plus({ minutes: doctor.slot_duration_min });

  const { error } = await sb
    .from("appointments")
    .update({
      starts_at: start.toISO(),
      ends_at: end.toISO(),
      updated_at: new Date().toISOString(),
      reminded_24h_at: null,
      reminded_1h_at: null,
    })
    .eq("id", params.id);
  if (error) return { ok: false as const, error: error.message };

  if (appointment.google_event_id) {
    await updateMeetEvent(appointment.google_event_id, {
      calendarId: doctor.google_calendar_id ?? undefined,
      startIso: start.toISO()!,
      endIso: end.toISO()!,
      timezone: appointment.doctor_timezone || doctor.timezone,
    });
  }

  const refreshed = await loadAppointmentBundle({ id: params.id });
  if (refreshed) {
    await notify({
      event: "rescheduled",
      appointmentId: params.id,
      to: {
        email: patient.email,
        whatsapp: patient.phone,
        name: patient.full_name,
      },
      ctx: templateCtx(refreshed.appointment, doctor, patient),
      whatsappOptIn: patient.whatsapp_opt_in,
    });
  }

  await refreshNextAvailable(doctor.id);
  // the vacated original date may now have room
  const vacated = DateTime.fromISO(appointment.starts_at)
    .setZone(appointment.doctor_timezone || doctor.timezone)
    .toISODate();
  if (vacated) void notifyWaitlistForDate(doctor.id, vacated);
  return { ok: true as const };
}
