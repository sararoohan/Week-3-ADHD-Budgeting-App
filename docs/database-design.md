# Database Design — ADHD Budgeting App (MVP #1)

Source: filled from the Week 4 **Database Design Template**, using the Technical Architecture
spec — Database Architecture (tables, integrity rules, access control) and the repo ADRs
(0009 whole cents, 0010 never store the calculable, 0011 three layers, 0012 RLS on every table,
0013 safe-to-spend formula, 0014 money-back entries, 0015 reminders, 0018 monitoring,
0019 edit/delete/undo, 0020 money-in model). Build-time schema choices are recorded in ADR-0022.

This is the concrete, column-level design. The SQL lives in `supabase/migrations/`; the diagram
in `docs/database-diagram.md`.

---

## What does the app need to save?

One sentence per kind of information the app remembers:

- **Account settings** — each person's display name, time zone, default reminder time, opening balance, optional spending buffer, and last active date.
- **Recurring money-in schedules** — the definition of money the user expects on a repeating schedule (what "income" means).
- **Money in** — every deposit that actually arrives, whether it was expected (linked to a schedule) or a one-off.
- **Bills and subscriptions** — each recurring or one-time bill, its amount, schedule, and reminder preference.
- **Bills paid** — a record that a specific bill occurrence was paid, and when.
- **Spending** — each purchase, and each "money back" (refund/return) entry that offsets spending.
- **Decide-later items** — things the user is considering buying, and how each one turned out.
- **Reminders** — each bill reminder the app needs to send, with its send time and status.
- **Check-ins** — a short, optional calm check-in, kept apart from the budget numbers.
- **Error records** — privacy-safe notes of what broke (time, type, screen only), auto-deleted after 30 days.

---

## Shared conventions (apply to every table)

So the per-table tables below stay readable, these rules apply everywhere:

- **`id`** — a UUID primary key, auto-generated (`gen_random_uuid()`). UUIDs are used because Undo
  re-inserts a deleted row with its *original* id (ADR-0019) and refunds reference a purchase by id
  (ADR-0014); random ids make that safe.
- **`user_id`** — a UUID that references the Supabase auth user, `NOT NULL`, `ON DELETE CASCADE`,
  so closing an account deletes every one of that user's rows (integrity rule 1). *Exception:*
  `profiles` uses its own `id` as the owner key and has no separate `user_id`. *Exception:*
  `error_events.user_id` is nullable (see that table).
- **`created_at`** — `timestamptz NOT NULL DEFAULT now()` (UTC). An **`updated_at`** `timestamptz`
  is added on the tables a user edits.
- **Money** — stored as **integer cents** (ADR-0009). Entry amounts carry `CHECK (amount_cents > 0)`.
- **Calendar dates** (paydays, due dates, entry dates) use `date`; moments in time (send, created)
  use `timestamptz` in UTC; the user's time zone lives in `profiles` (integrity rule 3).
- **Allowed-value lists** (status, kind, type, outcome, frequency) are `text` with a `CHECK`
  constraint rather than native ENUM types (ADR-0022), so they are easy to read and extend.
- **Calculated values are never stored** (ADR-0010): safe-to-spend, "next due date," "next expected
  date," and "bills due before payday" are all computed in the money module each time.
- **Row Level Security** is enabled on every table with one owner-only policy for select / insert /
  update / delete: `(select auth.uid()) = user_id` (on `profiles`, `= id`). `user_id` is indexed on
  every table.

For every table below: **who can see it** and **who can add, change, or delete it** is the same —
only the owner (the signed-in user whose `user_id` matches the row). The one special case is
`error_events`, noted there.

---

## Tables

### Table name: `profiles`
**What it stores:** one row of settings per account. Keyed on the auth user id (no separate `user_id`).

| Column name | Type | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid (→ auth user) | Yes | The account this profile belongs to. `ON DELETE CASCADE`. |
| display_name | text | No | What to call the user. |
| time_zone | text | Yes | IANA time zone (e.g. `America/Chicago`); reminders fire in local time. |
| default_reminder_time | time | No | Default time of day for reminders. |
| opening_balance_cents | integer | Yes (default 0) | Money on hand captured at first-run setup. **Negative allowed** (an overdrawn start); no `> 0` check, because it is a balance, not an entry amount. |
| flex_buffer_cents | integer | Yes (default 0) | Optional cushion kept out of safe-to-spend. `CHECK (flex_buffer_cents >= 0)`. |
| last_active_date | date | No | Powers the gentle "welcome back" re-entry. |
| created_at / updated_at | timestamptz | Yes / No | Standard timestamps. |

**Who can see it?** Only the owner. **Who can add, change, or delete it?** Only the owner.

---

### Table name: `deposit_schedules`
**What it stores:** the definition of money the user expects on a repeating schedule. A linked
deposit is "income"; MVP #1 supports one recurring schedule per user (ADR-0020).

| Column name | Type | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | Unique id. |
| user_id | uuid | Yes | Owner. `ON DELETE CASCADE`. |
| name | text | No | e.g. "Paycheck." |
| amount_cents | integer | Yes | Expected amount. `CHECK (amount_cents > 0)`. |
| frequency | text | Yes | `one_time` / `weekly` / `biweekly` / `semimonthly` / `monthly`, via `CHECK`. |
| anchor_date | date | Yes | The reference date all future dates are calculated from. |
| second_day | smallint | No | Only used for `semimonthly` (the second day of the month, e.g. 15th). `CHECK (second_day BETWEEN 1 AND 31)`. |
| status | text | Yes (default `active`) | `active` / `paused`, via `CHECK`. |
| created_at / updated_at | timestamptz | Yes / No | Standard timestamps. |

*No `next_expected_date` column — it is calculated from the schedule (ADR-0010, integrity rule 4).*

**Who can see / change it?** Only the owner.

---

### Table name: `deposits`
**What it stores:** every actual money-in arrival. Linked to a schedule = expected pay; unlinked =
a one-off (gift, sale, transfer). The distinction is scheduled vs one-off — there is no type
(ADR-0020). This is the only home for "did a scheduled deposit arrive" (integrity rule 6).

| Column name | Type | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | Unique id. |
| user_id | uuid | Yes | Owner. `ON DELETE CASCADE`. |
| schedule_id | uuid | No | Links to a `deposit_schedules` row if this was expected pay. `ON DELETE SET NULL` — deleting the schedule keeps the arrived-money history (integrity rule 9). **NULL = a one-off deposit.** |
| amount_cents | integer | Yes | What arrived. `CHECK (amount_cents > 0)`. |
| deposit_date | date | Yes (default today) | When it landed. |
| created_at / updated_at | timestamptz | Yes / No | Standard timestamps. |

**Who can see / change it?** Only the owner.

---

### Table name: `bills`
**What it stores:** each bill or subscription, its amount, schedule, and reminder preference.

| Column name | Type | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | Unique id. |
| user_id | uuid | Yes | Owner. `ON DELETE CASCADE`. |
| name | text | Yes | e.g. "Electric." |
| amount_cents | integer | Yes | `CHECK (amount_cents > 0)`. |
| kind | text | Yes | `bill` / `subscription`, via `CHECK`. |
| frequency | text | Yes | Same schedule shape as deposits: `one_time` / `weekly` / `biweekly` / `semimonthly` / `monthly`, via `CHECK`. |
| anchor_date | date | Yes | Reference date; future due dates are calculated from it. |
| second_day | smallint | No | Only for `semimonthly`. `CHECK (second_day BETWEEN 1 AND 31)`. |
| reminder_offset_days | smallint | No | `NULL` = the default (remind on the payday before the due date, with a fixed 3-day-before fallback computed in the money module); a number = exactly that many days before due. `CHECK (reminder_offset_days >= 0)`. |
| status | text | Yes (default `active`) | `active` / `paused`, via `CHECK`. |
| created_at / updated_at | timestamptz | Yes / No | Standard timestamps. |

*No `next_due_date` column — it is calculated (ADR-0010, integrity rule 4). The 3-day fallback is a
rule in the money module, not stored data.*

**Who can see / change it?** Only the owner.

---

### Table name: `bill_payments`
**What it stores:** a record that a specific bill occurrence was paid. This is the **only** home for
"is this bill paid" (integrity rule 6). A bill recurs, so the `due_date` identifies *which* occurrence.

| Column name | Type | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | Unique id. |
| user_id | uuid | Yes | Owner. `ON DELETE CASCADE`. |
| bill_id | uuid | Yes | Which bill → `bills(id)`, `ON DELETE CASCADE`. |
| due_date | date | Yes | The occurrence that was paid. |
| paid_on | date | Yes (default today) | When it was marked paid. |
| created_at | timestamptz | Yes | Standard timestamp. |

**Constraint:** `UNIQUE (bill_id, due_date)` — makes it impossible to mark the same bill occurrence
paid twice, which would corrupt safe-to-spend.

**Who can see / change it?** Only the owner.

---

### Table name: `spending_entries`
**What it stores:** purchases and "money back" (refund/return) entries. A refund is a positive
amount of a distinct type, not a negative number (ADR-0014).

| Column name | Type | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | Unique id. |
| user_id | uuid | Yes | Owner. `ON DELETE CASCADE`. |
| amount_cents | integer | Yes | Always positive, even for refunds. `CHECK (amount_cents > 0)`. |
| entry_date | date | Yes (default today) | When it happened. |
| type | text | Yes | `purchase` / `refund`, via `CHECK`. |
| refunds_entry_id | uuid | No | On a refund, optionally the purchase it offsets → `spending_entries(id)` (self-link), `ON DELETE CASCADE` (deleting a purchase removes its linked refunds, ADR-0019). NULL on purchases and standalone refunds. |
| category | text | No | Optional grouping for "where money went." |
| note | text | No | Optional free text. |
| created_at / updated_at | timestamptz | Yes / No | Standard timestamps. |

**Constraint:** `CHECK (refunds_entry_id IS NULL OR type = 'refund')` — only a refund may point at a
purchase.

**Who can see / change it?** Only the owner.

---

### Table name: `set_aside_items`
**What it stores:** the "decide later" list for impulse purchases, and how each one turned out.

| Column name | Type | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | Unique id. |
| user_id | uuid | Yes | Owner. `ON DELETE CASCADE`. |
| name | text | Yes | What they are considering. |
| price_cents | integer | Yes | `CHECK (price_cents > 0)`. |
| added_on | date | Yes (default today) | When it went on the list. |
| outcome | text | Yes (default `pending`) | `pending` / `bought` / `let_go`, via `CHECK`. Starts at `pending` until the user decides. |
| created_at / updated_at | timestamptz | Yes / No | Standard timestamps. |

**Who can see / change it?** Only the owner.

---

### Table name: `reminders`
**What it stores:** each bill reminder the send job works from. `send_at` is a stored, queryable
fact (the exact UTC moment to send), not a derived value.

| Column name | Type | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | Unique id. |
| user_id | uuid | Yes | Owner. `ON DELETE CASCADE`. |
| bill_id | uuid | Yes | Which bill → `bills(id)`, `ON DELETE CASCADE`. |
| due_date | date | Yes | The bill occurrence this reminds about. |
| send_at | timestamptz | Yes | Exact UTC moment to send. |
| status | text | Yes (default `pending`) | `pending` / `sent` / `failed`, via `CHECK`. |
| tries | integer | Yes (default 0) | Retry count; recorded failed after the 3rd failure (ADR-0015). `CHECK (tries >= 0)`. |
| created_at / updated_at | timestamptz | Yes / No | Standard timestamps. |

**Constraint:** `UNIQUE (bill_id, due_date)` — enforces idempotency so the same reminder is never
sent twice (ADR-0015).

**Who can see / change it?** Only the owner. (The send job reads/writes these via server code — see
the note on access control below.)

---

### Table name: `check_ins`
**What it stores:** a short, optional calm check-in, kept apart from the budget numbers (T-14.1.3).

| Column name | Type | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | Unique id. |
| user_id | uuid | Yes | Owner. `ON DELETE CASCADE`. |
| check_in_date | date | Yes (default today) | When they checked in. |
| calm_rating | smallint | No | Optional "how calm do you feel" rating on a **1–5** scale (1 = overwhelmed, 5 = calm). `CHECK (calm_rating BETWEEN 1 AND 5)`. |
| created_at | timestamptz | Yes | Standard timestamp. |

**Who can see / change it?** Only the owner.

---

### Table name: `error_events`
**What it stores:** privacy-safe records of what broke — **time, type, and screen only**. No amounts,
no free text, no personal data (ADR-0018, NFR-11). Rows are auto-deleted after 30 days.

| Column name | Type | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | Unique id. |
| user_id | uuid | **No (nullable)** | The user, *if* signed in. **NULL for a pre-sign-in screen crash**, which has no user yet. `ON DELETE CASCADE` when set. |
| occurred_at | timestamptz | Yes (default now) | When it happened. Basis for the 30-day auto-delete. |
| type | text | Yes | `failed_reminder` / `failed_save` / `user_reported` / `screen_crash`, via `CHECK`. |
| screen | text | No | Which screen, for debugging. |

**Who can see it?** A signed-in user can read only their own error rows (owner-only policy). Rows
with a NULL `user_id` (pre-sign-in crashes) are not readable by any browser user — they exist only
for server-side monitoring.

**Who can add, change, or delete it?** **These records are written by server / Edge Function code**
(the reminder job, the save path, the crash reporter), which uses the service-role key that bypasses
RLS — so writes do not come from the browser. RLS stays **enabled** with an owner-only read policy;
the nullable `user_id` and the server-only writes are the reason this one table differs from the
others. The daily clean-up job (also server-side) deletes rows older than 30 days.

---

## How the tables connect

- One **profile** per account. Every other table's rows belong to exactly one account (`user_id`).
- One **deposit_schedule** can have many **deposits**; a deposit belongs to one schedule or to none (a one-off).
- One **bill** can have many **bill_payments** and many **reminders** — one of each per occurrence (enforced by the `UNIQUE (bill_id, due_date)` rules).
- A **spending_entry** of type `refund` may point to one purchase **spending_entry**; one purchase can have many refunds linked to it.
- **set_aside_items**, **check_ins**, and **error_events** stand alone — each tied only to the account.

---

## Access rules (Row Level Security)

- [ ] **RLS is turned on for every table.** Each of the 10 tables has RLS enabled.
- [ ] **Each table has a rule that lets people see only their own rows** — one owner-only policy per
      table for select / insert / update / delete: `(select auth.uid()) = user_id` (on `profiles`,
      `(select auth.uid()) = id`). `user_id` is indexed on every table (ADR-0012).
- [ ] **Tested with two accounts** — the NFR-1 scenario: a second test user gets **zero** of the
      first user's rows, checked in every automated run. *(Verified at step 8 once the schema is
      applied to a real Supabase project.)*

The service-role key (which bypasses RLS) is used only in server code — the reminder job, account
deletion, and error-record writes — and that code still filters by the signed-in user where
relevant (ADR-0012). See the Keep Your App Safe Checklist for the key-handling rules.

---

## Database diagram

A Mermaid `erDiagram` of these 10 tables and their relationships is saved at
**`docs/database-diagram.md`** (GitHub renders Mermaid as a picture). The link also goes in the
Submission Template.

---

## Migration files

- [ ] **Every change to the database is saved as a SQL migration file** in `supabase/migrations/`
      (ADR-0022: Supabase CLI migrations — versioned and rebuildable).
- [ ] **Each migration's name says what it does** — e.g. the first is
      `<timestamp>_initial_schema.sql` (create all 10 tables, constraints, RLS policies, and
      `user_id` indexes).
