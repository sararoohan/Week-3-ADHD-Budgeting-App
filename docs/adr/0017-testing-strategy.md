# ADR-0017: Testing — the test pyramid with Vitest, Playwright + axe, and Lighthouse CI

## Date and status
2026-11-17. Accepted

## Context
The money logic is the heart of the app and must be provably correct (NFR-3), the main flows must work in a real browser, every screen must meet WCAG 2.2 AA (NFR-7), and speed targets must hold (NFR-5). The app is built by one person with an AI coding agent, so the checks have to be automated and run on every change, with a few manual checks reserved for what automation can't see.

## Options
- **A test pyramid: Vitest (unit) + Playwright with axe (end-to-end and accessibility) + Lighthouse CI (speed) (chosen)**
  - Good: many fast unit tests on the pure money module (ADR-0011) catch money bugs early; fewer, slower Playwright tests prove whole flows in a real browser; axe inside Playwright checks WCAG on each screen; Lighthouse CI checks the speed targets on phone settings; all run free on GitHub Actions (ADR-0016). Matches the test-pyramid principle — the higher the level, the fewer tests.
  - Bad: three tools to wire up; end-to-end and Lighthouse runs are slower than unit tests.
- **Mostly end-to-end tests**
  - Good: exercises the real app.
  - Bad: slow and brittle; a poor fit for exhaustively checking money edge cases; slow feedback for a solo builder.
- **Manual testing only**
  - Good: nothing to set up.
  - Bad: money bugs and accessibility regressions slip through; nothing is enforced on every change.

## Decision
Test on a pyramid, run by GitHub Actions on every pull request (ADR-0016): **Vitest** for the money logic module (safe-to-spend, bills before payday, repeating dates, which reminders are due, the one next step) and for the Row Level Security rules checked against a preview project; **Playwright** for the main flows (sign-up, first budget, add a purchase, bill reminder, close account), with **axe** checking WCAG on every main screen; **Lighthouse CI** for the speed targets (2.5 s load, 0.2 s response, 0.1 layout shift). Reserve a few manual checks — a cross-browser pass and Sara's accessibility review — for before release. The money test cases are written **before** the money logic (Phase 0), and all must pass for the Phase 1 gate.

## Consequences
Every pull request gets a fast, automated safety net for money, accessibility and speed, which the Definition of Done depends on. Writing money tests first makes the money module's behavior the thing the code is built to satisfy, and those cases — not any prose doc — are the source of truth for the rules. Playwright and Lighthouse add a little time per pull request. Manual accessibility and cross-browser checks still happen before release, because some issues only surface to a human in a real browser.
