# Setup — Northline Dermatology

A Next.js (App Router) platform for multi-doctor online/in-person dermatology
consultations: live availability, instant booking, automatic Google Meet links,
online + bank-transfer payments, email + WhatsApp notifications.

`Northline Dermatology` is a **placeholder brand**. To rebrand, edit
[`lib/site.ts`](lib/site.ts) and set `NEXT_PUBLIC_BRAND_NAME`.

---

## 0. Prerequisites

- Node 20+
- Accounts: **Supabase**, **Clerk** (required); **Resend**, **Twilio**,
  **Google Cloud + Workspace**, **Safepay** (optional — the app degrades
  gracefully without each one).

```bash
npm install
cp .env.example .env.local   # then fill in as you go
npm run dev
```

With **no** env vars the marketing site still renders; bookings and the
dashboard need Supabase + Clerk.

---

## 1. Supabase (database + storage)

1. Create a project. From **Project settings → API** copy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (keep server-side only)
2. Run the migrations in order (SQL editor, or `supabase db push`) — or paste
   `supabase/BUNDLE_run_in_sql_editor.sql` (all migrations + seed, safe to
   re-run):
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_storage.sql`
   - `supabase/migrations/0004_features.sql` — reviews, waitlist, "next
     available", iCal token, credential verification
3. (Optional) run `supabase/seed.sql` for a demo doctor + 3 articles. Edit the
   `clerk_user_id` placeholder afterwards, or re-claim the row (see §2).
4. Buckets `payment-proofs` + `doctor-licenses` (private) and `doctor-photos`
   (public) are created by the migrations.

The `appointments_no_overlap` exclusion constraint (needs `btree_gist`) is what
makes instant booking race-safe — do not drop it.

---

## 2. Clerk (doctor authentication)

1. Create an application. Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and
   `CLERK_SECRET_KEY`.
2. **Webhooks → Add endpoint**: `https://<your-domain>/api/webhooks/clerk`,
   events `user.created`, `user.updated`. Copy the signing secret to
   `CLERK_WEBHOOK_SIGNING_SECRET`.
3. A `doctors` row is created automatically on first dashboard visit
   (`getDoctorAccount`) — the webhook is a backstop.
4. **Admin role**: in Clerk → the user → **Public metadata**, set
   `{ "role": "admin" }`. Admins get `/dashboard/admin`.
5. To claim the seeded Dr. Sana profile: sign up, then in Supabase set that
   `doctors.clerk_user_id` to your Clerk user id (`user_...`).

New doctors go **live immediately** after completing onboarding (no approval
gate) — an admin can hide a listing from `/dashboard/admin`.

---

## 3. Resend (email) — optional

1. Verify a sending domain. Create an API key → `RESEND_API_KEY`.
2. Set `EMAIL_FROM`, e.g. `Northline Dermatology <care@yourdomain.com>`.
3. Without this, emails are skipped and logged to `notifications_log`.

---

## 4. WhatsApp — optional

Set `WHATSAPP_PROVIDER` to `meta`, `twilio` or `none` (default).

**Recommended: Meta WhatsApp Cloud API** (free tier, no Twilio markup)

1. [developers.facebook.com](https://developers.facebook.com) → create an app →
   add the **WhatsApp** product. You get a test number immediately.
2. Copy the temporary access token → `META_WHATSAPP_TOKEN`, and the phone number
   ID → `META_WHATSAPP_PHONE_ID`. (For production: add a real number, verify the
   business, generate a permanent token, and get **utility templates** approved —
   free-form text only delivers within 24h of a user message.)
3. `META_WHATSAPP_API_VERSION` defaults to `v21.0`.

**Twilio** (legacy): set `WHATSAPP_PROVIDER=twilio` +
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`.

**No API:** set `NEXT_PUBLIC_CLINIC_WHATSAPP_NUMBER` (E.164 digits, no `+`) to
show a "Message the clinic on WhatsApp" button on the booking page — works with
any provider setting, including `none`.

Patients opt in via the booking form; WhatsApp is skipped if opted out or
unconfigured, and every attempt is written to `notifications_log`.

---

## 5. Google Meet links — optional

The platform creates a real Meet link per online booking via the Calendar API.

1. Google Cloud project → enable **Google Calendar API**.
2. Create a **service account**; download the JSON key.
3. In **Google Workspace Admin → Security → API controls → Domain-wide
   delegation**, add the service account's client ID with scope
   `https://www.googleapis.com/auth/calendar.events`.
4. Env:
   - `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64` = `base64 -w0 service-account.json`
   - `GOOGLE_IMPERSONATED_USER` = a Workspace user the SA acts as (its calendar
     hosts the events)
   - `GOOGLE_CALENDAR_ID` = `primary` (or a dedicated calendar id)
5. Per-doctor override: a doctor can set their own `google_calendar_id` or a
   `standing_meet_link` fallback in **Profile & settings**.

Without this, bookings still succeed with no link; the dashboard shows an
"add link" field on each online appointment.

---

## 6. Payments

`PAYMENT_PROVIDER` = `safepay` | `payfast` | `manual`.

- **manual** (default): bank transfer only. The doctor's `bank_details` are
  shown on the booking page; the patient uploads a receipt; the doctor verifies
  it in **Appointments → Receipts to verify**.
- **safepay**: implemented hosted-checkout in
  [`lib/payments/safepay.ts`](lib/payments/safepay.ts). Set `SAFEPAY_ENVIRONMENT`,
  `SAFEPAY_API_KEY`, `SAFEPAY_SECRET_KEY`, `SAFEPAY_WEBHOOK_SECRET`. Point the
  Safepay webhook at `https://<domain>/api/webhooks/payments`. Verify the
  `/order/v1/init` path and checkout host against your Safepay dashboard — they
  vary by account.
- **payfast**: adapter stub — implement `createCheckout` / `verifyWebhook` in
  [`lib/payments/payfast.ts`](lib/payments/payfast.ts).

Bank transfer stays available alongside any online provider.

---

## 7. Cron jobs

[`vercel.json`](vercel.json) registers:

| Path | Schedule | Purpose |
|---|---|---|
| `/api/cron/release-unpaid` | every 10 min | cancel unpaid holds older than `HOLD_MINUTES_UNPAID` (default 30) |
| `/api/cron/reminders` | every 15 min | send 24h and 1h reminders |

Set `CRON_SECRET`. Vercel sends it as `Authorization: Bearer <CRON_SECRET>`
automatically. Locally:
`curl "http://localhost:3000/api/cron/reminders?secret=$CRON_SECRET"`.
(Vercel Hobby limits cron frequency — use Pro, or an external scheduler hitting
the same URLs with the secret.)

---

## 8. Deploy (Vercel)

1. Import the repo. Add every variable from `.env.local`.
2. Set `NEXT_PUBLIC_APP_URL` to the production URL (used in emails, webhooks,
   Meet descriptions, manage links).
3. Update the Clerk webhook, Safepay webhook and Google redirect origins to the
   production domain.

---

## Local verification checklist

1. `npm run dev`, open `/` — marketing site renders in the cream/green theme.
2. Run migrations + seed → `/doctors` lists Dr. Sana → `/doctors/sana-siddiqui`
   shows a live slot grid.
3. Sign up at `/sign-up` → complete onboarding → `/dashboard/availability`: set a
   weekly block and one date override; the "what patients see" preview updates.
4. Incognito → book a slot (bank transfer) → upload any image on
   `/booking/<token>` → back in the dashboard, **Receipts to verify** → confirm →
   status flips to `confirmed`, Meet link generated (if Google configured).
5. Reschedule then cancel from `/booking/<token>`.
6. `curl` both cron endpoints with `?secret=`.
7. `npm run test` — scheduling-engine unit tests pass.
