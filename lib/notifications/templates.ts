import { DateTime } from "luxon";
import { site } from "@/lib/site";
import { formatPkr } from "@/lib/utils";

export type NotificationEvent =
  | "booking_received"
  | "payment_verified"
  | "appointment_confirmed"
  | "reminder_24h"
  | "reminder_1h"
  | "rescheduled"
  | "cancelled_by_patient"
  | "cancelled_by_doctor"
  | "proof_received_doctor"
  | "new_booking_doctor"
  | "waitlist_slot_open";

export interface TemplateContext {
  patientName: string;
  doctorName: string;
  startsAtIso: string;
  timezone: string;
  mode: "online" | "in_person";
  feePkr: number | null;
  meetLink: string | null;
  manageUrl: string;
  bankDetails?: string | null;
  reason?: string | null;
}

function when(ctx: TemplateContext) {
  return DateTime.fromISO(ctx.startsAtIso)
    .setZone(ctx.timezone)
    .toFormat("cccc d LLLL yyyy, h:mm a") + ` (${ctx.timezone})`;
}

export interface RenderedMessage {
  subject: string;
  text: string;
}

export function renderMessage(
  event: NotificationEvent,
  ctx: TemplateContext,
): RenderedMessage {
  const w = when(ctx);
  const modeLabel = ctx.mode === "online" ? "Online video" : "In person";

  switch (event) {
    case "booking_received":
      return {
        subject: `Appointment request received — ${ctx.doctorName}`,
        text: [
          `Hi ${ctx.patientName},`,
          ``,
          `We've received your request for a ${modeLabel.toLowerCase()} consultation with ${ctx.doctorName}:`,
          `  ${w}`,
          ctx.feePkr != null ? `  Fee: ${formatPkr(ctx.feePkr)}` : ``,
          ``,
          `Your slot is held while payment is verified.`,
          ctx.bankDetails
            ? `\nBank transfer details:\n${ctx.bankDetails}\n\nUpload your receipt here: ${ctx.manageUrl}`
            : `Manage your booking: ${ctx.manageUrl}`,
          ``,
          `— ${site.name}`,
          site.legal.notEmergency,
        ]
          .filter(Boolean)
          .join("\n"),
      };

    case "payment_verified":
    case "appointment_confirmed":
      return {
        subject: `Confirmed: ${ctx.doctorName}, ${w}`,
        text: [
          `Hi ${ctx.patientName},`,
          ``,
          `Your consultation with ${ctx.doctorName} is confirmed.`,
          `  ${w}`,
          `  ${modeLabel}`,
          ctx.meetLink ? `  Join: ${ctx.meetLink}` : ``,
          ``,
          `Manage or reschedule: ${ctx.manageUrl}`,
          ``,
          `— ${site.name}`,
        ]
          .filter(Boolean)
          .join("\n"),
      };

    case "reminder_24h":
      return {
        subject: `Reminder: consultation tomorrow — ${ctx.doctorName}`,
        text: `Hi ${ctx.patientName},\n\nThis is a reminder of your consultation with ${ctx.doctorName}:\n  ${w}\n  ${modeLabel}\n${
          ctx.meetLink ? `  Join: ${ctx.meetLink}\n` : ""
        }\nManage: ${ctx.manageUrl}\n\n— ${site.name}`,
      };

    case "reminder_1h":
      return {
        subject: `Starting soon: ${ctx.doctorName}`,
        text: `Hi ${ctx.patientName},\n\nYour consultation with ${ctx.doctorName} starts at ${w}.\n${
          ctx.meetLink ? `Join: ${ctx.meetLink}\n` : ""
        }\n— ${site.name}`,
      };

    case "rescheduled":
      return {
        subject: `Rescheduled: ${ctx.doctorName}, ${w}`,
        text: `Hi ${ctx.patientName},\n\nYour consultation with ${ctx.doctorName} has been rescheduled to:\n  ${w}\n  ${modeLabel}\n${
          ctx.meetLink ? `  Join: ${ctx.meetLink}\n` : ""
        }\nManage: ${ctx.manageUrl}\n\n— ${site.name}`,
      };

    case "cancelled_by_patient":
    case "cancelled_by_doctor":
      return {
        subject: `Cancelled: consultation with ${ctx.doctorName}`,
        text: `Hi ${ctx.patientName},\n\nYour consultation with ${ctx.doctorName} on ${w} has been cancelled${
          ctx.reason ? ` (${ctx.reason})` : ""
        }.\n\nYou can book again any time: ${site.url}/doctors\n\n— ${site.name}`,
      };

    case "proof_received_doctor":
      return {
        subject: `Payment receipt uploaded — ${ctx.patientName}`,
        text: `${ctx.patientName} uploaded a payment receipt for the consultation on ${w}.\n\nReview and confirm: ${ctx.manageUrl}`,
      };

    case "waitlist_slot_open":
      return {
        subject: `A slot opened up — ${ctx.doctorName}`,
        text: `Hi ${ctx.patientName},\n\nYou asked to be told if an appointment opened with ${ctx.doctorName} around ${DateTime.fromISO(
          ctx.startsAtIso,
        ).toFormat("cccc d LLLL")}. One is available now — first to book keeps it:\n\n${ctx.manageUrl}\n\n— ${site.name}`,
      };

    case "new_booking_doctor":
      return {
        subject: `New booking — ${ctx.patientName}, ${w}`,
        text: `New ${modeLabel.toLowerCase()} booking from ${ctx.patientName} for ${w}.\n${
          ctx.feePkr != null ? `Fee: ${formatPkr(ctx.feePkr)}\n` : ""
        }\nOpen dashboard: ${ctx.manageUrl}`,
      };
  }
}
