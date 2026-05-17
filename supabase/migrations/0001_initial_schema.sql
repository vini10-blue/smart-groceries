-- 0001_initial_schema.sql
-- Smart Groceries — initial schema with RLS and realtime publication.

create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────────────────────────────────
-- Helper trigger: keep updated_at fresh
-- ──────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────
-- Tables
-- ──────────────────────────────────────────────────────────────────────────

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')) default 'member',
  display_name text,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- Helper: which households is the current user in? (security definer to bypass RLS recursion)
create or replace function public.user_household_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select household_id from public.household_members where user_id = auth.uid();
$$;

create table public.allowed_emails (
  email text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  icon text,
  color text,
  default_position int,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index categories_household_idx on public.categories(household_id) where deleted_at is null;

create table public.markets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  address text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index markets_household_idx on public.markets(household_id) where deleted_at is null;

create table public.market_category_orders (
  market_id uuid not null references public.markets(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  position int not null,
  primary key (market_id, category_id)
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  market_id uuid references public.markets(id),
  shopper_user_id uuid references auth.users(id),
  started_at timestamptz,
  completed_at timestamptz not null default now(),
  total_amount numeric not null,
  currency text not null default 'EUR',
  notes text
);
create index trips_household_idx on public.trips(household_id, completed_at desc);

create table public.trip_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  category_name text,
  quantity numeric,
  unit text,
  unit_price numeric,
  total_price numeric,
  position int
);
create index trip_items_trip_idx on public.trip_items(trip_id);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  quantity numeric,
  unit text default 'Un',
  category_id uuid references public.categories(id),
  notes text,
  status text not null check (status in ('pending', 'checked')) default 'pending',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  checked_by uuid references auth.users(id),
  checked_at timestamptz,
  trip_id uuid references public.trips(id),
  added_via text not null check (added_via in ('text', 'voice')) default 'text',
  updated_at timestamptz not null default now()
);
create index items_household_status_idx on public.items(household_id, status);
create trigger items_updated_at before update on public.items
  for each row execute function public.set_updated_at();

-- ──────────────────────────────────────────────────────────────────────────
-- Row-Level Security
-- ──────────────────────────────────────────────────────────────────────────

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.allowed_emails enable row level security;
alter table public.categories enable row level security;
alter table public.markets enable row level security;
alter table public.market_category_orders enable row level security;
alter table public.items enable row level security;
alter table public.trips enable row level security;
alter table public.trip_items enable row level security;

create policy "members read households" on public.households
  for select using (id in (select public.user_household_ids()));

create policy "members read own membership" on public.household_members
  for select using (user_id = auth.uid() or household_id in (select public.user_household_ids()));

create policy "members read categories" on public.categories
  for select using (household_id in (select public.user_household_ids()));
create policy "members write categories" on public.categories
  for all using (household_id in (select public.user_household_ids()))
  with check (household_id in (select public.user_household_ids()));

create policy "members read markets" on public.markets
  for select using (household_id in (select public.user_household_ids()));
create policy "members write markets" on public.markets
  for all using (household_id in (select public.user_household_ids()))
  with check (household_id in (select public.user_household_ids()));

create policy "members read market_category_orders" on public.market_category_orders
  for select using (market_id in (select id from public.markets where household_id in (select public.user_household_ids())));
create policy "members write market_category_orders" on public.market_category_orders
  for all using (market_id in (select id from public.markets where household_id in (select public.user_household_ids())))
  with check (market_id in (select id from public.markets where household_id in (select public.user_household_ids())));

create policy "members read items" on public.items
  for select using (household_id in (select public.user_household_ids()));
create policy "members write items" on public.items
  for all using (household_id in (select public.user_household_ids()))
  with check (household_id in (select public.user_household_ids()));

create policy "members read trips" on public.trips
  for select using (household_id in (select public.user_household_ids()));
create policy "members write trips" on public.trips
  for all using (household_id in (select public.user_household_ids()))
  with check (household_id in (select public.user_household_ids()));

create policy "members read trip_items" on public.trip_items
  for select using (trip_id in (select id from public.trips where household_id in (select public.user_household_ids())));
create policy "members write trip_items" on public.trip_items
  for all using (trip_id in (select id from public.trips where household_id in (select public.user_household_ids())))
  with check (trip_id in (select id from public.trips where household_id in (select public.user_household_ids())));

-- allowed_emails: no policies → only accessible via service role / SQL editor.

-- ──────────────────────────────────────────────────────────────────────────
-- Realtime publication
-- ──────────────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.items;
alter publication supabase_realtime add table public.trips;
alter publication supabase_realtime add table public.trip_items;
alter publication supabase_realtime add table public.markets;
alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.market_category_orders;

-- ──────────────────────────────────────────────────────────────────────────
-- Auto-link new auth users to household via allowlist
-- ──────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
begin
  select household_id into v_household_id
  from public.allowed_emails
  where email = lower(new.email);

  if v_household_id is not null then
    insert into public.household_members (household_id, user_id, role)
    values (v_household_id, new.id, 'member')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
