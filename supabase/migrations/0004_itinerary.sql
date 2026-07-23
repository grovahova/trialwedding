-- ============================================================================
-- Day-of Itinerary — run AFTER 0001, 0002, 0003
--
-- SAFE TO RE-RUN: same idempotent pattern as the earlier migrations.
-- ============================================================================

create table if not exists itinerary_items (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events (id) on delete cascade,
  item_date date,
  start_time text,
  end_time text,
  track text not null default 'general', -- 'guests' | 'bride_groom' | 'general'
  title text not null,
  location text,
  responsible_party text,
  notes text,
  position int not null default 0,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace trigger itinerary_items_set_updated_at
  before update on itinerary_items
  for each row execute procedure set_updated_at();

alter table itinerary_items enable row level security;

drop policy if exists "itinerary_select_all" on itinerary_items;
create policy "itinerary_select_all" on itinerary_items for select using (auth.uid() is not null);
drop policy if exists "itinerary_admin_write" on itinerary_items;
create policy "itinerary_admin_write" on itinerary_items for all
  using (is_admin()) with check (is_admin());

do $$ begin
  alter publication supabase_realtime add table itinerary_items;
exception when duplicate_object then null; end $$;
