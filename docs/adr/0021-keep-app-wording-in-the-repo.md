# ADR-0021: Keep app wording and legal text in the repo

## Date and status
2026-11-17. Accepted. (Recorded now, after the Notion ADR set was reconciled to the repo.
This decision had been treated as an implicit convention rather than its own ADR; it is
cited across FR-1, FR-18, FR-31 and T-13, so it is written here as an ADR. Appending it does
not renumber any existing ADR.)

## Context
The app shows user-facing copy that carries legal and compliance weight: the sign-up notice
(FR-1), the "not financial advice" disclaimer, the privacy notice (FR-31), the terms, and the
blame-free wording rules (FR-18). This text needs a home, it changes occasionally, and several
features render it. Where it lives — and how it is allowed to change — is a cross-cutting
choice with real trade-offs, especially because incorrect or unreviewed legal/financial copy is
a compliance risk.

## Options
- **Text files in the repo, changed via pull request (chosen)**
  - Good: every change is version-controlled and PR-reviewed, which matters most for legal and
    "not financial advice" copy; no extra infrastructure; the copy ships and deploys with the
    code; changes are diffable and attributable.
  - Bad: changing copy needs a deploy; non-developers cannot edit it live.
- **Store the copy in the database, editable at runtime**
  - Good: edit without a deploy.
  - Bad: legally-significant text could change with no review and no version history; it becomes
    another table plus an admin UI to build and secure; a direct vector for unreviewed or
    incorrect legal claims.
- **Use a CMS / headless CMS**
  - Good: friendly non-developer editing.
  - Bad: overkill for an MVP — an extra service, cost and integration — with the same
    review-gap risk as the database option.

## Decision
Keep all user-facing wording and legal text — the sign-up notice, the "not financial advice"
disclaimer, the privacy notice, the terms, and the blame-free copy — as text files in the repo,
changed only through pull requests. Screens read the text from these files. There is no runtime
editing of legally-significant copy.

## Consequences
Every change to legal or financial copy is reviewed and versioned like code, which fits a class
project run by one developer plus an AI agent and keeps an honest history of what the app
claimed and when. Copy changes require a deploy, which is acceptable at MVP scale. FR-1, FR-18,
FR-31 and T-13 cite this ADR for where their text lives. "Testers use made-up numbers" is a
separate project guardrail (CLAUDE.md), not part of this decision. If live, non-developer
editing of copy is ever needed, a future ADR can supersede this one.
