export interface CheckoutInput {
  appointmentId: string;
  amountPkr: number;
  customerEmail: string;
  customerName: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  webhookUrl: string;
}

export interface CheckoutResult {
  /** URL to redirect the patient to, or null for manual/no-redirect providers. */
  redirectUrl: string | null;
  providerRef: string | null;
}

export interface WebhookResult {
  appointmentId: string;
  status: "paid" | "failed" | "ignored";
  providerRef: string | null;
  amountPkr: number | null;
  raw: unknown;
}

export interface PaymentProvider {
  readonly id: "safepay" | "payfast" | "manual";
  readonly online: boolean;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  verifyWebhook(req: Request): Promise<WebhookResult>;
}
