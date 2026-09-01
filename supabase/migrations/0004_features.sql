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
  mode text not null default 'online' check (mode in ('online','in_person')),
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
  d.currency, d.slot_duration_min, d.online_enabled, d.in_person_enabled,
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
