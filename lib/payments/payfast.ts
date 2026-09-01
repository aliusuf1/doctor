import "server-only";
import { env } from "@/lib/env";
import type {
  CheckoutInput,
  CheckoutResult,
  PaymentProvider,
  WebhookResult,
} from "./types";

/**
 * PayFast (Pakistan) adapter — STUB.
 *
 * PayFast's live integration uses a two-step token flow (GET_TOKEN, then a
 * redirect to the PayFast transaction page) plus an ITN-style callback. Fill in
 * the endpoints and signing from your PayFast merchant portal, then flip
 * PAYMENT_PROVIDER=payfast.
 */
export const payfastProvider: PaymentProvider = {
  id: "payfast",
  online: true,

  async createCheckout(_input: CheckoutInput): Promise<CheckoutResult> {
    void _input;
    if (!env.payfastMerchantId || !env.payfastMerchantKey) {
      throw new Error("PayFast keys are not configured");
    }
    // TODO: call PayFast GET_TOKEN, then return the transaction-page redirect.
    throw new Error(
      "PayFast adapter is a stub. Implement createCheckout in lib/payments/payfast.ts.",
    );
  },

  async verifyWebhook(_req: Request): Promise<WebhookResult> {
    void _req;
    // TODO: validate PayFast ITN signature + source IP, then map to a result.
    return {
      appointmentId: "",
      status: "ignored",
      providerRef: null,
      amountPkr: null,
      raw: { reason: "payfast-stub" },
    };
  },
};
