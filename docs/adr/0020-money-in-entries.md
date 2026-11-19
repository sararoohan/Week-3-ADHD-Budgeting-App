# ADR-0020: Money in — one entry, optionally scheduled

## Date and status
2026-11-17. Accepted. (First drafted the same day with an explicit income/deposit "kind"; refined before any build to the simpler no-kind model below — money in is one thing, optionally scheduled.)

## Context
Until now the money model only let a user record **scheduled income/pay** (FR-4), an **opening balance** at setup (FR-37), and **money-back** on the spending side (a refund or return that offsets a purchase, ADR-0014). There was no clean home for money that comes in but isn't scheduled pay — a gift, a sale, a one-off transfer. That money went unrecorded (or got mis-logged as a refund), so available-now understated what the user actually has. We are in Phase 0 (the money module, schema and tests are not built yet), so this is the cheapest moment to get the money-in model right; changing it after the schema and money logic exist would be a migration.

## Options
- **One "money in" entry, optionally scheduled — no income/deposit distinction (chosen)**
  - Good: one simple concept the user already understands ("money coming in"); captures *all* incoming money, so available-now is accurate; "income" is just money-in the user chose to schedule, and first-run setup already prompts for it (FR-3, FR-37), so there's nothing extra to learn; small schema; reuses the FR-9 recurrence model.
  - Bad: the rules for "what sets the next payday" and "what counts as arrived" are stated against *scheduled vs one-off* rather than a type label.
- **Money-in with an explicit `kind` (income | deposit)**
  - Good: names the common case ("income") in the data.
  - Bad: the kind adds a distinction the user never needs to make — *scheduled vs one-off* already carries it — and it collides with naming (a `deposits` table whose `kind` is "income"). Rejected as needless.
- **Keep income-only (status quo)**
  - Good: simplest to leave alone.
  - Bad: no home for non-pay money in; users mis-log it as money-back or not at all; available-now is understated.

## Decision
Model all incoming money as one kind of thing — a **deposit** (any money in) — stored in a `deposits` table: `amount` (whole cents, ADR-0009) and a `date` (defaults to today, editable). A deposit may **optionally** be linked to a recurring schedule.
- **Recurring schedules** live in `deposit_schedules` (renamed from `income_sources`): amount, frequency (one-time, weekly, every two weeks, twice a month, monthly; FR-4), next expected date. A deposit linked to a schedule is an expected, recurring arrival (what "income/pay" means); an unlinked deposit is a one-off.
- There is **no income/deposit `kind`** — the distinction is simply *scheduled vs one-off*. "Income" is a user-facing word for a scheduled recurring deposit, not a stored type.
- **Only a scheduled (recurring) deposit sets the next-payday window** and triggers the "Did it arrive?" confirmation (FR-7); its date is the planning anchor. MVP #1 supports one recurring schedule (multiple are MMP).
- **Setup already captures the main recurring money-in** (FR-3, FR-37): the user enters their regular income (scheduled) alongside the opening balance. Beyond setup, any money in is a deposit — scheduled or one-off — with a gentle nudge to schedule anything that recurs, never forced.
- This generalizes the safe-to-spend formula (ADR-0013): its "arrived pay" term becomes **"money in that has arrived."**
- **Money-back is unchanged and stays separate** — it is a spending-side offset (ADR-0014), not a deposit. A reimbursement that is simply new money in is a **deposit**.
- Owner-only via Row Level Security (ADR-0012); computed into safe-to-spend, never stored (ADR-0010, ADR-0013); recurring deposits use the FR-9 "just this one, or all future?" model and are edited or deleted per ADR-0019.

## Consequences
One concept ("money in") and one form cover every case, which closes the gap and keeps available-now accurate. The schema is two tables built in Phase 0 — `deposits` (every money-in arrival) and `deposit_schedules` (recurring definitions) — so adding non-pay money in is never a migration. **FR-4 (income) and FR-39 (deposit) converge** into one "record money in, optionally scheduled" requirement. The safe-to-spend formula and the money test cases cover: a one-off deposit raises available-now immediately; a scheduled deposit sets the next payday and waits on "did it arrive?"; a schedule change moves only future dates. The UI is one "add money in" flow, in plain non-bank language, with "deposit/withdrawal vs money in/out" logged as an assumption to test. This decision **refines ADR-0013** (formula term) and **ADR-0014** (reimbursements are deposits); neither is superseded.
