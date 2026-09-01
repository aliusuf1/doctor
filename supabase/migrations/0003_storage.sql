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
