# Project: ADHD Budgeting App (Tech Fleet)

Project-specific instructions. These add to the global `~/.claude/CLAUDE.md`.

## Context

- Tech Fleet class project. Sara is the architect; Claude is the developer.
- Sara is still learning — explain what you're about to do and why before big actions.
- This project's CLAUDE.md IS committed to the repo — a deliberate exception to the global
  "never commit CLAUDE.md" rule — because the instructor reviews it as part of the graded
  homework. Keep it tracked and up to date; never put secrets or private spec links in it.

## Who writes to this repo (one-writer rule)
- Claude Code is the ONLY agent that writes to this repo.
- Cowork (Claude on the specs/Notion side) never edits repo files directly.
  It drafts content in chat or Notion; Sara applies changes via Claude Code.
- One writer touches the repo at a time, so two agents never edit the same
  files at once — this avoids clobbered edits, merge conflicts, and unclear
  provenance.
- This applies to multiple Claude Code sessions too: only one active Code
  session edits the repo at a time. Before editing, check for other live
  sessions (ListAgents) and run `git status`; if another session is mid-work,
  wait. Commit to a short-lived session branch often and keep diffs small so a
  collision costs little. (Git worktrees can enforce this structurally if it
  becomes a recurring problem.)
- Spec provenance: each docs/ file's "Source:" line and the docs/README.md
  map trace every repo doc to its source spec. When the Notion connector is
  attached (Sara supplies the spec links), Claude Code reads the Notion/Claude
  specs and maintains these itself; update them whenever a docs/ file changes.
- Notion is read-only by default for Claude Code: read the specs freely, but
  never create, edit, move, or delete anything in Notion (specs or otherwise)
  without Sara's explicit instruction for that specific change.

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

**Testing**
- Test tools: Vitest (unit tests of the money/domain module), Playwright + axe (end-to-end and
  accessibility), Lighthouse CI (speed). These self-document through their config and CI; this is
  only the pointer.
- Money logic is authored test-first in Phase 0: the money test cases (specified in the Quality
  Engineering Architecture spec) become the Vitest suite (T-8), which is the source of truth for
  those cases — not a repo markdown doc.
- Every pull request runs the automated checks; new or changed money rules need passing unit
  tests (see docs/definition-of-done.md).

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
