# Project: ADHD Budgeting App (Tech Fleet)

Project-specific instructions. These add to the global `~/.claude/CLAUDE.md`.

## Context

- Tech Fleet class project. Sara is the architect; Claude is the developer.
- Sara is still learning — explain what you're about to do and why before big actions.

## Conventions & guardrails (follow on all work)

**Scope**
- Build MVP #1 only — nothing from the MMP or "later" lists (no bank links, debt/credit
  tools, etc.). If a request looks out of MVP #1 scope, flag it before building.

**Stack & structure**
- Next.js (App Router) + TypeScript + Material UI. No Tailwind.
- Three layers: presentation / domain (a pure money module) / data access. Money rules go in
  the domain module only — no screen or DB code there, so they stay unit-testable.
- Server actions validate all input on the server. Never trust a user_id sent from the browser.

**Security & data**
- Row Level Security on every table; each user reaches only their own rows.
- Secrets only in env vars (.env.local locally, Vercel settings in production); the Supabase
  service-role key is server-only, never in the browser.
- Use made-up / fake data only — never real bank, card, or account numbers. This is a class
  project on free tiers with no backups.

**Quality**
- Meet WCAG 2.2 AA; check accessibility on every screen (see docs/design-guidelines.md).
- Store money as whole integer cents; never store values the app can calculate (e.g.
  safe-to-spend).

**Docs to read**
- Read every ADR in docs/adr before changing code; write a new ADR for big choices (check
  docs/adr/README.md → Pending ADRs before building a new area).
- Read docs/design-guidelines.md before building or changing any screen.
- Read docs/architecture.md for the overall system plan (the *what* that gets built).

## ADR authoring (how to write them)

- Proactively flag big build-time decisions and offer to write the ADR — don't wait to be asked.
- Never erase or edit a past decision. If reality contradicts an earlier ADR, write a **new**
  ADR that supersedes it and mark the old one **"Superseded by ADR-00XX"** — a visible, honest
  decision trail, not just the final state.
- Number ADRs sequentially (ADR-0001, ADR-0002, …). Use the `engineering:architecture` skill
  to draft them.

## Repo docs come from the specs
- Files in docs/ are condensed versions of the canonical specs in the project's Notion/Claude
  Docs (the specs are the source of truth). docs/README.md holds the doc-to-spec mapping.
- When you add or change a docs/ file, add or update a one-line "Source:" at the top of that
  file, and update the docs/README.md table. Keep private/internal spec links out of this
  public repo.
