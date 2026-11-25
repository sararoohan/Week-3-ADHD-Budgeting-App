# Architecture Decision Records (ADRs)

This folder holds our ADRs — one file per significant decision about how the app is built,
and why.

## What's in this folder
- **Numbered decision files:** `0001-*.md`, `0002-*.md`, … one decision each.
- **This README:** what an ADR is, when to write one, the conventions, and the template.

## What an ADR is
A short document that records **one** important choice about how the app is built, and the
reasoning behind it. "Important" means **hard to change later** — things like the database,
the framework, where it's hosted, the auth approach, or the data model.

## When is a decision ADR-worthy?
> **Note:** the rubric below is Claude's framing to help *you* decide — a guide, not
> definitive rules. Use your own judgment; when in doubt, writing one costs little.

Write an ADR when the decision is:
- **Hard or costly to reverse** later (you'd have to rip out code to change it).
- **Structural or cross-cutting** — it shapes the whole app, its data, or its security.
- **A real fork with trade-offs** — you chose among genuine alternatives.
- **Something a future developer (or Claude Code) needs the _why_ for.**

**Skip the ADR** when the choice is cheap to change and local to one spot — fonts, exact
colors, spacing, button wording, which component to use. Those are design/style and live in
`docs/design-guidelines.md` or the theme, not here.

## When to write an ADR (timing & status)
Write the ADR **when the decision is made**, as **Accepted** — don't defer it to build time. The
reasoning is freshest at the moment of the decision, and an undocumented decision is the easiest
one to forget or quietly contradict later.

- **Accepted** — a decision that's been made. The normal state; nearly every ADR here is Accepted.
- **Proposed** — a decision that's been *surfaced but not yet made* (for example, a question raised
  mid-build that needs deliberation). Record it as a Proposed ADR so it's visible, then move it to
  **Accepted** once decided, or **Rejected** if declined.
- **Superseded** — a decision later *reversed or materially changed*: write a **new** ADR that
  supersedes the old one and mark the old one **"Superseded by ADR-00NN."** Supersede only for real
  reversals — a typo or a clarification that doesn't change the decision is just an edit in place,
  so the trail doesn't fill with noise.

There is no "decided-but-unwritten" backlog: a made decision gets its ADR now. A genuinely build-time
decision (one that can't be made until the code exists, like ADR-0005) is written the moment it's
made during the build — that is still "at the time of decision," not deferral.

## Conventions
- **Filename:** `NNNN-short-title.md` (e.g. `0001-record-decisions-as-adrs.md`).
- **Number sequentially**; never reuse a number.
- **Status:** one of Proposed, Accepted, Superseded, or Rejected (see *When to write an ADR* above for when each applies).
- **Never erase or rewrite a past decision.** If reality changes it, write a **new** ADR and
  mark the old one **"Superseded by ADR-00NN."** The goal is an honest decision trail.
- Commit each ADR alongside the code it affects.
- **The repo is the source of truth for ADRs and their numbers.** The Notion "System
  Architecture Decisions (ADRs)" page mirrors the repo — same numbers, titles, and order — and is
  kept in sync whenever the repo changes. Where the two ever disagree, the repo wins. Cite ADRs by
  their repo number (e.g. ADR-0009).

## Template — copy this for each new ADR
```
# ADR-0000: [The decision, in a few words]

## Date and status
[Date]. [Accepted — or Proposed if the decision is still open; Superseded by ADR-00NN if later reversed]

## Context
What is happening? What problem pushed you to make a choice?

## Options
What choices did you look at? The good and bad of each.

- Option 1:
  - Good:
  - Bad:
- Option 2:
  - Good:
  - Bad:

## Decision
What did you choose, and why?

## Consequences
What happens because of this choice? What gets easier? What gets harder? What's next?
```

## See also
The operational rule for the developer agent lives in the repo's `CLAUDE.md`
("read every ADR before changing code; write a new ADR for big choices"). This README
explains the practice; `CLAUDE.md` is what makes Claude Code act on it.

## Historical numbering crosswalk (old ADR numbers → repo numbers)
Before the specs were synced to this repo (Nov 2026), the ADRs used a **different
numbering**. Some older documents may still cite those old numbers.

> **Resolve every ADR citation by its subject, not its number.** Read what decision the
> surrounding text is about and match it to the repo ADR below — an old number rarely
> lines up with the repo one, so trusting the printed number is how stale citations
> spread. This crosswalk is the shortcut; the repo ADR files are the source of truth.

| Old # | Old decision | Repo # |
|-------|--------------|--------|
| 0001 | Record ADRs in docs/adr | 0001 |
| 0002 | Three tiers: Next.js + MUI on Vercel, Supabase | 0002 + 0003 + 0004 *(split into three)* |
| 0003 | TypeScript for all code | 0007 |
| 0004 | Sign-in by email link/code *(superseded)* | 0008 *(auth lineage)* |
| 0005 | Google sign-in, optional passkey | 0008 |
| 0006 | Reminders by email + app, Resend *(superseded)* | 0015 *(reminder lineage)* |
| 0007 | Reminder emails from a dedicated Gmail account, port 465 | 0015 |
| 0008 | Supabase Cron every 5 minutes runs the reminder job | 0015 |
| 0009 | GitHub keep-alive job *(superseded)* | — *(no repo ADR; folded into 0004 Use Supabase)* |
| 0010 | No keep-alive; watch the pause-warning email | — *(no repo ADR; folded into 0004 Use Supabase)* |
| 0011 | GitHub Actions checks, protected main, Dependabot | 0016 |
| 0012 | Vitest, Playwright + axe, Lighthouse CI | 0017 |
| 0013 | Own error table, Speed Insights, KPIs | 0018 |
| 0014 | Wording and legal text kept in the repo | **0021** *(recorded as an ADR 2026-11-17)* |
| 0015 | Testers use made-up numbers | — *(a CLAUDE.md guardrail, not an ADR)* |
| 0016 | Row Level Security on every table + on-delete-cascade | 0012 *(cascade now lives in 0019)* |
| 0017 | Amounts stored as whole cents | 0009 |
| 0018 | Safe-to-spend calculated, never stored | 0010 |
| 0019 | Money rules in one pure module; three layers | 0011 |
| 0020 | Reminder retries (twice, then recorded as failed) | 0015 |

Repo ADRs **added or refined after the sync** have no old-numbering source, so don't
expect a reverse match: 0005 (disable Next.js cache components), 0006 (secrets in env
vars), 0013 (safe-to-spend formula), 0014 (record refunds as money-back), 0019 (edit /
delete / undo), 0020 (money in), 0022 (database schema & migrations), 0023 (grant table
privileges to app roles), 0024 (phased quality gates), 0025 (create profile on sign-up), 0026 (default branch → staging
for Dependabot).
