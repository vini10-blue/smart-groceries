-- 0004_blue_lagoon_owner.sql
-- Seed vini@bluelagoon-consulting.com as a bootstrap owner.
-- Anyone else who signs in lands in 'pending' and must be approved.
--
-- Idempotent: safe to re-run.

insert into public.bootstrap_owners (email)
values ('vini@bluelagoon-consulting.com')
on conflict do nothing;

-- If this user has already signed in (existing auth row), promote them now
-- so they don't get stuck in 'pending' from an earlier sign-in.
update public.household_members hm
set role = 'owner', status = 'approved'
from auth.users u
where hm.user_id = u.id
  and lower(u.email) = 'vini@bluelagoon-consulting.com';
