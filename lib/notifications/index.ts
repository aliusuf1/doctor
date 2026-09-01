import "server-only";
import { Resend } from "resend";
import { env, isConfigured } from "@/lib/env";
import { supabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase/admin";
import { sendWhatsapp } from "./whatsapp";
import {
  renderMessage,
  type NotificationEvent,
  type TemplateContext,
} from "./templates";

interface Recipient {
  email?: string | null;
  whatsapp?: string | null; // E.164, without the "whatsapp:" prefix
  name: string;
}

let resend: Resend | null = null;
function resendClient() {
  if (!isConfigured.email) return null;
  resend ??= new Resend(env.resendApiKey!);
  return resend;
}

async function log(
  appointmentId: string | null,
  channel: "email" | "whatsapp",
  template: string,
  to: string,
  status: string,
  error?: string,
) {
  if (!hasSupabaseAdmin()) {
    console.log(`[notify:${status}] ${channel} ${template} -> ${to} ${error ?? ""}`);
    return;
  }
  try {
    await supabaseAdmin().from("notifications_log").insert({
      appointment_id: appointmentId,
      channel,
      template,
      to_addr: to,
      status,
      error: error ?? null,
    });
  } catch (e) {
    console.error("notifications_log insert failed:", (e as Error).message);
  }
}

/**
 * Fire a notification on both channels. Never throws — every failure is caught
 * and logged so it can't roll back a booking.
 */
export async function notify(params: {
  event: NotificationEvent;
  appointmentId: string | null;
  to: Recipient;
  ctx: TemplateContext;
  whatsappOptIn?: boolean;
}): Promise<void> {
  const { event, appointmentId, to, ctx, whatsappOptIn = true } = params;
  const msg = renderMessage(event, ctx);

  // Email
  if (to.email) {
    const client = resendClient();
    if (!client) {
      await log(appointmentId, "email", event, to.email, "skipped_no_config");
    } else {
      try {
        const { error } = await client.emails.send({
          from: env.emailFrom,
          to: to.email,
          subject: msg.subject,
          text: msg.text,
        });
        await log(
          appointmentId,
          "email",
          event,
          to.email,
          error ? "failed" : "sent",
          error?.message,
        );
      } catch (e) {
        await log(
          appointmentId,
          "email",
          event,
          to.email,
          "failed",
          (e as Error).message,
        );
      }
    }
  }

  // WhatsApp
  if (to.whatsapp && whatsappOptIn) {
    const r = await sendWhatsapp(to.whatsapp, `*${msg.subject}*\n\n${msg.text}`);
    await log(
      appointmentId,
      "whatsapp",
      event,
      to.whatsapp,
      r.status,
      r.error,
    );
  }
}

export type { NotificationEvent, TemplateContext };
