-- 0004_blue_lagoon_owner.sql
-- Add vini@bluelagoon-consulting.com to bootstrap owners and promote any
-- existing membership for that email to owner/approved.

insert into public.bootstrap_owners (email)
values ('vini@bluelagoon-consulting.com')
on conflict do nothing;

update public.household_members hm
set role = 'owner', status = 'approved'
from auth.users u
where hm.user_id = u.id
  and lower(u.email) = 'vini@bluelagoon-consulting.com';
