-- 0002_self_register_approval.sql
-- Replace the email allowlist with self-registration + owner approval.

-- 1. New columns on membership
alter table public.household_members
  add column if not exists status text not null default 'pending'
  check (status in ('pending', 'approved'));
alter table public.household_members add column if not exists email text;

update public.household_members set status = 'approved' where status is null;

-- 2. Bootstrap owners — auto-approved as owner on first sign-in
create table if not exists public.bootstrap_owners (
  email text primary key
);
insert into public.bootstrap_owners (email) values ('v.sapmm@live.com')
on conflict do nothing;

-- 3. Approved-only household lookup (drives all data RLS)
create or replace function public.user_household_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select household_id from public.household_members
  where user_id = auth.uid() and status = 'approved';
$$;

-- 4. Owner check (security definer → no RLS recursion)
create or replace function public.is_household_owner(hid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where user_id = auth.uid()
      and household_id = hid
      and role = 'owner'
      and status = 'approved'
  );
$$;

-- 5. New-user handler: everyone joins the default household.
--    bootstrap owners → owner/approved, everyone else → member/pending.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_default_household uuid := '00000000-0000-0000-0000-000000000001';
  v_is_owner boolean;
begin
  select exists (
    select 1 from public.bootstrap_owners where email = lower(new.email)
  ) into v_is_owner;

  insert into public.household_members (household_id, user_id, role, status, email, display_name)
  values (
    v_default_household,
    new.id,
    case when v_is_owner then 'owner' else 'member' end,
    case when v_is_owner then 'approved' else 'pending' end,
    lower(new.email),
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (household_id, user_id) do nothing;

  return new;
end;
$$;

-- (trigger on_auth_user_created from migration 0001 already calls handle_new_user)

-- 6. Drop the now-unused allowlist
drop table if exists public.allowed_emails;

-- 7. RLS for household_members: self-read + owner-manage
drop policy if exists "members read own membership" on public.household_members;
drop policy if exists "self read membership" on public.household_members;
drop policy if exists "owner read household memberships" on public.household_members;
drop policy if exists "owner update memberships" on public.household_members;
drop policy if exists "owner delete memberships" on public.household_members;

create policy "self read membership" on public.household_members
  for select using (user_id = auth.uid());

create policy "owner read household memberships" on public.household_members
  for select using (public.is_household_owner(household_id));

create policy "owner update memberships" on public.household_members
  for update using (public.is_household_owner(household_id))
  with check (public.is_household_owner(household_id));

create policy "owner delete memberships" on public.household_members
  for delete using (
    public.is_household_owner(household_id) and role <> 'owner'
  );

-- 8. Realtime so the owner sees new join requests live
do $$
begin
  alter publication supabase_realtime add table public.household_members;
exception when duplicate_object then null;
end $$;
