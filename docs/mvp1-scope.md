# MVP #1 Scope — ADHD Budgeting App

Source: Release Vision and Scope + Epics, Features and Tasks (the specs are the source of
truth). This is the condensed build reference. Build MVP #1 only.

## Who it's for
Adults with ADHD (primary 25–49). See docs/design-guidelines.md.

## Vision
Budgeting that does the remembering for you, so adults with ADHD can face their money
without shame.

## In scope — the 8 epics (what users can do)
1. Get started quickly and securely — account + Google sign-in (ADR-0008); one short first
   session: enter current money on hand (opening balance), add income & bills; no required bank
   link.
2. Know what's safe to spend before next payday — the safe-to-spend number; bills due before
   payday already accounted for; plan from money that has actually arrived.
3. Keep spending current with little effort — add a purchase in seconds; edit or delete a
   purchase (with Undo); record money that comes back (refund/return) with a simple "money back"
   entry, no editing the original; no re-entry of recurring items; reliable even when data is
   incomplete.
4. Stay ahead of every bill — see every bill & due date; reminders on a schedule you choose
   (email + in-app); money set aside; early warning when a bill can't be covered.
5. Think twice before an impulse buy — see how a purchase affects the plan before buying;
   "decide later"; room for some unplanned spending; an optional flexible-spending buffer (a
   cushion kept out of safe-to-spend) — Should.
6. Check in calmly, one step at a time — the single next step; check in under 2 min; plain
   language; shame-free; progress & small wins.
7. Come back after time away — restart from today, no catching up; most urgent thing first.
8. Trust the product — know the cost & leave easily; privacy notice; close account + delete
   all data (with download first); never offered cash advances or buy-now-pay-later.

## Explicitly OUT of MVP #1 (later / MMP)
- Linking a bank account / automatic transaction import (manual entry only in MVP #1).
- Multiple recurring income schedules (MVP #1 = one recurring schedule + unlimited ad-hoc income entries).
- Debt payoff and credit tools; overdraft handling.
- Impulse help at the moment of checkout / on credit (MVP #1's pause lives inside the app only).
- Saving / savings goals (moved to MMP).
- A paid tier (MVP #1 is free).
- Web push and SMS reminders (MVP #1 is email + in-app). Add-to-calendar is a *Could* (4.1.5).
- A passkey is optional, built last, dropped if time runs short (ADR-0008).
- Usability testing with adults with ADHD during the class (assumptions to test after launch).

## Key MVP #1 decisions
- Secure accounts via Google sign-in, no passwords (ADR-0008).
- No bank link; free for now.
- Money stored as whole cents (ADR-0009); safe-to-spend calculated, never stored (ADR-0010).
- Row Level Security so each user sees only their own data (ADR-0012).
- Reminders by email + in-app; the sending infrastructure is a Pending ADR (built with T-5;
  see docs/adr/README.md).
- Testers use made-up data only (see CLAUDE.md guardrails).

## How to build against this
Core first: Epics 1–4, then 5–8. Each feature's detailed acceptance criteria and BDD
scenarios live on the Notion Kanban cards and are fed per feature. If something looks like an
"out of scope" item above, flag it before building.