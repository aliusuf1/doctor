# Northline Dermatology

A multi-doctor teledermatology platform — a Next.js rebuild of the reference
single-page site, with a real booking engine behind it.

> **`Northline Dermatology` is a placeholder brand.** Rebrand in
> [`lib/site.ts`](lib/site.ts) + `NEXT_PUBLIC_BRAND_NAME`.

## What it does

- **Public site** — neutral clinic brand, warm-cream / editorial-green theme,
  numbered sections. Home, specialist directory (`/doctors`) with filters,
  per-specialist profile + **live availability calendar** (`/doctors/[slug]`),
  how-it-works, conditions, insights blog, privacy / disclaimer.
- **Guest booking** — patients pick a genuinely-open slot and get an instant
  appointment (held pending payment). No patient login. A tokenised
  self-service page (`/booking/[token]`) shows status + the Google Meet link and
  allows reschedule / cancel / receipt upload.
- **Payments** — consultation fee shown up front. **Online** via a
  Pakistan gateway (Safepay implemented, PayFast stubbed) **or** **bank
  transfer + receipt upload**, which the doctor verifies to confirm.
- **Google Meet** — a Meet link is generated automatically per online booking
  (Google Calendar API); event is patched / deleted on reschedule / cancel.
- **Notifications** — email (Resend) + WhatsApp (Twilio) for booking, payment
  verified, confirmation, 24h / 1h reminders, reschedule, cancellation. Every
  send is logged; failures never roll back a booking.
- **Doctor dashboard** (`/dashboard`, Clerk auth) — onboarding, weekly
  availability template + date overrides with a "what patients see" preview,
  appointment management (verify payment, complete, no-show, cancel, reschedule,
  add/replace link), profile & settings, pause listing.
- **Admin** — `role: admin` in Clerk metadata unlocks `/dashboard/admin` to
  hide / re-enable specialists and see platform totals.
- **Cron** — release unpaid holds (>30 min), send reminders. See
  [`vercel.json`](vercel.json).

New doctors go **live immediately** after onboarding (no approval gate).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Clerk (doctor
auth) · Supabase (Postgres + Storage, RLS) · Luxon (DST-safe slot maths) · Zod ·
Resend · Twilio · googleapis · Vitest.

Every integration degrades gracefully when its env vars are missing — the
marketing site runs with zero configuration.

## Architecture notes

- **No Supabase Auth.** Public reads use the anon key against two RLS-safe views
  (`public_doctors`, `public_insights`). All writes go through server code
  (Route Handlers / Server Actions) with the service-role key *after* a Clerk
  `auth()` + ownership check. See `lib/supabase/{anon,admin}.ts`.
- **Race-safe booking.** `appointments` has a GiST exclusion constraint
  (`tstzrange` overlap per doctor, excluding cancelled). The slot engine
  (`lib/scheduling/engine.ts`) is a pure function re-run server-side at booking
  time; the DB constraint is the final guard.
- **Slot engine** = weekly `availability_rules` (+ `extra` overrides − `block`
  overrides) sliced into `slot_duration + buffer` steps, converted doctor-local
  → UTC, minus existing appointments, clamped to
  `[now + min_notice, now + horizon]`.

```
app/(marketing)/…        public pages
app/doctors/[slug]       profile + booking widget
app/booking/[token]      patient self-service (no login)
app/dashboard/…          Clerk-protected doctor area
app/api/…                bookings, slots, webhooks (clerk, payments), cron
lib/scheduling           pure slot engine  (unit-tested)
lib/data                 typed data access (schedule, doctors, appointments, …)
lib/actions              server actions (doctor, appointments, admin)
lib/{google,payments,notifications}   integrations, each with a no-op fallback
supabase/migrations      0001 schema · 0002 RLS + views · 0003 storage buckets
supabase/seed.sql        demo doctor + 3 articles
```

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev            # marketing site works with no keys
npm run test           # scheduling-engine unit tests
```

Full service-by-service setup (Supabase, Clerk, Resend, Twilio, Google
Workspace, Safepay, Vercel Cron) and a local end-to-end checklist are in
**[SETUP.md](SETUP.md)**.

## Status / follow-ups

- Safepay endpoints (`/order/v1/init`, checkout host) should be confirmed
  against your merchant dashboard; PayFast adapter is a stub.
- Google Meet needs a Workspace service account with domain-wide delegation.
- Marketing copy is original placeholder text for the neutral brand — review
  before launch. Legal pages are placeholders.
- Doctor photos are entered as URLs for now; wire a Storage upload if desired
  (the `doctor-photos` bucket already exists).
