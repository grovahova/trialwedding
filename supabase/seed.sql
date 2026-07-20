-- ============================================================================
-- Seed data. Run in this exact order:
--   1. migrations/0001_init.sql
--   2. migrations/0002_vendor_bookings.sql
--   3. this file (seed.sql)
-- Edit the wedding_date below to your real date before running.
-- ============================================================================

insert into wedding_settings (id, couple_names, wedding_date, planning_start_date)
values (1, 'oneSIPisallittakes', '2027-01-15', current_date)
on conflict (id) do update set
  couple_names = excluded.couple_names,
  wedding_date = excluded.wedding_date;

insert into events (name, slug, event_date, color_theme, description, position)
values
  ('Mehendi', 'mehendi', '2027-01-12', 'mehendi-gradient', 'Henna ceremony for the bride and her friends & family.', 1),
  ('Haldi', 'haldi', '2027-01-13', 'haldi-gradient', 'Turmeric ceremony to bless the couple.', 2),
  ('Nikah', 'nikah', '2027-01-15', 'nikah-gradient', 'The wedding ceremony.', 3),
  ('Walima / Reception', 'reception', '2027-01-16', 'reception-gradient', 'Celebratory reception dinner.', 4)
on conflict (slug) do nothing;

-- Sample task categories for each event (optional starting checklist)
insert into tasks (event_id, name, category, priority, status, due_date)
select id, 'Book venue', 'Venue', 'critical', 'not_started', event_date - interval '90 days'
from events
where slug = 'mehendi'
  and not exists (select 1 from tasks where name = 'Book venue' and event_id = events.id);

insert into tasks (event_id, name, category, priority, status, due_date)
select id, 'Confirm catering menu', 'Food', 'high', 'not_started', event_date - interval '30 days'
from events
where slug = 'reception'
  and not exists (select 1 from tasks where name = 'Confirm catering menu' and event_id = events.id);

-- Seed one "not booked" row per required vendor category so the Booking Tracker
-- shows all 15 categories from day one. Safe to re-run — skips categories that
-- already have at least one booking row. Also safe to run before migration
-- 0002_vendor_bookings.sql — it just skips with a notice instead of erroring.
do $$
declare
  cat text;
  categories text[] := array[
    'Venue', 'Food Catering', 'Photographer', 'Videographer', 'Decoration',
    'Makeup Artist', 'Wedding Clothes / Tailor', 'Mehendi Artist', 'DJ / Sound',
    'Lighting', 'Transportation', 'Flowers', 'Jeweler',
    'Invitation Cards Printing', 'Accommodation / Guest Hotel'
  ];
begin
  if to_regclass('public.vendor_bookings') is null then
    raise notice 'Skipping vendor_bookings seed — run migrations/0002_vendor_bookings.sql first, then re-run this file.';
    return;
  end if;

  foreach cat in array categories loop
    if not exists (select 1 from vendor_bookings where category = cat) then
      insert into vendor_bookings (category, status) values (cat, 'not_booked');
    end if;
  end loop;
end $$;
