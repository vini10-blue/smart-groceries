-- seed.sql
-- Run after the initial migration. Idempotent.

-- One household for the MVP
insert into public.households (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Home')
on conflict (id) do nothing;

-- Default English categories (Phase 1)
insert into public.categories (household_id, name, default_position) values
  ('00000000-0000-0000-0000-000000000001', 'Produce', 1),
  ('00000000-0000-0000-0000-000000000001', 'Dairy', 2),
  ('00000000-0000-0000-0000-000000000001', 'Bread & Bakery', 3),
  ('00000000-0000-0000-0000-000000000001', 'Meat & Fish', 4),
  ('00000000-0000-0000-0000-000000000001', 'Frozen', 5),
  ('00000000-0000-0000-0000-000000000001', 'Pantry', 6),
  ('00000000-0000-0000-0000-000000000001', 'Snacks', 7),
  ('00000000-0000-0000-0000-000000000001', 'Drinks', 8),
  ('00000000-0000-0000-0000-000000000001', 'Household', 9),
  ('00000000-0000-0000-0000-000000000001', 'Personal Care', 10),
  ('00000000-0000-0000-0000-000000000001', 'Other', 99)
on conflict do nothing;

-- Allowlist — REPLACE these with your actual Microsoft account emails before running
-- insert into public.allowed_emails (email, household_id) values
--   ('your-email@example.com', '00000000-0000-0000-0000-000000000001'),
--   ('girlfriend-email@example.com', '00000000-0000-0000-0000-000000000001')
-- on conflict do nothing;
