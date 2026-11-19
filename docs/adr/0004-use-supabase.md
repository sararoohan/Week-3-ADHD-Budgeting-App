# ADR-0004: Use Supabase for the database, auth, and scheduled jobs

## Date and status
2026-11-13. Accepted

## Context
The app stores each user's financial data and must keep it private to that user. It also needs sign-in and a way to send bill reminders on a schedule. The budget is free. The course sets Supabase as the data tier.

## Options
- **Supabase — Postgres + Auth + Row Level Security + Cron/Edge Functions (chosen)**
  - Good: managed Postgres (a relational database fits structured budgeting data); built-in authentication including Google sign-in; Row Level Security enforces "each person sees only their own data" at the database itself, not only in app code; scheduled jobs and functions for reminders; SQL migrations; a free tier.
  - Bad: the free tier pauses a project after about 7 days of inactivity and takes no automatic backups; the service-role key must be kept server-side only.
- **Firebase (Firestore)**
  - Good: generous free tier, built-in auth.
  - Bad: a document database is a weaker fit for relational budgeting data and for exact money queries; a different security model.
- **Managed Postgres (Neon / PlanetScale) + a separate auth service**
  - Good: strong databases.
  - Bad: auth, per-user isolation, and scheduling would each be assembled separately — more to build and secure.

## Decision
Use Supabase: Postgres for the data, Supabase Auth for Google sign-in, Row Level Security on every table so each person reaches only their own rows, and Supabase Cron + Edge Functions for scheduled bill reminders. Define the schema and policies as SQL migration files in the repo. This is also a course requirement.

## Consequences
Row Level Security must be enabled and tested on every table (a second test account must see none of the first account's data). The service-role key is used only in server code, never the browser. The free tier's inactivity pause is mitigated by watching the pause-warning email and restoring the project; the lack of automatic backups is why the user's CSV export is their only copy (see the database and security decisions).
