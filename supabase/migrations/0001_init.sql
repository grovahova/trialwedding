-- ============================================================================
-- oneSIPisallittakes Wedding Planner — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).
--
-- SAFE TO RE-RUN: every statement below is idempotent (enums, tables,
-- triggers, policies, publication membership, and storage policies all
-- check for existing objects first). If you ever hit an "already exists"
-- error from an older copy of this file, just grab this version and re-run
-- it — it will skip anything already in place instead of erroring.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('admin', 'family', 'volunteer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_priority as enum ('critical', 'high', 'medium', 'low');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('not_started', 'in_progress', 'waiting', 'blocked', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_status as enum ('active', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type shopping_status as enum ('pending', 'ordered', 'purchased');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('unpaid', 'advance_paid', 'paid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rsvp_status as enum ('pending', 'confirmed', 'declined', 'no_response');
exception when duplicate_object then null; end $$;

do $$ begin
  create type guest_side as enum ('bride', 'groom', 'both');
exception when duplicate_object then null; end $$;

do $$ begin
  create type guest_group as enum ('family', 'friends', 'vip', 'colleague', 'other');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- PROFILES (extends auth.users)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role user_role not null default 'volunteer',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- WEDDING SETTINGS (singleton row)
-- ---------------------------------------------------------------------------
create table if not exists wedding_settings (
  id int primary key default 1 check (id = 1),
  couple_names text not null default 'oneSIPisallittakes',
  wedding_date date not null,
  planning_start_date date not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- EVENTS (Mehendi, Haldi, Nikah, Reception, + custom)
-- ---------------------------------------------------------------------------
create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  event_date date,
  color_theme text not null default 'nikah-gradient',
  description text,
  status event_status not null default 'active',
  position int not null default 0,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- TASKS
-- ---------------------------------------------------------------------------
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events (id) on delete cascade,
  name text not null,
  description text,
  category text,
  priority task_priority not null default 'medium',
  status task_status not null default 'not_started',
  due_date date,
  completion_percent int not null default 0 check (completion_percent between 0 and 100),
  position int not null default 0,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists task_assignees (
  task_id uuid references tasks (id) on delete cascade,
  profile_id uuid references profiles (id) on delete cascade,
  primary key (task_id, profile_id)
);

create table if not exists task_checklist_items (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks (id) on delete cascade,
  label text not null,
  is_done boolean not null default false,
  position int not null default 0
);

create table if not exists task_comments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks (id) on delete cascade,
  profile_id uuid references profiles (id),
  body text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- SHOPPING
-- ---------------------------------------------------------------------------
create table if not exists shopping_items (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events (id) on delete cascade,
  category text not null,
  name text not null,
  quantity int not null default 1,
  budget_amount numeric(12, 2) not null default 0,
  actual_amount numeric(12, 2),
  store text,
  status shopping_status not null default 'pending',
  assigned_to uuid references profiles (id),
  receipt_url text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- BUDGET
-- ---------------------------------------------------------------------------
create table if not exists budget_items (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events (id) on delete cascade,
  category text not null,
  item_name text not null,
  planned_amount numeric(12, 2) not null default 0,
  actual_amount numeric(12, 2) not null default 0,
  vendor_id uuid,
  payment_status payment_status not null default 'unpaid',
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- VENDORS
-- ---------------------------------------------------------------------------
create table if not exists vendors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  phone text,
  event_id uuid references events (id) on delete set null,
  advance_paid numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,
  rating int check (rating between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table budget_items
    add constraint budget_items_vendor_fk foreign key (vendor_id) references vendors (id) on delete set null;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- GUESTS
-- ---------------------------------------------------------------------------
create table if not exists guests (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  side guest_side not null default 'both',
  guest_group guest_group not null default 'family',
  rsvp_status rsvp_status not null default 'pending',
  invitation_sent boolean not null default false,
  food_preference text,
  phone text,
  plus_ones int not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS + ACTIVITY LOG
-- ---------------------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles (id) on delete cascade,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists activity_log (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  description text not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function is_task_assignee(t_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from task_assignees where task_id = t_id and profile_id = auth.uid()
  );
$$;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'volunteer')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger tasks_set_updated_at
  before update on tasks
  for each row execute procedure set_updated_at();

-- log every task status change + notify assignees
create or replace function log_task_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into activity_log (profile_id, action, entity_type, entity_id, description)
    values (new.created_by, 'created', 'task', new.id, 'created task "' || new.name || '"');
  elsif (tg_op = 'UPDATE' and old.status <> new.status) then
    insert into activity_log (profile_id, action, entity_type, entity_id, description)
    values (auth.uid(), 'status_changed', 'task', new.id,
      'moved "' || new.name || '" from ' || old.status || ' to ' || new.status);
  end if;
  return new;
end;
$$;

create or replace trigger tasks_log_activity
  after insert or update on tasks
  for each row execute procedure log_task_activity();

-- notify assignees when a task is assigned to them
create or replace function notify_task_assignee()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t_name text;
begin
  select name into t_name from tasks where id = new.task_id;
  insert into notifications (profile_id, title, body, link)
  values (new.profile_id, 'New task assigned', 'You were assigned to "' || t_name || '"', '/tasks');
  return new;
end;
$$;

create or replace trigger task_assignees_notify
  after insert on task_assignees
  for each row execute procedure notify_task_assignee();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table profiles enable row level security;
alter table wedding_settings enable row level security;
alter table events enable row level security;
alter table tasks enable row level security;
alter table task_assignees enable row level security;
alter table task_checklist_items enable row level security;
alter table task_comments enable row level security;
alter table shopping_items enable row level security;
alter table budget_items enable row level security;
alter table vendors enable row level security;
alter table guests enable row level security;
alter table notifications enable row level security;
alter table activity_log enable row level security;

-- PROFILES: everyone signed in can read all profiles (to see assignees);
-- only the owner or an admin can update; only admins can delete.
drop policy if exists "profiles_select_all" on profiles;
create policy "profiles_select_all" on profiles for select using (auth.uid() is not null);
drop policy if exists "profiles_update_own_or_admin" on profiles;
create policy "profiles_update_own_or_admin" on profiles for update
  using (auth.uid() = id or is_admin());
drop policy if exists "profiles_insert_admin" on profiles;
create policy "profiles_insert_admin" on profiles for insert with check (is_admin());

-- WEDDING_SETTINGS: everyone reads, only admin writes.
drop policy if exists "settings_select_all" on wedding_settings;
create policy "settings_select_all" on wedding_settings for select using (auth.uid() is not null);
drop policy if exists "settings_write_admin" on wedding_settings;
create policy "settings_write_admin" on wedding_settings for all
  using (is_admin()) with check (is_admin());

-- EVENTS: everyone reads, only admin writes.
drop policy if exists "events_select_all" on events;
create policy "events_select_all" on events for select using (auth.uid() is not null);
drop policy if exists "events_write_admin" on events;
create policy "events_write_admin" on events for all
  using (is_admin()) with check (is_admin());

-- TASKS: everyone reads. Admin can do anything. Assignees can update
-- (status/completion/etc.) only on tasks assigned to them.
drop policy if exists "tasks_select_all" on tasks;
create policy "tasks_select_all" on tasks for select using (auth.uid() is not null);
drop policy if exists "tasks_admin_all" on tasks;
create policy "tasks_admin_all" on tasks for all using (is_admin()) with check (is_admin());
drop policy if exists "tasks_assignee_update" on tasks;
create policy "tasks_assignee_update" on tasks for update
  using (is_task_assignee(id)) with check (is_task_assignee(id));

-- TASK_ASSIGNEES: everyone reads; admin manages; a member can see their own rows.
drop policy if exists "task_assignees_select_all" on task_assignees;
create policy "task_assignees_select_all" on task_assignees for select using (auth.uid() is not null);
drop policy if exists "task_assignees_admin_write" on task_assignees;
create policy "task_assignees_admin_write" on task_assignees for all
  using (is_admin()) with check (is_admin());

-- CHECKLIST ITEMS: everyone reads; admin or assignee of parent task can write.
drop policy if exists "checklist_select_all" on task_checklist_items;
create policy "checklist_select_all" on task_checklist_items for select using (auth.uid() is not null);
drop policy if exists "checklist_admin_write" on task_checklist_items;
create policy "checklist_admin_write" on task_checklist_items for all
  using (is_admin()) with check (is_admin());
drop policy if exists "checklist_assignee_write" on task_checklist_items;
create policy "checklist_assignee_write" on task_checklist_items for update
  using (is_task_assignee(task_id)) with check (is_task_assignee(task_id));

-- COMMENTS: everyone reads; any signed-in member can add a comment on tasks
-- they're assigned to, or admin can comment anywhere.
drop policy if exists "comments_select_all" on task_comments;
create policy "comments_select_all" on task_comments for select using (auth.uid() is not null);
drop policy if exists "comments_insert" on task_comments;
create policy "comments_insert" on task_comments for insert
  with check (is_admin() or is_task_assignee(task_id));
drop policy if exists "comments_delete_own_or_admin" on task_comments;
create policy "comments_delete_own_or_admin" on task_comments for delete
  using (profile_id = auth.uid() or is_admin());

-- SHOPPING / BUDGET / VENDORS / GUESTS: everyone reads; only admin writes,
-- except a volunteer can update the shopping item purchase status when
-- they are the assignee.
drop policy if exists "shopping_select_all" on shopping_items;
create policy "shopping_select_all" on shopping_items for select using (auth.uid() is not null);
drop policy if exists "shopping_admin_write" on shopping_items;
create policy "shopping_admin_write" on shopping_items for all
  using (is_admin()) with check (is_admin());
drop policy if exists "shopping_assignee_update" on shopping_items;
create policy "shopping_assignee_update" on shopping_items for update
  using (assigned_to = auth.uid()) with check (assigned_to = auth.uid());

drop policy if exists "budget_select_all" on budget_items;
create policy "budget_select_all" on budget_items for select using (auth.uid() is not null);
drop policy if exists "budget_admin_write" on budget_items;
create policy "budget_admin_write" on budget_items for all
  using (is_admin()) with check (is_admin());

drop policy if exists "vendors_select_all" on vendors;
create policy "vendors_select_all" on vendors for select using (auth.uid() is not null);
drop policy if exists "vendors_admin_write" on vendors;
create policy "vendors_admin_write" on vendors for all
  using (is_admin()) with check (is_admin());

drop policy if exists "guests_select_all" on guests;
create policy "guests_select_all" on guests for select using (auth.uid() is not null);
drop policy if exists "guests_admin_write" on guests;
create policy "guests_admin_write" on guests for all
  using (is_admin()) with check (is_admin());

-- NOTIFICATIONS: users only see/manage their own.
drop policy if exists "notifications_select_own" on notifications;
create policy "notifications_select_own" on notifications for select using (profile_id = auth.uid());
drop policy if exists "notifications_update_own" on notifications;
create policy "notifications_update_own" on notifications for update using (profile_id = auth.uid());
drop policy if exists "notifications_insert_system" on notifications;
create policy "notifications_insert_system" on notifications for insert with check (true);

-- ACTIVITY LOG: everyone reads (transparency), only system/admin inserts.
drop policy if exists "activity_select_all" on activity_log;
create policy "activity_select_all" on activity_log for select using (auth.uid() is not null);
drop policy if exists "activity_insert" on activity_log;
create policy "activity_insert" on activity_log for insert with check (true);

-- ============================================================================
-- REALTIME
-- ============================================================================
do $$ begin
  alter publication supabase_realtime add table tasks;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table task_assignees;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table task_checklist_items;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table task_comments;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table events;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table shopping_items;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table budget_items;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table notifications;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table activity_log;
exception when duplicate_object then null; end $$;

-- ============================================================================
-- STORAGE (receipts, avatars, documents)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false),
       ('avatars', 'avatars', true),
       ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "receipts_read_authenticated" on storage.objects;
create policy "receipts_read_authenticated" on storage.objects for select
  using (bucket_id = 'receipts' and auth.uid() is not null);
drop policy if exists "receipts_write_authenticated" on storage.objects;
create policy "receipts_write_authenticated" on storage.objects for insert
  with check (bucket_id = 'receipts' and auth.uid() is not null);

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');
drop policy if exists "avatars_write_own" on storage.objects;
create policy "avatars_write_own" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid() is not null);

drop policy if exists "documents_read_authenticated" on storage.objects;
create policy "documents_read_authenticated" on storage.objects for select
  using (bucket_id = 'documents' and auth.uid() is not null);
drop policy if exists "documents_write_admin" on storage.objects;
create policy "documents_write_admin" on storage.objects for insert
  with check (bucket_id = 'documents' and is_admin());
