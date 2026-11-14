# Architecture Plan — ADHD Budgeting App (MVP #1)

Source: our Technical Architecture spec — System Architecture Decisions & Database Architecture tabs.

A three-tier web app. The *why* behind each big choice lives in docs/adr; this is the plan
of *what* gets built. Read alongside docs/design-guidelines.md.

## The three tiers
1. Presentation (browser) — Next.js App Router screens built with Material UI, themed once
   in src/theme.ts.
2. Application / server (Vercel) — Next.js server code: checks each request against the
   signed-in user, runs the money logic, reads/writes the database, handles account close.
3. Data (Supabase) — Postgres with Row Level Security; Supabase Auth (Google sign-in);
   Supabase Cron + Edge Functions for reminders.

## Code layers (inside the app)
- Presentation: screens/components (MUI) and wording. No money rules.
- Domain: one pure TypeScript money module — safe-to-spend, bills due before payday,
  recurring dates, which reminders are due, the single next step. No screen or DB code,
  so every rule is unit-testable with made-up numbers.
- Data access: Supabase queries, one module per table group. The only place that talks to
  the database; never trusts a user_id sent from the browser.
- Dependencies point inward: presentation → domain → data.

## Screens (MVP #1 — indicative, grounded in the epics/features; final screen design is decided at build)
- Home / dashboard (the hub): the one key "safe to spend" number (Epic 2), the single next
  step to take (6.1.1), the most urgent thing first when you return (7.2.1), and progress /
  small wins (6.3.1).
- Get started: Google sign-in (1.1.1); a short first-run setup — add income (including when
  it arrives, 1.2.2) and bills — with no required bank link (1.1.2).
- Safe to spend: the "safe to spend before payday" view, with bills due before payday already
  accounted for (2.1); a "did your pay arrive?" payday confirmation (2.1.3); a quick "will this
  purchase fit?" check (2.2.1).
- Keep current: add a spending entry in seconds (3.1.2); manage recurring income and bills with
  no re-entry (3.1.1); see where money went (3.2.2); the budget stays reliable when some
  spending is missing (3.2.1).
- Bills: see every bill and due date in one place (4.1.1); add/edit a bill and choose its
  reminder schedule (4.1.3); see all reminders in one place in the app (4.1.4); mark a bill
  paid; find out early when a bill can't be covered (4.2.2). (Could: add a due date to your own
  calendar, 4.1.5.)
- Impulse buys: a "how will this affect my plan?" pause before buying (5.1.1 — the same check as
  Safe to spend); a "decide later" list (5.1.2).
- Check in calmly: a short, shame-free check-in in under two minutes (6.2.1), in plain language
  (6.2.5), showing where you stand without facing everything at once (6.2.2).
- Come back: gentle re-entry after time away — restart from today, not where you left off (7.1.2).
- Trust: what the app costs and how to leave easily (8.1.1); a privacy notice on how your money
  and ADHD-related data is used (8.1.3); close your account with all data deleted, with
  "download my data first" (8.1.4).

Note: reminders themselves (email + in-app) are sent by a background job (Supabase Cron + the
app's Gmail account), not a screen — the Bills "all reminders in one place" view is the in-app side.

## How a request flows
1. User taps Save → the browser sends the entry to the Next.js server code over HTTPS with
   the sign-in session.
2. The server validates the input and saves it to Postgres as that user (Row Level Security
   limits it to their own rows).
3. The money module recalculates safe-to-spend from the stored data; the server returns it
   (target: under 1 second).
4. On any failure: a plain, blame-free message with a next step, and the entry stays on
   screen so nothing is lost.

## Outside services
Google (sign-in; email + name only), the app's Gmail account (sends reminder emails),
Vercel Speed Insights (anonymous speed data).