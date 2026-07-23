-- ============================================================================
-- Collaboration + reminders — run AFTER 0001_init.sql and 0002_vendor_bookings.sql
--
-- SAFE TO RE-RUN: same idempotent pattern as the earlier migrations.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- @MENTIONS ON TASK COMMENTS
-- ---------------------------------------------------------------------------
alter table task_comments add column if not exists mentioned_profile_ids uuid[] not null default '{}';

-- lets a mentioned (but not formally assigned) person reply on that task
create or replace function is_task_mentioned(t_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from task_comments
    where task_id = t_id and auth.uid() = any(mentioned_profile_ids)
  );
$$;

drop policy if exists "comments_insert" on task_comments;
create policy "comments_insert" on task_comments for insert
  with check (is_admin() or is_task_assignee(task_id) or is_task_mentioned(task_id));

-- notify everyone @mentioned in a new comment
create or replace function notify_mentioned_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mentioned_id uuid;
  t_name text;
  commenter_name text;
begin
  if new.mentioned_profile_ids is null or array_length(new.mentioned_profile_ids, 1) is null then
    return new;
  end if;

  select name into t_name from tasks where id = new.task_id;
  select full_name into commenter_name from profiles where id = new.profile_id;

  foreach mentioned_id in array new.mentioned_profile_ids loop
    if mentioned_id is distinct from new.profile_id then
      insert into notifications (profile_id, title, body, link)
      values (
        mentioned_id,
        coalesce(commenter_name, 'Someone') || ' mentioned you',
        'On "' || coalesce(t_name, 'a task') || '": ' || left(new.body, 120),
        '/tasks'
      );
    end if;
  end loop;

  return new;
end;
$$;

create or replace trigger task_comments_notify_mentions
  after insert on task_comments
  for each row execute procedure notify_mentioned_users();

-- ---------------------------------------------------------------------------
-- BUDGET ITEMS: add a due date so budget lines (not just vendor bookings)
-- can appear on the unified payment calendar and get reminders.
-- ---------------------------------------------------------------------------
alter table budget_items add column if not exists due_date date;

-- ---------------------------------------------------------------------------
-- PAYMENT & TRIAL REMINDERS (2 weeks out), sent to every admin
-- ---------------------------------------------------------------------------

-- de-dup log so a daily cron run never sends the same reminder twice
create table if not exists sent_reminders (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null,
  entity_id uuid not null,
  reminder_date date not null,
  created_at timestamptz not null default now(),
  unique (entity_type, entity_id, reminder_date)
);

alter table sent_reminders enable row level security;
drop policy if exists "sent_reminders_select_all" on sent_reminders;
create policy "sent_reminders_select_all" on sent_reminders for select using (auth.uid() is not null);

create or replace function send_payment_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target date := current_date + interval '14 days';
  r record;
  admin_id uuid;
begin
  -- budget items with a payment due in exactly 14 days
  for r in
    select bi.id, bi.item_name, bi.due_date
    from budget_items bi
    where bi.payment_status <> 'paid' and bi.due_date = target
  loop
    if not exists (select 1 from sent_reminders where entity_type = 'budget_item' and entity_id = r.id and reminder_date = target) then
      for admin_id in select id from profiles where role = 'admin' loop
        insert into notifications (profile_id, title, body, link)
        values (
          admin_id,
          'Payment due in 2 weeks',
          r.item_name || ' — due ' || to_char(r.due_date, 'DD Mon'),
          '/budget'
        );
      end loop;
      insert into sent_reminders (entity_type, entity_id, reminder_date) values ('budget_item', r.id, target);
    end if;
  end loop;

  -- vendor booking final payments due in 14 days
  for r in
    select vb.id, vb.category, vb.vendor_name, vb.final_payment_due_date
    from vendor_bookings vb
    where vb.final_payment_due_date = target
  loop
    if not exists (select 1 from sent_reminders where entity_type = 'booking_payment' and entity_id = r.id and reminder_date = target) then
      for admin_id in select id from profiles where role = 'admin' loop
        insert into notifications (profile_id, title, body, link)
        values (
          admin_id,
          'Payment due in 2 weeks',
          coalesce(r.vendor_name, r.category) || ' — final payment due ' || to_char(r.final_payment_due_date, 'DD Mon'),
          '/bookings'
        );
      end loop;
      insert into sent_reminders (entity_type, entity_id, reminder_date) values ('booking_payment', r.id, target);
    end if;
  end loop;

  -- vendor booking trial/tasting dates in 14 days
  for r in
    select vb.id, vb.category, vb.vendor_name, vb.trial_scheduled_date
    from vendor_bookings vb
    where vb.trial_scheduled_date = target
  loop
    if not exists (select 1 from sent_reminders where entity_type = 'booking_trial' and entity_id = r.id and reminder_date = target) then
      for admin_id in select id from profiles where role = 'admin' loop
        insert into notifications (profile_id, title, body, link)
        values (
          admin_id,
          'Trial/tasting in 2 weeks',
          coalesce(r.vendor_name, r.category) || ' — scheduled ' || to_char(r.trial_scheduled_date, 'DD Mon'),
          '/bookings'
        );
      end loop;
      insert into sent_reminders (entity_type, entity_id, reminder_date) values ('booking_trial', r.id, target);
    end if;
  end loop;

  -- clothes fitting dates in 14 days (fitting_dates is an array per booking)
  for r in
    select vb.id, vb.category, vb.vendor_name, unnest(vb.fitting_dates) as fitting_date
    from vendor_bookings vb
    where vb.fitting_dates is not null
  loop
    if r.fitting_date = target
       and not exists (select 1 from sent_reminders where entity_type = 'booking_fitting_' || r.fitting_date and entity_id = r.id and reminder_date = target) then
      for admin_id in select id from profiles where role = 'admin' loop
        insert into notifications (profile_id, title, body, link)
        values (
          admin_id,
          'Fitting in 2 weeks',
          coalesce(r.vendor_name, r.category) || ' — fitting ' || to_char(r.fitting_date, 'DD Mon'),
          '/bookings'
        );
      end loop;
      insert into sent_reminders (entity_type, entity_id, reminder_date)
        values ('booking_fitting_' || r.fitting_date, r.id, target);
    end if;
  end loop;
end;
$$;

-- Schedule it daily at 08:00 UTC via pg_cron. If this errors with a
-- permission error, enable the "pg_cron" extension first via Supabase
-- Dashboard -> Database -> Extensions, then re-run just this block.
do $$
begin
  create extension if not exists pg_cron;
exception when insufficient_privilege then
  raise notice 'Could not enable pg_cron automatically — enable it via Database -> Extensions in the Supabase dashboard, then re-run this migration.';
end $$;

do $$
begin
  perform cron.unschedule('daily-payment-reminders');
exception when others then
  null; -- job didn't exist yet, nothing to unschedule
end $$;

do $$
begin
  perform cron.schedule('daily-payment-reminders', '0 8 * * *', 'select send_payment_reminders();');
exception when undefined_function then
  raise notice 'pg_cron is not enabled — payment/trial reminders will not run automatically until it is. See note above.';
end $$;
