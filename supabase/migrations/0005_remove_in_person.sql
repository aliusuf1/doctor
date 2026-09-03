-- Northline — remove in-person consultations. The practice is online-only.
--
-- `appointments.mode` is deliberately kept: dropping it would erase which past
-- bookings were in-person visits. It now defaults to 'online' and the app no
-- longer reads or writes it.

-- public_doctors projects in_person_enabled, so it must go before the column.
drop view if exists public.public_doctors;

alter table public.doctors
  drop column if exists in_person_enabled;

alter table public.availability_rules
  drop column if exists mode;

alter table public.waitlist_entries
  drop column if exists mode;

alter table public.appointments
  alter column mode set default 'online';

-- Recreate the public view without the dropped column.
create view public.public_doctors
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

grant select on public.public_doctors to anon, authenticated;
