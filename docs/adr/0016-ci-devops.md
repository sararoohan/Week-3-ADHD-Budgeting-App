# ADR-0016: CI and DevOps — GitHub Actions on every pull request, protected main, Dependabot, no keep-alive job

## Date and status
2026-11-17. Accepted

## Context
The app is built by one person directing an AI coding agent, on free tiers, deploying to Vercel (ADR-0003) from a GitHub repo. Mistakes must be caught before they reach the live app, `main` must stay releasable, dependencies must stay patched, and the free Supabase project (ADR-0004) pauses after about 7 days of inactivity with no automatic backups. We need a repeatable path from pull request to preview to production, and a plan for the pause problem.

## Options
**Checks and branch safety**
- **GitHub Actions on every pull request + protected main + Dependabot (chosen)**
  - Good: every change runs the automated checks (Vitest, Playwright + axe, Lighthouse CI — ADR-0017) before merge; a protected `main` branch can't be pushed to directly, so nothing ships unreviewed; Dependabot keeps dependencies patched; Vercel builds a preview per pull request for a real-environment check; all free.
  - Bad: a little CI setup; checks add a minute or two per pull request.
- **Push straight to `main` / no CI**
  - Good: nothing to set up.
  - Bad: broken or unreviewed code reaches production; no automated safety net — unacceptable for an app handling money.

**Keeping the free Supabase project awake**
- **No keep-alive job; watch the pause-warning email and restore (chosen)** — *replaces the earlier "scheduled GitHub job" idea*
  - Good: nothing extra to run or maintain; Supabase sends a pause-warning email, and a paused project restores from the dashboard with data intact.
  - Bad: a restore is manual; the project can briefly pause if the warning is missed (acceptable for a class project on free tiers).
- **A scheduled GitHub job that pings the database to keep it active**
  - Good: avoids pauses automatically.
  - Bad: a job to maintain, of uncertain reliability; Supabase doesn't promise external pings count as activity. (Was an earlier choice; dropped.)
- **Supabase paid plan (never pauses)**
  - Good: no pausing at all.
  - Bad: costs money; out of scope for a free class project.

## Decision
Run the automated checks through GitHub Actions on every pull request. Protect the `main` branch so changes land only by reviewed pull request, each getting a Vercel preview deployment; keep separate preview and production environments with rollback. Enable Dependabot. Do **not** run a keep-alive job for the free Supabase project: watch its pause-warning email and restore a paused project from the dashboard. (If Supabase later documents that its own jobs count as activity, revisit with a new ADR.)

## Consequences
No change reaches production without passing checks and review, which backs the Definition of Done ("Sara has read the pull request"). The pipeline is repeatable and free. The team accepts a small, manual pause-recovery step instead of an always-on job; because the free tier also takes no automatic backups, the user's CSV export remains their only copy (ADR-0004). Reviving a reversed choice here (e.g., adopting a keep-alive job or a paid plan) is a new ADR that supersedes this one.
