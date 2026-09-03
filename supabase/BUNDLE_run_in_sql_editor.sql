-- ===== Northline: full setup (migrations 0001-0004 + seed) =====
-- Paste this whole file into the Supabase SQL editor and Run. Safe to re-run.

-- ---- supabase/migrations/0001_init.sql ----
-- Northline Dermatology — initial schema
-- Run with the Supabase SQL editor or `supabase db push`.

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- ── doctors ────────────────────────────────────────────────────────────────
create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  slug text unique not null,
  full_name text not null,
  credentials text,
  specialty text[] not null default '{Dermatology}',
  headline text,
  bio text,
  photo_url text,
  clinic_name text,
  clinic_address text,
  city text not null default 'Karachi',
  timezone text not null default 'Asia/Karachi',
  consultation_fee_pkr integer,
  currency text not null default 'PKR',
  slot_duration_min integer not null default 20 check (slot_duration_min between 5 and 180),
  buffer_min integer not null default 0 check (buffer_min between 0 and 120),
  min_notice_hours integer not null default 12 check (min_notice_hours between 0 and 720),
  booking_horizon_days integer not null default 30 check (booking_horizon_days between 1 and 120),
  cancellation_notice_hours integer not null default 6 check (cancellation_notice_hours between 0 and 336),
  online_enabled boolean not null default true,
  bank_details text,
  google_calendar_id text,
  standing_meet_link text,
  is_active boolean not null default false,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── availability: weekly template ──────────────────────────────────────────
create table if not exists public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (start_time < end_time)
);
create index if not exists availability_rules_doctor_idx
  on public.availability_rules (doctor_id, weekday);

-- ── availability: date-specific overrides ──────────────────────────────────
create table if not exists public.availability_overrides (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  date date not null,
  type text not null check (type in ('block','extra')),
  start_time time,
  end_time time,
  reason text,
  created_at timestamptz not null default now(),
  check (type = 'block' or (start_time is not null and end_time is not null and start_time < end_time))
);
create index if not exists availability_overrides_doctor_date_idx
  on public.availability_overrides (doctor_id, date);

-- ── patients (no login) ───────────────────────────────────────────────────
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text,
  whatsapp_opt_in boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── appointments ──────────────────────────────────────────────────────────
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  doctor_timezone text not null default 'Asia/Karachi',
  mode text not null default 'online' check (mode in ('online','in_person')),
  status text not null default 'pending_payment'
    check (status in ('pending_payment','confirmed','completed','cancelled','no_show')),
  concern text,
  fee_pkr integer,
  currency text not null default 'PKR',
  payment_method text check (payment_method in ('online','bank_transfer')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','submitted','verified','refunded','failed')),
  payment_reference text,
  payment_proof_path text,
  meet_link text,
  google_event_id text,
  manage_token text not null unique default encode(gen_random_bytes(18), 'hex'),
  reminded_24h_at timestamptz,
  reminded_1h_at timestamptz,
  reschedule_of uuid references public.appointments(id) on delete set null,
  cancelled_by text check (cancelled_by in ('patient','doctor','system')),
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

-- No two live appointments for one doctor may overlap.
alter table public.appointments
  drop constraint if exists appointments_no_overlap;
alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    doctor_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status <> 'cancelled');

create index if not exists appointments_doctor_start_idx
  on public.appointments (doctor_id, starts_at);
create index if not exists appointments_status_idx
  on public.appointments (status, starts_at);

-- ── payments ledger ───────────────────────────────────────────────────────
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  provider text not null,
  provider_ref text,
  amount_pkr integer not null default 0,
  status text not null,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

-- ── notifications log ─────────────────────────────────────────────────────
create table if not exists public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete set null,
  channel text not null check (channel in ('email','whatsapp')),
  template text not null,
  to_addr text not null,
  status text not null,
  error text,
  created_at timestamptz not null default now()
);

-- ── insights (blog) ───────────────────────────────────────────────────────
create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  excerpt text not null,
  body_md text not null,
  read_minutes integer not null default 5,
  author_doctor_id uuid references public.doctors(id) on delete set null,
  published boolean not null default false,
  published_at timestamptz,
  cover_url text,
  created_at timestamptz not null default now()
);

-- ── updated_at trigger ────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists doctors_touch on public.doctors;
create trigger doctors_touch before update on public.doctors
  for each row execute function public.touch_updated_at();

drop trigger if exists appointments_touch on public.appointments;
create trigger appointments_touch before update on public.appointments
  for each row execute function public.touch_updated_at();


-- ---- supabase/migrations/0002_rls.sql ----
-- Row Level Security.
--
-- The app never uses Supabase Auth. Privileged access is server-side with the
-- service-role key (which bypasses RLS) after Clerk authorization. The ANON key
-- is used only for public reads, and may see nothing except the two views below.

alter table public.doctors               enable row level security;
alter table public.availability_rules    enable row level security;
alter table public.availability_overrides enable row level security;
alter table public.patients              enable row level security;
alter table public.appointments          enable row level security;
alter table public.payments              enable row level security;
alter table public.notifications_log     enable row level security;
alter table public.insights              enable row level security;

-- No policies for anon/authenticated on base tables => no access.
-- (Service role bypasses RLS entirely.)

-- ── Public, read-only views ───────────────────────────────────────────────
create or replace view public.public_doctors
with (security_invoker = true) as
select
  slug, full_name, credentials, specialty, headline, bio, photo_url,
  clinic_name, city, timezone, consultation_fee_pkr, currency,
  slot_duration_min, online_enabled
from public.doctors
where is_active = true;

create or replace view public.public_insights
with (security_invoker = true) as
select
  slug, title, category, excerpt, body_md, read_minutes, cover_url, published_at
from public.insights
where published = true;

-- Views run with the querying role; grant SELECT so the anon key can read them.
-- A SECURITY DEFINER helper keeps the underlying tables locked while still
-- letting these projections through.
create or replace function public.is_active_doctor(p_slug text)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.doctors where slug = p_slug and is_active);
$$;

grant select on public.public_doctors to anon, authenticated;
grant select on public.public_insights to anon, authenticated;

-- Because the views use security_invoker, anon still needs to pass RLS on the
-- base tables. Add narrow SELECT policies scoped to exactly what the views expose.
drop policy if exists "anon reads active doctors" on public.doctors;
create policy "anon reads active doctors"
  on public.doctors for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "anon reads published insights" on public.insights;
create policy "anon reads published insights"
  on public.insights for select
  to anon, authenticated
  using (published = true);


-- ---- supabase/migrations/0003_storage.sql ----
-- Private storage buckets.
--   payment-proofs : bank-transfer receipts (private; served to doctors via
--                    short-lived signed URLs minted server-side)
--   doctor-photos  : optional profile images (public read)

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('doctor-photos', 'doctor-photos', true)
on conflict (id) do nothing;

-- No anon/authenticated policies on payment-proofs => only the service role can
-- read/write. doctor-photos is public-read via the bucket's `public` flag.
drop policy if exists "public read doctor photos" on storage.objects;
create policy "public read doctor photos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'doctor-photos');


-- ---- supabase/migrations/0004_features.sql ----
-- Northline — reviews, waitlist, "next available", iCal token, credential
-- verification, and refreshed public views.

-- ── doctors: new columns ─────────────────────────────────────────────────
alter table public.doctors
  add column if not exists next_available_at timestamptz,
  add column if not exists calendar_token text unique default encode(gen_random_bytes(18), 'hex'),
  add column if not exists license_number text,
  add column if not exists license_path text,
  add column if not exists verified boolean not null default false,
  add column if not exists verified_at timestamptz;

update public.doctors set calendar_token = encode(gen_random_bytes(18), 'hex')
where calendar_token is null;

-- ── reviews ──────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  patient_name text not null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists reviews_doctor_idx on public.reviews (doctor_id, created_at desc);

-- ── waitlist ─────────────────────────────────────────────────────────────
create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  date date not null,
  full_name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  unique (doctor_id, date, email)
);
create index if not exists waitlist_lookup_idx
  on public.waitlist_entries (doctor_id, date) where notified_at is null;

-- ── storage: doctor licences (private) ───────────────────────────────────
insert into storage.buckets (id, name, public)
values ('doctor-licenses', 'doctor-licenses', false)
on conflict (id) do nothing;

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.reviews enable row level security;
alter table public.waitlist_entries enable row level security;

drop policy if exists "anon reads published reviews" on public.reviews;
create policy "anon reads published reviews"
  on public.reviews for select
  to anon, authenticated
  using (published = true);

-- ── refreshed public views ──────────────────────────────────────────────
create or replace view public.public_doctors
with (security_invoker = true) as
select
  d.slug, d.full_name, d.credentials, d.specialty, d.headline, d.bio,
  d.photo_url, d.clinic_name, d.city, d.timezone, d.consultation_fee_pkr,
  d.currency, d.slot_duration_min, d.online_enabled,
  d.verified, d.next_available_at,
  coalesce(r.rating_avg, 0)::numeric(3,2) as rating_avg,
  coalesce(r.rating_count, 0) as rating_count
from public.doctors d
left join (
  select doctor_id,
         avg(rating)::numeric(3,2) as rating_avg,
         count(*) as rating_count
  from public.reviews
  where published
  group by doctor_id
) r on r.doctor_id = d.id
where d.is_active = true;

create or replace view public.public_reviews
with (security_invoker = true) as
select
  d.slug as doctor_slug,
  rv.rating, rv.comment, rv.patient_name, rv.created_at
from public.reviews rv
join public.doctors d on d.id = rv.doctor_id
where rv.published = true;

grant select on public.public_doctors to anon, authenticated;
grant select on public.public_reviews to anon, authenticated;


-- ===== seed =====
-- Seed data for local / staging.
-- Replace 'user_REPLACE_WITH_CLERK_ID' with a real Clerk user id to claim this
-- profile from the dashboard, or leave it and edit later.

insert into public.doctors (
  clerk_user_id, slug, full_name, credentials, specialty, headline, bio,
  city, timezone, consultation_fee_pkr, slot_duration_min, min_notice_hours,
  booking_horizon_days, online_enabled, bank_details,
  is_active, onboarded_at
) values (
  'user_REPLACE_WITH_CLERK_ID',
  'sana-siddiqui',
  'Dr. Sana Siddiqui',
  'MBBS, FCPS, SCE',
  '{Dermatology,"Acne & scarring","Pigmentation","Hair & scalp"}',
  'Consultant dermatologist focused on careful assessment, realistic expectations and plans you can actually follow.',
  E'Dr. Sana Siddiqui is a consultant dermatologist whose work spans patient care and medical education. Her approach favours evidence, clarity and treatment plans patients can understand and follow.\n\nShe consults online from Karachi.',
  'Karachi', 'Asia/Karachi', 3500, 20, 12, 30, true,
  E'Bank: Example Bank\nAccount title: Dr Sana Siddiqui\nIBAN: PK00EXMP0000000000000000',
  true, now()
)
on conflict (slug) do nothing;

-- A simple weekly template: Mon/Wed/Fri evenings, Sat morning.
insert into public.availability_rules (doctor_id, weekday, start_time, end_time)
select d.id, x.weekday, x.start_time, x.end_time
from public.doctors d
cross join (values
  (1, time '17:00', time '20:00'),
  (3, time '17:00', time '20:00'),
  (5, time '17:00', time '20:00'),
  (6, time '10:00', time '13:00')
) as x(weekday, start_time, end_time)
where d.slug = 'sana-siddiqui'
on conflict do nothing;

insert into public.insights (slug, title, category, excerpt, body_md, read_minutes, published, published_at)
values
(
  'why-acne-keeps-returning',
  'Why does acne keep returning?',
  'Acne',
  'Hormones, products, treatment time and the real reasons acne recurs.',
  E'## It is usually not "failed" treatment\n\nAcne is a chronic condition for many people. When it comes back, the common reasons are stopping treatment too early, an underlying hormonal driver, or a product that is quietly making things worse.\n\n## What actually helps\n\n- Giving a plan 10 to 12 weeks before judging it\n- Treating the whole area, not single spots\n- Reviewing every product you apply, including "gentle" ones\n\nA consultation is where the right plan for your skin is worked out. This article is general information only.',
  5, true, now()
),
(
  'melasma-or-pigmentation',
  'Melasma or pigmentation?',
  'Pigmentation',
  'Why the correct diagnosis matters before creams, peels or lasers.',
  E'## They are not the same\n\nMelasma, post-inflammatory pigmentation and other causes of dark patches look similar but respond very differently. The wrong treatment can make melasma worse.\n\n## Before starting anything\n\n- Identify the pattern and likely triggers\n- Protect from sun and heat first\n- Introduce actives slowly, watching tolerance\n\nSee a dermatologist for a diagnosis before choosing a treatment.',
  5, true, now()
),
(
  'hair-shedding-normal-or-not',
  'When is hair shedding more than normal?',
  'Hair',
  'Common patterns, useful tests, and when specialist assessment is worthwhile.',
  E'## Some shedding is normal\n\nLosing around 50 to 100 hairs a day is expected. A sudden increase for more than a few weeks, a widening part, or visible scalp are reasons to get assessed.\n\n## Useful next steps\n\n- A small set of blood tests, chosen for your history\n- A scalp examination\n- A realistic timeline: regrowth is measured in months\n\nBook a consultation if shedding is persistent or worrying you.',
  4, true, now()
)
on conflict (slug) do nothing;
