-- Migration: initial_schema
-- ADHD Budgeting App (MVP #1) — all 10 tables, constraints, RLS, and indexes.
-- Design: docs/database-design.md  |  Diagram: docs/database-diagram.md  |  Decisions: docs/adr/0022-*.md
--
-- Conventions (ADR-0009/0010/0012/0019/0020, ADR-0022):
--   * Money is integer cents; entry amounts CHECK (> 0).
--   * UUID primary keys (gen_random_uuid); profiles.id = auth.users.id.
--   * Every table except profiles has user_id -> auth.users ON DELETE CASCADE, indexed.
--   * Allowed-value lists are text + CHECK (not native enums).
--   * Calculated values (next due/expected date, safe-to-spend) are never stored.
--   * RLS on every table; one owner-only policy per command: (select auth.uid()) = user_id
--     (profiles: = id).

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at current on editable tables
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''   -- pin search_path (Supabase linter hardening); now() resolves from pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===========================================================================
-- 1. profiles  (one row per account; keyed on the auth user id)
-- ===========================================================================
create table public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  display_name          text,
  time_zone             text        not null default 'UTC',
  default_reminder_time time,
  opening_balance_cents integer     not null default 0,   -- negative allowed (overdrawn start)
  flex_buffer_cents     integer     not null default 0 check (flex_buffer_cents >= 0),
  last_active_date      date,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles_delete_own" on public.profiles
  for delete using ((select auth.uid()) = id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- 2. deposit_schedules  (recurring money-in definitions; "income")
-- ===========================================================================
create table public.deposit_schedules (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  name         text,
  amount_cents integer     not null check (amount_cents > 0),
  frequency    text        not null check (frequency in ('one_time','weekly','biweekly','semimonthly','monthly')),
  anchor_date  date        not null,
  second_day   smallint    check (second_day is null or (second_day between 1 and 31 and frequency = 'semimonthly')),
  status       text        not null default 'active' check (status in ('active','paused')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.deposit_schedules enable row level security;

create policy "deposit_schedules_select_own" on public.deposit_schedules
  for select using ((select auth.uid()) = user_id);
create policy "deposit_schedules_insert_own" on public.deposit_schedules
  for insert with check ((select auth.uid()) = user_id);
create policy "deposit_schedules_update_own" on public.deposit_schedules
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "deposit_schedules_delete_own" on public.deposit_schedules
  for delete using ((select auth.uid()) = user_id);

create index deposit_schedules_user_id_idx on public.deposit_schedules (user_id);

create trigger deposit_schedules_set_updated_at
  before update on public.deposit_schedules
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- 3. deposits  (every money-in arrival; scheduled or one-off)
-- ===========================================================================
create table public.deposits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  schedule_id  uuid        references public.deposit_schedules (id) on delete set null,  -- null = one-off
  amount_cents integer     not null check (amount_cents > 0),
  deposit_date date        not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.deposits enable row level security;

create policy "deposits_select_own" on public.deposits
  for select using ((select auth.uid()) = user_id);
create policy "deposits_insert_own" on public.deposits
  for insert with check ((select auth.uid()) = user_id);
create policy "deposits_update_own" on public.deposits
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "deposits_delete_own" on public.deposits
  for delete using ((select auth.uid()) = user_id);

create index deposits_user_id_idx on public.deposits (user_id);
create index deposits_schedule_id_idx on public.deposits (schedule_id);

create trigger deposits_set_updated_at
  before update on public.deposits
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- 4. bills  (bills and subscriptions)
-- ===========================================================================
create table public.bills (
  id                   uuid        primary key default gen_random_uuid(),
  user_id              uuid        not null references auth.users (id) on delete cascade,
  name                 text        not null,
  amount_cents         integer     not null check (amount_cents > 0),
  kind                 text        not null check (kind in ('bill','subscription')),
  frequency            text        not null check (frequency in ('one_time','weekly','biweekly','semimonthly','monthly')),
  anchor_date          date        not null,
  second_day           smallint    check (second_day is null or (second_day between 1 and 31 and frequency = 'semimonthly')),
  reminder_offset_days smallint    check (reminder_offset_days is null or reminder_offset_days >= 0),  -- null = payday-before-due default
  status               text        not null default 'active' check (status in ('active','paused')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.bills enable row level security;

create policy "bills_select_own" on public.bills
  for select using ((select auth.uid()) = user_id);
create policy "bills_insert_own" on public.bills
  for insert with check ((select auth.uid()) = user_id);
create policy "bills_update_own" on public.bills
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "bills_delete_own" on public.bills
  for delete using ((select auth.uid()) = user_id);

create index bills_user_id_idx on public.bills (user_id);

create trigger bills_set_updated_at
  before update on public.bills
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- 5. bill_payments  (the only home for "is this bill occurrence paid")
-- ===========================================================================
create table public.bill_payments (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  bill_id    uuid        not null references public.bills (id) on delete cascade,
  due_date   date        not null,
  paid_on    date        not null default current_date,
  created_at timestamptz not null default now(),
  unique (bill_id, due_date)   -- cannot mark the same occurrence paid twice
);

alter table public.bill_payments enable row level security;

create policy "bill_payments_select_own" on public.bill_payments
  for select using ((select auth.uid()) = user_id);
create policy "bill_payments_insert_own" on public.bill_payments
  for insert with check ((select auth.uid()) = user_id);
create policy "bill_payments_update_own" on public.bill_payments
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "bill_payments_delete_own" on public.bill_payments
  for delete using ((select auth.uid()) = user_id);

create index bill_payments_user_id_idx on public.bill_payments (user_id);
create index bill_payments_bill_id_idx on public.bill_payments (bill_id);

-- ===========================================================================
-- 6. spending_entries  (purchases and money-back/refund entries)
-- ===========================================================================
create table public.spending_entries (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users (id) on delete cascade,
  amount_cents     integer     not null check (amount_cents > 0),
  entry_date       date        not null default current_date,
  type             text        not null check (type in ('purchase','refund')),
  refunds_entry_id uuid        references public.spending_entries (id) on delete cascade,
  category         text,
  note             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (refunds_entry_id is null or type = 'refund')  -- only a refund may link to a purchase
);

alter table public.spending_entries enable row level security;

create policy "spending_entries_select_own" on public.spending_entries
  for select using ((select auth.uid()) = user_id);
create policy "spending_entries_insert_own" on public.spending_entries
  for insert with check ((select auth.uid()) = user_id);
create policy "spending_entries_update_own" on public.spending_entries
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "spending_entries_delete_own" on public.spending_entries
  for delete using ((select auth.uid()) = user_id);

create index spending_entries_user_id_idx on public.spending_entries (user_id);
create index spending_entries_refunds_entry_id_idx on public.spending_entries (refunds_entry_id);

create trigger spending_entries_set_updated_at
  before update on public.spending_entries
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- 7. set_aside_items  (the "decide later" list)
-- ===========================================================================
create table public.set_aside_items (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  name        text        not null,
  price_cents integer     not null check (price_cents > 0),
  added_on    date        not null default current_date,
  outcome     text        not null default 'pending' check (outcome in ('pending','bought','let_go')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.set_aside_items enable row level security;

create policy "set_aside_items_select_own" on public.set_aside_items
  for select using ((select auth.uid()) = user_id);
create policy "set_aside_items_insert_own" on public.set_aside_items
  for insert with check ((select auth.uid()) = user_id);
create policy "set_aside_items_update_own" on public.set_aside_items
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "set_aside_items_delete_own" on public.set_aside_items
  for delete using ((select auth.uid()) = user_id);

create index set_aside_items_user_id_idx on public.set_aside_items (user_id);

create trigger set_aside_items_set_updated_at
  before update on public.set_aside_items
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- 8. reminders  (queued/sent bill reminders the cron job works from)
-- ===========================================================================
create table public.reminders (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  bill_id    uuid        not null references public.bills (id) on delete cascade,
  due_date   date        not null,
  send_at    timestamptz not null,
  status     text        not null default 'pending' check (status in ('pending','sent','failed')),
  tries      integer     not null default 0 check (tries >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bill_id, due_date)   -- idempotent sending (ADR-0015): never send the same reminder twice
);

alter table public.reminders enable row level security;

create policy "reminders_select_own" on public.reminders
  for select using ((select auth.uid()) = user_id);
create policy "reminders_insert_own" on public.reminders
  for insert with check ((select auth.uid()) = user_id);
create policy "reminders_update_own" on public.reminders
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "reminders_delete_own" on public.reminders
  for delete using ((select auth.uid()) = user_id);

create index reminders_user_id_idx on public.reminders (user_id);
create index reminders_bill_id_idx on public.reminders (bill_id);
-- Helps the send job find due reminders quickly (server-side, service-role).
create index reminders_due_idx on public.reminders (status, send_at);

create trigger reminders_set_updated_at
  before update on public.reminders
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- 9. check_ins  (short calm check-in, kept apart from budget data)
-- ===========================================================================
create table public.check_ins (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users (id) on delete cascade,
  check_in_date date        not null default current_date,
  calm_rating   smallint    check (calm_rating is null or calm_rating between 1 and 5),  -- 1 = overwhelmed, 5 = calm
  created_at    timestamptz not null default now()
);

alter table public.check_ins enable row level security;

create policy "check_ins_select_own" on public.check_ins
  for select using ((select auth.uid()) = user_id);
create policy "check_ins_insert_own" on public.check_ins
  for insert with check ((select auth.uid()) = user_id);
create policy "check_ins_update_own" on public.check_ins
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "check_ins_delete_own" on public.check_ins
  for delete using ((select auth.uid()) = user_id);

create index check_ins_user_id_idx on public.check_ins (user_id);

-- ===========================================================================
-- 10. error_events  (privacy-safe monitoring: time, type, screen only)
-- ===========================================================================
-- Special case (ADR-0018): user_id is nullable (a pre-sign-in crash has no user).
-- These rows are written by server / Edge code using the service-role key, which
-- bypasses RLS. RLS stays ENABLED with an owner-only read policy and an own-row
-- insert policy; rows with a null user_id are readable only server-side. No
-- update/delete policies: users never edit error logs, the daily clean-up job runs
-- server-side, and account closure removes rows via ON DELETE CASCADE.
create table public.error_events (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references auth.users (id) on delete cascade,  -- nullable
  occurred_at timestamptz not null default now(),
  type        text        not null check (type in ('failed_reminder','failed_save','user_reported','screen_crash')),
  screen      text
);

alter table public.error_events enable row level security;

create policy "error_events_select_own" on public.error_events
  for select using ((select auth.uid()) = user_id);
create policy "error_events_insert_own" on public.error_events
  for insert with check ((select auth.uid()) = user_id);

create index error_events_user_id_idx on public.error_events (user_id);
-- Helps the daily 30-day clean-up job (server-side, service-role).
create index error_events_occurred_at_idx on public.error_events (occurred_at);
