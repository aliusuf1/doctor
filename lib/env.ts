/**
 * Central environment access + "is this integration configured?" flags.
 * Keeps optional integrations from crashing the app when their keys are absent.
 */

function opt(name: string) {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v : undefined;
}

export const env = {
  appUrl: opt("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000",

  supabaseUrl: opt("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: opt("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceKey: opt("SUPABASE_SERVICE_ROLE_KEY"),

  clerkPublishable: opt("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
  clerkSecret: opt("CLERK_SECRET_KEY"),
  clerkWebhookSecret: opt("CLERK_WEBHOOK_SIGNING_SECRET"),

  resendApiKey: opt("RESEND_API_KEY"),
  emailFrom: opt("EMAIL_FROM") ?? "Northline Dermatology <onboarding@resend.dev>",

  // WhatsApp provider: "meta" (WhatsApp Cloud API, free tier) | "twilio" | "none"
  whatsappProvider: (opt("WHATSAPP_PROVIDER") ?? "none") as
    | "meta"
    | "twilio"
    | "none",
  // Meta WhatsApp Cloud API
  metaWhatsappToken: opt("META_WHATSAPP_TOKEN"),
  metaWhatsappPhoneId: opt("META_WHATSAPP_PHONE_ID"),
  metaWhatsappApiVersion: opt("META_WHATSAPP_API_VERSION") ?? "v21.0",
  // Twilio (legacy option)
  twilioSid: opt("TWILIO_ACCOUNT_SID"),
  twilioToken: opt("TWILIO_AUTH_TOKEN"),
  twilioWhatsappFrom: opt("TWILIO_WHATSAPP_FROM"),
  // wa.me fallback: clinic's WhatsApp number in E.164 without "+", e.g. 923001234567
  clinicWhatsappNumber: opt("NEXT_PUBLIC_CLINIC_WHATSAPP_NUMBER"),

  googleServiceAccountB64: opt("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64"),
  googleImpersonatedUser: opt("GOOGLE_IMPERSONATED_USER"),
  googleCalendarId: opt("GOOGLE_CALENDAR_ID") ?? "primary",

  paymentProvider: (opt("PAYMENT_PROVIDER") ?? "manual") as
    | "safepay"
    | "payfast"
    | "manual",
  safepayEnv: (opt("SAFEPAY_ENVIRONMENT") ?? "sandbox") as
    | "sandbox"
    | "production",
  safepayApiKey: opt("SAFEPAY_API_KEY"),
  safepaySecret: opt("SAFEPAY_SECRET_KEY"),
  safepayWebhookSecret: opt("SAFEPAY_WEBHOOK_SECRET"),
  payfastMerchantId: opt("PAYFAST_MERCHANT_ID"),
  payfastMerchantKey: opt("PAYFAST_MERCHANT_KEY"),
  payfastPassphrase: opt("PAYFAST_PASSPHRASE"),

  cronSecret: opt("CRON_SECRET"),

  holdMinutesUnpaid: Number(opt("HOLD_MINUTES_UNPAID") ?? "30"),
} as const;

export const isConfigured = {
  supabase: Boolean(env.supabaseUrl && env.supabaseAnonKey),
  supabaseAdmin: Boolean(env.supabaseUrl && env.supabaseServiceKey),
  clerk: Boolean(env.clerkPublishable && env.clerkSecret),
  email: Boolean(env.resendApiKey),
  whatsapp:
    (env.whatsappProvider === "meta" &&
      Boolean(env.metaWhatsappToken && env.metaWhatsappPhoneId)) ||
    (env.whatsappProvider === "twilio" &&
      Boolean(env.twilioSid && env.twilioToken && env.twilioWhatsappFrom)),
  googleMeet: Boolean(env.googleServiceAccountB64 && env.googleImpersonatedUser),
  onlinePayments:
    (env.paymentProvider === "safepay" &&
      Boolean(env.safepayApiKey && env.safepaySecret)) ||
    (env.paymentProvider === "payfast" &&
      Boolean(env.payfastMerchantId && env.payfastMerchantKey)),
} as const;
