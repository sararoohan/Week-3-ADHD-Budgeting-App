# ADR-0025: Create the profiles row on sign-up with a database trigger

## Date and status
2026-11-23. Accepted

## Context
Supabase Auth creates a row in `auth.users` when someone signs in for the first time (via Google
today — ADR-0008). The app also needs a matching row in `public.profiles`, which is keyed on the
auth user id (`profiles.id = auth.users.id`, ADR-0022) and holds per-user settings (`time_zone`,
`opening_balance_cents`, `flex_buffer_cents`, …) and anchors the user's data. Nothing creates that
`profiles` row yet, so the first feature that reads or writes a profile would find none.

We need to decide **who creates the profiles row, and when** — a decision that shapes an invariant
("every account has exactly one profile") the rest of the app will depend on, so it is recorded here.

## Options
- **Database trigger on `auth.users` (chosen)** — a Postgres `AFTER INSERT` trigger inserts the
  `profiles` row automatically when the auth user is created.
  - Good: **guaranteed and atomic** — the profile exists the instant the account does, server-side;
    **no app code path can forget it**, and it covers every sign-up path (Google now, email/admin
    later); the invariant lives where it can't be bypassed. It's the standard Supabase pattern.
  - Bad: the logic lives in SQL (a migration), so it's less visible to app developers; needs a
    carefully written `SECURITY DEFINER` function (we already pin `search_path` for the same reason
    in `set_updated_at`, so the pattern is familiar).
- **App-side upsert** — the app inserts the profiles row on first authenticated load / in the auth
  callback, "insert if it doesn't exist."
  - Good: logic in TypeScript — visible, easy to unit-test, flexible (e.g. capture the browser's
    time zone and store it immediately).
  - Bad: **fragile** — it must run on *every* entry path; miss one and a user has no profile and
    their queries break. Race conditions (two concurrent requests) need on-conflict handling anyway.
    It relies on the app *remembering* to do it, so the invariant isn't enforced where the data lives.

## Decision
1. Add a migration with a `SECURITY DEFINER` function `public.handle_new_user()` and an
   `AFTER INSERT` trigger `on_auth_user_created` on `auth.users` that inserts a `public.profiles`
   row for the new user. The same migration also **backfills** a profile for any pre-existing auth
   users (the trigger fires only on new inserts), so the invariant holds for existing accounts too.
2. **Keep the trigger minimal:** insert `id` only. Every other `profiles` column has a default
   (`time_zone` defaults to `'UTC'`). `ON CONFLICT (id) DO NOTHING` makes it idempotent against a
   duplicate id. This is a **narrow** guarantee, not an absolute one: the id-only insert won't fail
   under the current schema, so it won't abort a sign-up — but a future migration that adds a NOT
   NULL column to `profiles` without a default (or a similar constraint the id-only insert can't
   satisfy) would make the trigger raise and abort the sign-up transaction, and must update this
   trigger. We deliberately do **not** wrap the body in a catch-all exception handler: swallowing
   every error would let a user sign up with **no** profile — the exact silent broken state this
   trigger exists to prevent. Failing loudly is preferable here.
3. `SECURITY DEFINER` + `set search_path = ''` (fully schema-qualified) so the insert runs as the
   function owner — which bypasses RLS — satisfying the owner-only insert policy on `profiles`
   without an `auth.uid()` context during sign-up. This mirrors the hardening already used in
   `set_updated_at` (ADR-0022).
4. **Grants for the auth admin role:** GoTrue inserts into `auth.users` as `supabase_auth_admin`,
   so the migration grants that role `USAGE` on schema `public` and `EXECUTE` on
   `handle_new_user()`, and revokes `EXECUTE` from `PUBLIC`. Without the schema/execute access the
   sign-up transaction would abort ("Database error saving new user") — the same GRANT-layer lesson
   as ADR-0023, applied pre-emptively so sign-up can't silently break on a hardened project.
5. **The app owns the editable fields, not the trigger:** the app updates `time_zone` once it can
   detect the user's zone, and reads the display name / avatar from the Google auth metadata
   (`user.user_metadata`) rather than duplicating them here. This keeps the trigger a pure
   existence-guarantee and avoids baking profile *content* into the database layer.

## Consequences
Every account has exactly one `profiles` row from the moment it's created, enforced at the database
where it can't be bypassed — so feature code can assume the profile exists and never has to
defensively create it. Account deletion still cascades (`profiles.id → auth.users on delete cascade`,
ADR-0022), so deleting the auth user removes the profile too; the invariant holds on the way out as
well as in. The cost is that this invariant now lives in SQL (a migration + an ADR) rather than app
code, so a developer must read the migration to see it — accepted, because robustness of the
invariant matters more here than keeping it visible in TypeScript. If richer onboarding ever needs
to run at sign-up, it's added to `handle_new_user()` (kept minimal and non-blocking) or handled by
the app after first load. This is additive to ADR-0022 (schema) and ADR-0008 (Google sign-in);
neither is changed.
