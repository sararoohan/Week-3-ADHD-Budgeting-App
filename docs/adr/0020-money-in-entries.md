# ADR-0020: Money-in entries — income and deposits as one typed entry

## Date and status
2026-11-17. Accepted

## Context
Until now the money model only let a user record **scheduled income/pay** (FR-4), an **opening balance** at setup (FR-37), and **money-back** on the spending side (a refund or return that offsets a purchase, ADR-0014). There was no way to record money that comes in but isn't scheduled pay — a gift, a sale, a reimbursement, a one-off transfer. That money then goes unrecorded (or gets mis-logged as a refund), so available-now understates what the user actually has and the home number is less trustworthy. We are in Phase 0 (the money module, schema and tests are not built yet), so this is the cheapest moment to get the money-in model right; changing it after the schema and money logic exist would be a migration.

## Options
- **One typed "money-in" entry covering income and deposits, with an optional schedule (chosen)**
  - Good: captures *all* incoming money, so available-now is accurate; income is just the special case (money-in marked as pay, optionally scheduled), so one model and one form cover both; small schema (one table with a `kind` and optional recurrence); reuses the FR-9 recurrence model.
  - Bad: slightly more than income-only; the rules for "is this pay / does it recur / does it drive payday" have to be stated clearly.
- **Keep income-only (status quo)**
  - Good: simplest.
  - Bad: no home for non-pay money in; users mis-log it as money-back (which ADR-0014 says is not income) or not at all; available-now is understated.
- **A separate `deposit` table, distinct from income**
  - Good: a clean split of the two.
  - Bad: two near-identical models for "money in" with duplicated logic; income is really just a scheduled, pay-flagged deposit — one model is simpler and truer.

## Decision
Model all incoming money as a single **money-in** entry: `amount` (whole cents, ADR-0009), a `date` (defaults to today, editable), and a `kind` — **income** or **deposit** — plus an **optional** schedule (one-time, weekly, every two weeks, twice a month, monthly; FR-4).
- **Income** is a money-in entry marked as pay. Only a *scheduled* income drives the next-payday window and the "Did your pay arrive?" confirmation (FR-7).
- **Deposit** is any other money in (a gift, a sale, a reimbursement). It raises available-now but does not drive payday logic and is usually one-time.
- The user is **nudged** to mark regular income as scheduled (fewer manual entries), never forced; an unscheduled income and a deposit both simply add to available-now.
- This generalizes the safe-to-spend formula (ADR-0013): its "arrived pay" term becomes **"arrived money-in"** (income + deposits that have arrived). Nothing else in the formula changes.
- **Money-back is unchanged and stays separate** — it is a spending-side offset (ADR-0014), not a money-in entry. A reimbursement that is genuinely new money in is a **deposit**, which refines ADR-0014's earlier mention of "reimbursements" under money-back (money-back is now refunds and returns that offset a purchase only).
- Owner-only via Row Level Security (ADR-0012); computed into safe-to-spend, never stored (ADR-0010, ADR-0013); recurring entries use the FR-9 "just this one, or all future?" model and are edited or deleted per ADR-0019.

## Consequences
The home number stays accurate when money arrives from non-pay sources, closing a real gap. The schema is one money-in table (`kind` plus optional recurrence, owner-only RLS) built in Phase 0, so adding deposits later is never a migration. The MVP ships both income and the deposit entry (both required). The safe-to-spend formula and the money test cases extend to money-in: a deposit raises available-now; an unscheduled income does not set a payday; a scheduled income still does. The UI is one "add money in" flow (income is the pay-flagged, schedulable case; deposit the quick one-off), and its exact wording is plain, non-bank language, with "deposit/withdrawal vs. money in/out" logged as an assumption to test with users. This decision **refines ADR-0013** (formula term) and **ADR-0014** (reimbursement wording); whether those older ADRs carry a "refined by ADR-0020" note is a trail-keeping choice to confirm. Money-back's placement and behavior are untouched.
