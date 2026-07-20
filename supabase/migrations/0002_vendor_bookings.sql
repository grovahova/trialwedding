-- ============================================================================
-- Vendor Booking Tracker — run AFTER 0001_init.sql
--
-- SAFE TO RE-RUN: same idempotent pattern as 0001_init.sql — enums, tables,
-- triggers, policies, and publication membership all check for existing
-- objects first, so re-running this file after a partial or repeat run
-- will not error.
-- ============================================================================

do $$ begin
  create type booking_status as enum ('not_booked', 'enquired', 'negotiating', 'booked', 'confirmed', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists vendor_bookings (
  id uuid primary key default uuid_generate_v4(),
  category text not null,
  vendor_name text,
  event_id uuid references events (id) on delete set null,
  status booking_status not null default 'not_booked',
  booking_date date,
  contract_signed boolean not null default false,
  advance_paid numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,
  final_payment_due_date date,
  contact_person text,
  contact_phone text,
  trial_scheduled_date date,
  fitting_dates date[] not null default '{}',
  notes text,
  contract_url text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace trigger vendor_bookings_set_updated_at
  before update on vendor_bookings
  for each row execute procedure set_updated_at();

alter table vendor_bookings enable row level security;

drop policy if exists "vendor_bookings_select_all" on vendor_bookings;
create policy "vendor_bookings_select_all" on vendor_bookings for select using (auth.uid() is not null);
drop policy if exists "vendor_bookings_admin_write" on vendor_bookings;
create policy "vendor_bookings_admin_write" on vendor_bookings for all
  using (is_admin()) with check (is_admin());

do $$ begin
  alter publication supabase_realtime add table vendor_bookings;
exception when duplicate_object then null; end $$;

-- log booking status changes onto the shared activity feed
create or replace function log_booking_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into activity_log (profile_id, action, entity_type, entity_id, description)
    values (new.created_by, 'created', 'vendor_booking', new.id,
      'added a booking for "' || new.category || '"');
  elsif (tg_op = 'UPDATE' and old.status <> new.status) then
    insert into activity_log (profile_id, action, entity_type, entity_id, description)
    values (auth.uid(), 'status_changed', 'vendor_booking', new.id,
      'moved the ' || new.category || ' booking from ' || old.status || ' to ' || new.status);
  end if;
  return new;
end;
$$;

create or replace trigger vendor_bookings_log_activity
  after insert or update on vendor_bookings
  for each row execute procedure log_booking_activity();

-- storage bucket for signed contract uploads
insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', false)
on conflict (id) do nothing;

drop policy if exists "contracts_read_authenticated" on storage.objects;
create policy "contracts_read_authenticated" on storage.objects for select
  using (bucket_id = 'contracts' and auth.uid() is not null);
drop policy if exists "contracts_write_admin" on storage.objects;
create policy "contracts_write_admin" on storage.objects for insert
  with check (bucket_id = 'contracts' and is_admin());
drop policy if exists "contracts_delete_admin" on storage.objects;
create policy "contracts_delete_admin" on storage.objects for delete
  using (bucket_id = 'contracts' and is_admin());
