-- 0003_finish_trip.sql
-- Atomic "Done shopping": create a trip, snapshot the checked items into
-- trip_items, then clear those checked items from the active list.
-- Runs as one transaction (single function call).

create or replace function public.finish_trip(
  p_market_id uuid,
  p_total_amount numeric,
  p_currency text default 'EUR',
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_household uuid;
  v_trip uuid;
  v_checked_count int;
begin
  if p_total_amount is null or p_total_amount < 0 then
    raise exception 'total amount is required';
  end if;

  select household_id into v_household
  from public.household_members
  where user_id = v_uid and status = 'approved'
  limit 1;

  if v_household is null then
    raise exception 'not an approved member';
  end if;

  if p_market_id is not null and not exists (
    select 1 from public.markets
    where id = p_market_id and household_id = v_household
  ) then
    raise exception 'invalid market for this household';
  end if;

  select count(*) into v_checked_count
  from public.items
  where household_id = v_household and status = 'checked';

  if v_checked_count = 0 then
    raise exception 'nothing checked to finish';
  end if;

  insert into public.trips (
    household_id, market_id, shopper_user_id,
    started_at, completed_at, total_amount, currency, notes
  )
  values (
    v_household, p_market_id, v_uid,
    now(), now(), p_total_amount, coalesce(p_currency, 'EUR'), p_notes
  )
  returning id into v_trip;

  insert into public.trip_items (
    trip_id, name, category_name, quantity, unit, position
  )
  select
    v_trip,
    i.name,
    (select c.name from public.categories c where c.id = i.category_id),
    i.quantity,
    i.unit,
    row_number() over (order by i.checked_at nulls last, i.created_at)
  from public.items i
  where i.household_id = v_household and i.status = 'checked';

  delete from public.items
  where household_id = v_household and status = 'checked';

  return v_trip;
end;
$$;

grant execute on function public.finish_trip(uuid, numeric, text, text) to authenticated;
