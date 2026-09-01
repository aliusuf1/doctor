import "server-only";
import crypto from "node:crypto";
import { env } from "@/lib/env";
import type {
  CheckoutInput,
  CheckoutResult,
  PaymentProvider,
  WebhookResult,
} from "./types";

/**
 * Safepay adapter (Pakistan). Implements the hosted-checkout flow:
 *   1. create a payment session (server-to-server)
 *   2. redirect the customer to the Safepay checkout URL with the tracker token
 *   3. Safepay calls our webhook; we verify the signature and mark the booking paid
 *
 * Docs: https://api.getsafepay.com  (endpoints differ slightly by account age;
 * adjust BASE / paths to match your dashboard's "API" section).
 */
const BASE =
  env.safepayEnv === "production"
    ? "https://api.getsafepay.com"
    : "https://sandbox.api.getsafepay.com";

export const safepayProvider: PaymentProvider = {
  id: "safepay",
  online: true,

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    if (!env.safepayApiKey || !env.safepaySecret) {
      throw new Error("Safepay keys are not configured");
    }

    // Step 1 — create a tracker / payment session.
    const res = await fetch(`${BASE}/order/v1/init`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SFPY-MERCHANT-SECRET": env.safepaySecret,
      },
      body: JSON.stringify({
        client: env.safepayApiKey,
        amount: input.amountPkr,
        currency: "PKR",
        environment: env.safepayEnv,
        order_id: input.appointmentId,
        source: "custom",
        webhook: input.webhookUrl,
        metadata: { appointment_id: input.appointmentId },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Safepay init failed (${res.status}): ${text.slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      data?: { token?: string; tracker?: string };
    };
    const tracker = data.data?.tracker ?? data.data?.token;
    if (!tracker) throw new Error("Safepay init returned no tracker");

    // Step 2 — build the hosted checkout redirect.
    const checkout = new URL(
      env.safepayEnv === "production"
        ? "https://getsafepay.com/checkout/pay"
        : "https://sandbox.getsafepay.com/checkout/pay",
    );
    checkout.searchParams.set("beacon", tracker);
    checkout.searchParams.set("env", env.safepayEnv);
    checkout.searchParams.set("source", "custom");
    checkout.searchParams.set("redirect_url", input.successUrl);
    checkout.searchParams.set("cancel_url", input.cancelUrl);
    checkout.searchParams.set("order_id", input.appointmentId);

    return { redirectUrl: checkout.toString(), providerRef: tracker };
  },

  async verifyWebhook(req: Request): Promise<WebhookResult> {
    const rawBody = await req.text();
    const signature =
      req.headers.get("x-sfpy-signature") ??
      req.headers.get("x-safepay-signature") ??
      "";

    if (env.safepayWebhookSecret) {
      const expected = crypto
        .createHmac("sha256", env.safepayWebhookSecret)
        .update(rawBody)
        .digest("hex");
      const ok =
        signature.length === expected.length &&
        crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
      if (!ok) {
        return {
          appointmentId: "",
          status: "ignored",
          providerRef: null,
          amountPkr: null,
          raw: { reason: "bad-signature" },
        };
      }
    }

    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      /* ignore */
    }

    const data = (body.data ?? body) as Record<string, unknown>;
    const meta = (data.metadata ?? {}) as Record<string, unknown>;
    const appointmentId =
      (meta.appointment_id as string) ??
      (data.order_id as string) ??
      (body.order_id as string) ??
      "";
    const state = String(
      data.state ?? data.status ?? body.type ?? "",
    ).toLowerCase();

    const paid =
      state.includes("paid") ||
      state.includes("completed") ||
      state.includes("success") ||
      state === "tracker.updated.paid";

    return {
      appointmentId,
      status: paid ? "paid" : "failed",
      providerRef:
        (data.tracker as string) ?? (data.token as string) ?? null,
      amountPkr:
        typeof data.amount === "number" ? (data.amount as number) : null,
      raw: body,
    };
  },
};
