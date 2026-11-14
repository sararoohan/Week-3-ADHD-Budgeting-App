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

### Examples for this project
- **ADR-worthy:** Next.js + Material UI, Vercel, Supabase, TypeScript, Google sign-in,
  storing money as whole cents, calculating (not storing) safe-to-spend, the three-layer
  structure, Row Level Security, secrets in environment variables, disabling Next.js 16's
  `cacheComponents` default.
- **Not ADRs** (→ design guidelines / theme): the Inter font, the palette colors, spacing,
  copy wording.

## Pending ADRs (write these as we build the related part)

These decisions are already made (in the Week 2 specs), but their ADRs get written
when the feature is actually built, so the record matches the code. Number them
sequentially from the next free number (0015 onward) as you add them.

- **Reminders feature** → send reminders from a dedicated Gmail account; run reminders
  on Supabase Cron every 5 minutes; retry a failed send on the next two runs, then mark it failed.
- **CI / DevOps** → GitHub Actions checks on every pull request + protected main + Dependabot;
  no keep-alive job (watch the Supabase pause-warning email and restore if paused).
- **Testing** → Vitest + Playwright (with axe) + Lighthouse CI.
- **Monitoring** → own error table (30-day retention) + Vercel Speed Insights + KPIs from own data.
- **Content** → app wording and legal text kept in the repo.
- **Made-up test data** → short ADR, or keep as a CLAUDE.md rule.

## Conventions
- **Filename:** `NNNN-short-title.md` (e.g. `0001-record-decisions-as-adrs.md`).
- **Number sequentially**; never reuse a number.
- **Status:** Proposed → Accepted → (if it later changes) Superseded.
- **Never erase or rewrite a past decision.** If reality changes it, write a **new** ADR and
  mark the old one **"Superseded by ADR-00NN."** The goal is an honest decision trail.
- Commit each ADR alongside the code it affects.

## Template — copy this for each new ADR
```
# ADR-0000: [The decision, in a few words]

## Date and status
[Date]. [Proposed, Accepted, or Replaced by ADR-0000]

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
