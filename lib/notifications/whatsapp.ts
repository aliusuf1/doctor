import "server-only";
import { env } from "@/lib/env";

export interface WhatsappResult {
  status: "sent" | "failed" | "skipped_no_config";
  error?: string;
}

/**
 * Send a plain-text WhatsApp message. Dispatches on WHATSAPP_PROVIDER.
 *
 * - "meta": WhatsApp Cloud API (free tier). Note: outside the 24-hour customer
 *   service window, Meta only delivers pre-approved template messages. This
 *   sender uses a free-form text message, which works for replies within 24h of
 *   a user message and for numbers in your allow-list during testing. For
 *   production reminders, switch `type` to an approved "template".
 * - "twilio": legacy.
 * - "none": no-op.
 */
export async function sendWhatsapp(
  toE164: string,
  text: string,
): Promise<WhatsappResult> {
  const to = toE164.replace(/[^\d]/g, "");
  if (!to) return { status: "failed", error: "no recipient" };

  if (env.whatsappProvider === "meta") {
    if (!env.metaWhatsappToken || !env.metaWhatsappPhoneId) {
      return { status: "skipped_no_config" };
    }
    try {
      const res = await fetch(
        `https://graph.facebook.com/${env.metaWhatsappApiVersion}/${env.metaWhatsappPhoneId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.metaWhatsappToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "text",
            text: { preview_url: false, body: text },
          }),
        },
      );
      if (!res.ok) {
        const body = await res.text();
        return { status: "failed", error: `${res.status} ${body.slice(0, 200)}` };
      }
      return { status: "sent" };
    } catch (e) {
      return { status: "failed", error: (e as Error).message };
    }
  }

  if (env.whatsappProvider === "twilio") {
    if (!env.twilioSid || !env.twilioToken || !env.twilioWhatsappFrom) {
      return { status: "skipped_no_config" };
    }
    try {
      const { default: twilio } = await import("twilio");
      const client = twilio(env.twilioSid, env.twilioToken);
      await client.messages.create({
        from: env.twilioWhatsappFrom,
        to: `whatsapp:+${to}`,
        body: text,
      });
      return { status: "sent" };
    } catch (e) {
      return { status: "failed", error: (e as Error).message };
    }
  }

  return { status: "skipped_no_config" };
}
