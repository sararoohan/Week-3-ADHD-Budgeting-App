# ADR-0023: Grant table privileges to app roles explicitly (the GRANT layer beneath RLS)

## Date and status
2026-11-19. Accepted

## Context
Postgres authorizes table access in **two layers**: (1) **table-level `GRANT`s** decide whether a
database *role* may touch a table at all, and (2) **Row Level Security (RLS) policies** decide *which
rows* it then sees. Layer 1 is checked first; if a role has no grant, the request is denied with
`permission denied for table` (SQLSTATE `42501`) before any RLS policy runs.

The initial schema (ADR-0022) enables RLS and writes correct owner-only policies on all 10 tables
(ADR-0012), but includes **no `GRANT` statements** — it relied on Supabase's default privileges to
grant table access to the app roles (`anon`, `authenticated`, `service_role`). When the schema was
applied to the live Supabase project in step 8, those defaults did **not** land the DML privileges:
every role had only `REFERENCES` / `TRIGGER` / `TRUNCATE` on the tables — **not** `SELECT` / `INSERT`
/ `UPDATE` / `DELETE`. This was verified empirically: a read of `profiles` with the **service-role
key** (which bypasses RLS entirely) still returned `42501`, proving the block was at the GRANT layer,
not RLS. As it stood, no app role could read or write any table, so the application could not
function — a signed-in user's first query would fail.

The fix (granting the missing privileges) is hard to get wrong but easy to get *subtly* wrong — most
importantly, **to which roles** — so the decision is recorded here. It complements, and does not
reverse, ADR-0012 or ADR-0022.

## Options

**Where the grants come from**
- **Explicit `GRANT` statements in a migration (chosen)**
  - Good: self-documenting and reproducible — the repo is the only backup on the free plan
    (ADR-0022), so access must rebuild from SQL, not from a provisioning default that already proved
    unreliable here; visible in code review; portable across projects.
  - Bad: one more migration to apply.
- **Rely on Supabase's default privileges (status quo)**
  - Good: no SQL to write.
  - Bad: it already failed — the defaults granted only a partial, non-DML set; invisible and
    unverifiable from the repo; a future table could silently ship without access.

**Which roles get DML grants**
- **`authenticated` + `service_role`, not `anon` (chosen)**
  - Good: signed-in users can reach their tables (RLS still restricts them to their own rows);
    server / Edge code (reminder job, account deletion, error writes — ADR-0018) works; anonymous
    requests stay blocked at the GRANT layer, a clean defence-in-depth match to an app with **no**
    anonymous data access.
  - Bad: none for MVP #1 (no feature needs anonymous reads).
- **Also grant `anon`**
  - Good: mirrors Supabase's out-of-the-box default.
  - Bad: grants access the app never uses; weakens the "nothing is reachable without signing in"
    property; RLS would still block rows, but there is no reason to open layer 1 for `anon`.

## Decision
1. Add a migration (`<timestamp>_grant_table_privileges.sql`) that grants `SELECT, INSERT, UPDATE,
   DELETE on all tables in schema public` to **`authenticated`** and **`service_role`**.
2. Do **not** grant any DML to **`anon`** — the app has no anonymous data access, so unauthenticated
   requests stay denied at the GRANT layer.
3. Add `ALTER DEFAULT PRIVILEGES in schema public` for the same two roles, so tables created by later
   migrations inherit these grants automatically and can't silently ship without app-role access.
4. RLS is unchanged: it remains the row-level gate on every table (ADR-0012). These grants only open
   layer 1; owner-only policies still decide which rows each user sees.

## Consequences
The app works: a signed-in user can read and write their own rows, and server-side code using the
service-role key can do its job (both previously failed with `42501`). Access is now explicit in the
repo, so it rebuilds from SQL like the rest of the schema and is visible in review, rather than
depending on a Supabase default that already proved incomplete. New tables inherit grants through the
default-privileges rule, so the two-layer model stays intact as the schema grows. `anon` remains
without DML, keeping unauthenticated access blocked at the GRANT layer in addition to RLS.

This is additive: ADR-0012 (RLS everywhere) and ADR-0022 (schema & migrations) stand unchanged — this
ADR records the GRANT layer those two implicitly assumed. The two-account isolation test (NFR-1,
verified at step 8) still exercises RLS; it now runs against tables the roles can actually reach. If a
future need arises to open specific tables to `anon` (none is foreseen in MVP #1), that is a new,
narrower grant recorded in its own migration.
