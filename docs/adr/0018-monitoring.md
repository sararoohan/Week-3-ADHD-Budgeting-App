# ADR-0018: Monitoring — our own error table, Vercel Speed Insights, and KPIs from our own data

## Date and status
2026-11-17. Accepted

## Context
The app needs to know when things break — a reminder that failed to send, a save that failed, a screen that crashed in the user's browser, a problem a user reports — and to measure a few outcomes and trust KPIs over time. It runs on free tiers: Vercel's free plan keeps only about 1 hour of runtime logs, but reminders run around the clock and the trust KPIs count user reports over weeks. It also holds sensitive financial data in a public-repo project, so monitoring must store nothing private (NFR-11).

## Options
- **Our own error table in Supabase + Vercel Speed Insights + KPIs from our own data (chosen)**
  - Good: lasting records (Vercel's 1-hour logs are too short) for the four things that matter — failed reminder sends, failed saves, user-reported problems, and browser crashes; stores only time, type and screen — no secrets, personal data or amounts; records auto-delete after 30 days; Speed Insights (free) gives anonymous real-user speed; KPIs come from our own Supabase data with no third-party analytics; all free.
  - Bad: we build and maintain the error table and the KPI queries ourselves.
- **A third-party monitoring/analytics service (Sentry, Google Analytics, etc.)**
  - Good: rich dashboards out of the box.
  - Bad: sends data to a third party (a privacy cost for a money app), another account and often a paid tier; more than MVP #1 needs.
- **Rely on Vercel's built-in logs only**
  - Good: nothing to build.
  - Bad: only ~1 hour of retention — too short for around-the-clock reminders, retries, user reports and multi-week KPIs; misses browser crashes, which happen on the user's device, not on Vercel.

## Decision
Keep our own error table in Supabase holding four record types — failed reminder sends, failed saves, user-reported problems, and screens that crashed in the user's browser — storing only time, type and screen, and deleting each record automatically after 30 days. Use Vercel's live logs for the immediate picture and **Vercel Speed Insights** (free tier) for anonymous real-user speed. Count KPIs from our own Supabase data, with no third-party analytics. Browser crashes are included because nothing else catches them — they happen on the user's device, not on Vercel's servers.

## Consequences
We have a durable, privacy-safe record of what breaks, without sending anything to a third party. The error table's "time, type and screen only — no secrets, personal data or amounts" rule is enforced in the Definition of Done and backs NFR-11; 30-day auto-deletion is a Phase 0 gate. Reminder-send failures recorded here are the same failures the retry policy gives up on (ADR-0015). We own the KPI queries. If monitoring needs ever outgrow this (e.g., real-time alerting), that is a new ADR that supersedes this one.
