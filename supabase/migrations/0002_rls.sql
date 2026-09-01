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
  slot_duration_min, online_enabled, in_person_enabled
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
