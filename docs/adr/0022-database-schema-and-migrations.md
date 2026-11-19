# ADR-0022: Database schema implementation — migrations, CHECK-based enums, schedule shape, and FK/null rules

## Date and status
2026-11-18. Accepted

## Context
The data model is settled across earlier ADRs and the Database Architecture spec: whole-cent money
(ADR-0009), nothing calculable stored (ADR-0010), three layers with a pure money module (ADR-0011),
RLS on every table (ADR-0012), the safe-to-spend formula (ADR-0013), money-back entries (ADR-0014),
reminder delivery (ADR-0015), monitoring (ADR-0018), edit/delete/undo (ADR-0019), and the no-kind
money-in model (ADR-0020). Turning that model into an actual Postgres schema (see
`docs/database-design.md`) forces several **build-time implementation choices** that none of those
ADRs pin down: how migrations are applied and versioned, how allowed-value lists are represented,
how a repeating schedule is stored, what primary-key type to use, and the exact
foreign-key/nullability rules at the edges. These are hard to change once data exists, so they are
recorded here. This is Phase 0, before any tables exist — the cheapest moment to get them right.

## Options

**How migrations are applied**
- **Supabase CLI migrations in `supabase/migrations/` (chosen)**
  - Good: every schema change is a named, version-controlled SQL file; the database can be rebuilt
    from the repo (matters because the free plan has no automatic backups — spec T-4.3.1); satisfies
    the Database Design Template's "every change is a migration file" requirement; works whether SQL
    is applied via the CLI or pasted into the Supabase SQL editor.
  - Bad: one-time `supabase init` and CLI setup.
- **Edit tables in the Supabase dashboard, keep a `schema.sql` copy**
  - Good: nothing to set up.
  - Bad: easy to drift between the live database and the repo; no ordered history of changes.

**Allowed-value lists (status, kind, type, outcome, frequency)**
- **`text` + `CHECK` constraint (chosen)**
  - Good: readable in plain SQL; adding a value is a one-line migration; no type juggling in queries.
  - Bad: the allowed set is per-column, not a named reusable type.
- **Native Postgres `ENUM` types**
  - Good: one named type, reusable across columns.
  - Bad: adding or removing a value is awkward (`ALTER TYPE`, ordering rules); more ceremony than an
    MVP with a handful of small lists needs.

**Primary-key type**
- **UUID (`gen_random_uuid()`) (chosen)**
  - Good: Undo re-inserts a deleted row with its *original* id (ADR-0019) and refunds reference a
    purchase by id (ADR-0014) — random, non-guessable ids make both safe and make ids stable across
    delete/restore; Supabase's common convention.
  - Bad: slightly larger than a bigint; not human-friendly to read.
- **Auto-increment `bigint` identity**
  - Good: compact, human-readable.
  - Bad: sequential ids are guessable, and gaps/reuse interact awkwardly with the re-insert-with-same-id
    Undo requirement.

## Decision
1. **Migrations:** apply the schema with **Supabase CLI migrations** in `supabase/migrations/`, one
   named SQL file per change, starting with `<timestamp>_initial_schema.sql` (all 10 tables,
   constraints, RLS policies, and `user_id` indexes). The same SQL can be pasted into the Supabase
   SQL editor; the migration file is the source of truth either way.
2. **Allowed-value lists** are stored as `text` with a `CHECK` constraint, not native ENUM types.
3. **Primary keys** are `uuid` defaulting to `gen_random_uuid()`. `profiles.id` is the auth user's
   id (`references auth.users(id) on delete cascade`); every other table has its own `uuid` PK plus a
   `user_id` owner column.
4. **Schedule shape** (used by `deposit_schedules` and `bills`): `frequency` (`one_time` / `weekly` /
   `biweekly` / `semimonthly` / `monthly`), `anchor_date` (the reference date), and a nullable
   `second_day smallint` used only for `semimonthly`. "Next due / next expected date" is **not**
   stored — it is calculated in the money module (ADR-0010). The 3-day reminder fallback (when no
   payday precedes a due date) is likewise a money-module rule, not a column.
5. **Foreign-key and nullability rules:**
   - Every `user_id` references `auth.users(id)` `ON DELETE CASCADE` (integrity rule 1); `user_id` is
     indexed on every table.
   - `deposits.schedule_id` is nullable and `ON DELETE SET NULL` — a one-off deposit has none, and
     deleting a schedule keeps the arrived-money history (integrity rule 9).
   - `spending_entries.refunds_entry_id` is a nullable self-link, `ON DELETE CASCADE`, with
     `CHECK (refunds_entry_id IS NULL OR type = 'refund')` — deleting a purchase removes its linked
     refunds (ADR-0019), and only a refund may link to a purchase.
   - `bill_payments.bill_id` and `reminders.bill_id` reference `bills(id)` `ON DELETE CASCADE`.
   - `opening_balance_cents` is an integer with **no `> 0` check** (a balance may be negative — an
     overdrawn start); `flex_buffer_cents` is `>= 0`; all *entry* amounts are `> 0` (ADR-0009).
   - `error_events.user_id` is **nullable** (a pre-sign-in crash has no user); these rows are written
     by server/Edge code using the service-role key, with RLS still enabled and an owner-only read
     policy (ADR-0018).
   - Uniqueness: `UNIQUE (bill_id, due_date)` on both `bill_payments` (no double-paid occurrence) and
     `reminders` (idempotent sending, ADR-0015).

## Consequences
The schema is reproducible from the repo, which is the only backup on the free plan. Allowed-value
lists and the schedule shape are easy to extend as MVP grows (e.g. a new frequency is a one-line
`CHECK` change). UUID keys make the Undo and refund-link behavior safe. The CHECK and UNIQUE
constraints push key integrity rules (positive amounts, refund-only links, no double payment, no
duplicate reminders) down into the database, so a bug fails loudly instead of showing a wrong number.
Calculated dates stay out of the schema, so they can never go stale (ADR-0010). If a later need
arises — native enums, a different key strategy, multiple recurring schedules (MMP), or durable
undo — that is a new ADR superseding the relevant decision here. The concrete column-level design
lives in `docs/database-design.md`; the diagram in `docs/database-diagram.md`.

### Deferred hardening (future work)
The foreign keys `bill_payments.bill_id`, `reminders.bill_id`, `deposits.schedule_id`, and
`spending_entries.refunds_entry_id` reference a parent row **by id only**, not by `(id, user_id)`.
A user could therefore create one of *their own* rows that points at another user's parent id. The
risk is **low** — RLS still blocks reading anyone else's data, the ids are unguessable UUIDs, server
actions validate input (ADR-0011), and the only possible harm is a user corrupting *their own*
numbers. Enforcing same-owner at the database would mean **composite foreign keys** (e.g.
`bills UNIQUE (id, user_id)` with `bill_payments (bill_id, user_id) → bills (id, user_id)`). This is
**deliberately deferred**: the `deposits.schedule_id` case is nullable with `ON DELETE SET NULL`,
which needs Postgres's column-specific `SET NULL` and careful null-matching — complexity not worth it
for MVP #1's low risk. If the ownership guarantee is ever needed at the database level, add the
composite keys in a new migration (no ADR supersession required — this note records the decision).
