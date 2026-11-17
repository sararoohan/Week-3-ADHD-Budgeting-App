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
