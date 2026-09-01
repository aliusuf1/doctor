import "server-only";
import { env } from "@/lib/env";
import type { PaymentProvider } from "./types";
import { safepayProvider } from "./safepay";
import { payfastProvider } from "./payfast";

/** The "manual" provider: bank transfer only, no redirect. */
const manualProvider: PaymentProvider = {
  id: "manual",
  online: false,
  async createCheckout() {
    return { redirectUrl: null, providerRef: null };
  },
  async verifyWebhook() {
    return {
      appointmentId: "",
      status: "ignored",
      providerRef: null,
      amountPkr: null,
      raw: null,
    };
  },
};

export function getPaymentProvider(): PaymentProvider {
  switch (env.paymentProvider) {
    case "safepay":
      return safepayProvider;
    case "payfast":
      return payfastProvider;
    default:
      return manualProvider;
  }
}

export * from "./types";
