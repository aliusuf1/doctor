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
