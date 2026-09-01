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
  in_person_enabled boolean not null default true,
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
  mode text not null default 'both' check (mode in ('online','in_person','both')),
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
  mode text not null check (mode in ('online','in_person')),
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
