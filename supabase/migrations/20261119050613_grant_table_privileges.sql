-- Migration: grant_table_privileges
-- ADHD Budgeting App (MVP #1) — grant table DML privileges to the app roles.
-- Decision: docs/adr/0023-grant-table-privileges-to-app-roles.md
--
-- Why this exists
-- ---------------
-- The initial schema (20261118083848_initial_schema.sql) enables RLS and defines
-- owner-only policies on all 10 tables, but includes NO table-level GRANTs — it
-- relied on Supabase's default privileges to grant table access to the app roles.
-- Those defaults did not apply the DML privileges: on the live project, anon,
-- authenticated, AND service_role each had only REFERENCES/TRIGGER/TRUNCATE on
-- the tables, not SELECT/INSERT/UPDATE/DELETE. Verified empirically — even the
-- service-role key (which bypasses RLS) got "permission denied for table" (SQLSTATE
-- 42501), proving the block is at the GRANT layer, before RLS is ever evaluated.
--
-- Postgres checks permission in two layers: (1) table-level GRANTs decide whether a
-- ROLE may touch a table at all; (2) RLS policies then decide WHICH ROWS. Layer 1
-- must pass before layer 2 runs. Without these grants, no app role can read or write
-- any table, so the application cannot function.
--
-- This migration is additive and corrective; it does not change any decision in
-- ADR-0012 (RLS on every table) or ADR-0022 (schema & migrations). RLS remains the
-- row-level gate; these grants simply open layer 1 for the two roles that need it.

-- Roles that need table access (Supabase built-in roles):
--   * authenticated — signed-in users; RLS then restricts them to their own rows.
--   * service_role  — server / Edge code (reminder job, account deletion, error
--                     writes); bypasses RLS but still needs the GRANT (ADR-0018).
-- anon is deliberately NOT granted: the app has no anonymous data access. Leaving
-- anon without DML keeps unauthenticated requests blocked at the GRANT layer.

grant select, insert, update, delete
  on all tables in schema public
  to authenticated, service_role;

-- Future tables added by later migrations inherit the same grants automatically,
-- so a new table can never silently ship without app-role access. Applies to tables
-- created by the role that runs the migrations (the same role that created the
-- initial schema), matching how this project applies migrations (ADR-0022).
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;
