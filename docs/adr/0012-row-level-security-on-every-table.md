# ADR-0012: Row Level Security on every table

## Date and status
2026-11-13. Accepted

## Context
The homework requires that each person sees only their own information, and the app holds sensitive financial data in a public-repo project. Isolation must be enforced where it can't be bypassed.

## Options
- **Row Level Security (RLS) on every table (chosen)**
  - Good: the database itself enforces owner-only access, even if app code has a bug; Supabase's own recommendation.
  - Bad: every table needs a policy and testing.
- **Checks only in app code**
  - Good: simpler at first.
  - Bad: one missed check leaks another user's data; nothing enforces it at the database.

## Decision
Enable RLS on every table, each with an owner-only policy (the row's `user_id` must equal the signed-in user, via Supabase's `auth.uid()`) for read, insert, update, and delete. Index `user_id`. Verify with two test accounts that one sees none of the other's rows.

## Consequences
Per-user isolation is enforced at the database. A test fails if any table lacks RLS. The service-role key (which bypasses RLS) is used only in server code (ADR-0006) — and because it bypasses RLS, server code using it must still filter every query by the signed-in user's `user_id`; RLS does not protect those queries.
