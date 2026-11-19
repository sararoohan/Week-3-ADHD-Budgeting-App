# Money / Domain Rules — ADHD Budgeting App

Source: the Technical Architecture spec — Database Architecture (integrity rules); the
Requirements spec — Task-level Requirements; plus the Research Foundation Report.
These rules live in the pure money module (ADR-0011) and must be unit-tested with made-up numbers.

## Core principles
- Money is stored as whole integer cents (ADR-0009); converted to dollars only for display;
  amounts must be above zero.
- Spending, deposits (all money in), and "money back" amounts are all stored as positive values; a "money back"
  entry (see below) is a distinct type that offsets spending, not a negative number.
- Never store what can be calculated — safe-to-spend, bills due before payday, money set
  aside — all computed each time from stored data (ADR-0010).
- All money rules live in one pure TypeScript module (ADR-0011): no screen or database code,
  same input → same output, fully unit-testable.

## Dates & recurring items
- Paydays and due dates are stored as calendar dates; timestamps (created, sent) in UTC; the
  user's time zone in their profile.
- Schedules cover one-time and repeating items at weekly, biweekly, semi-monthly, and monthly
  frequencies. Repeating deposits (scheduled money in) and bills are stored once with a schedule; future dates are
  calculated, not copied ahead.
- Changing a schedule changes only *future* calculated dates. Already-recorded facts (paid
  bills, arrived money in) are historical and are never rewritten.
- A monthly day a month doesn't have (29th–31st) falls on that month's last day, and the saved
  day stays the same (a bill set for the 31st is due Feb 28, Mar 31, Apr 30).
- "The next payday" is the next upcoming date from the user's recurring deposit schedule; only a
  scheduled deposit drives this window (for "bills due before the next payday"). A one-off deposit
  (ADR-0020) simply raises "available now" and sets no payday. There is no income/deposit type — the
  distinction is scheduled vs one-off, and a scheduled recurring deposit is what "income" means to the user.
  MVP #1 supports one recurring schedule plus unlimited one-off deposits; multiple recurring schedules are MMP.

## Money in (deposits, scheduled or one-off)
- Plan only from money that has actually arrived (2.1.3). A scheduled deposit is *expected*: on its
  date, ask "Did it arrive?" with the amount pre-filled, rather than counting it automatically.
- A one-off deposit (ADR-0020) is logged when it arrives and counts toward "available now"
  immediately — there is no "did it arrive?" step, since it isn't an expected, scheduled amount.

## Refunds / money back
- A "money back" entry records money returned to the user (a refund or return). A reimbursement that is simply new money coming in is a *deposit*, not money-back (ADR-0020).
  It is a first-class entry — NOT something the user reconciles by hunting down and editing or
  deleting the original purchase. Forcing that manual correction is exactly the executive-function
  load this app exists to remove, so refunds get their own simple "money came back" action.
- It is stored as a positive amount of a distinct type (not a negative spend) and reduces net
  spending, so it raises "available now."
- It can optionally be linked to the purchase/category it refunds, so "where money went" stays
  accurate; if unlinked, it still offsets overall spending.
- It is not money in (not a deposit), so it does not affect payday logic or the "did it arrive?" flow.

## Safe-to-spend  (confirmed — see ADR-0013, refined by ADR-0020)
Intent: how much the user can safely spend before their next payday, with upcoming bills
already set aside.

    available now = opening balance (captured at first-run setup)
                  + money in that has arrived (scheduled and one-off deposits)
                  − net spending (purchases and paid bills, minus any "money back")

    safe-to-spend = available now
                  − unpaid bills due before the next payday
                  − the user's optional flexible-spending buffer (set in their profile)

Notes:
- The opening balance exists because there is no bank link, so the app can't otherwise know
  starting cash; it is captured once during first-run setup.
- Safe-to-spend can be negative; a negative value *is* the "shortfall" surfaced as the single
  next step (below).
- A paid bill moves out of "unpaid bills due before the next payday" and into net spending, so
  it is subtracted exactly once — never double-counted. This is a key unit-test case.
- A "money back" entry (refund/return) reduces net spending, so it raises available now. See
  "Refunds / money back" below.

## The single "next step" (priority order)
finish setup → confirm pay arrived → a shortfall (can't cover a bill) → a bill due within 3
days → a check-in is due → otherwise, nothing needed.
(Shortfall ranks above an imminent bill because it needs lead time to fix. The 3-day window is
a fixed default for MVP #1; the per-bill reminder schedule is user-configurable — see below.)

## Reminders (timing only; sending infrastructure is ADR-0015)
- Default bill reminder: on the payday before the due date; users can set their own schedule.
- "Which reminders are due" is a money-module date calculation; the sending/retry job is
  infrastructure (ADR-0015, built with T-5).

## Everyday rules
- One home per fact: whether a bill is paid lives only in bill_payments; whether a scheduled
  deposit arrived lives only in deposits.
- Spending entries, deposits (money in) and bills can each be edited or removed (ADR-0019): an edit
  overwrites in place; a delete is a hard delete with an immediate in-memory Undo; deleting a
  purchase also removes any linked refunds (Undo restores them together); a recurring entry first
  asks "just this one, or all future?" (FR-9). Fixing a mistake must be quick and low-effort — never a chore.