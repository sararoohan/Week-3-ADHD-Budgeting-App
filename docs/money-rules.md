# Money / Domain Rules — ADHD Budgeting App

Source: the Requirements spec — Database Architecture (integrity rules, under the Technical
Architecture subpage) + Task-level Requirements; plus the Research Foundation Report.
These rules live in the pure money module (ADR-0011) and must be unit-tested with made-up numbers.

## Core principles
- Money is stored as whole integer cents (ADR-0009); converted to dollars only for display;
  amounts must be above zero.
- Spending, income, and "money back" amounts are all stored as positive values; a "money back"
  entry (see below) is a distinct type that offsets spending, not a negative number.
- Never store what can be calculated — safe-to-spend, bills due before payday, money set
  aside — all computed each time from stored data (ADR-0010).
- All money rules live in one pure TypeScript module (ADR-0011): no screen or database code,
  same input → same output, fully unit-testable.

## Dates & recurring items
- Paydays and due dates are stored as calendar dates; timestamps (created, sent) in UTC; the
  user's time zone in their profile.
- Schedules cover one-time and repeating items at weekly, biweekly, semi-monthly, and monthly
  frequencies. Repeating income and bills are stored once with a schedule; future dates are
  calculated, not copied ahead.
- Changing a schedule changes only *future* calculated dates. Already-recorded facts (paid
  bills, arrived pay) are historical and are never rewritten.
- A monthly day a month doesn't have (29th–31st) falls on that month's last day, and the saved
  day stays the same (a bill set for the 31st is due Feb 28, Mar 31, Apr 30).
- "The next payday" is the next upcoming date from the user's recurring income schedule; it
  defines the window for "bills due before the next payday." MVP #1 supports one recurring income
  schedule plus unlimited ad-hoc income arrivals; multiple recurring schedules are MMP.

## Pay that has arrived (not expected)
- Plan only from money that has actually arrived (2.1.3). On payday, ask "Did your pay arrive?"
  with the amount pre-filled, rather than counting pay automatically.

## Refunds / money back
- A "money back" entry records money returned to the user (a refund, return, or reimbursement).
  It is a first-class entry — NOT something the user reconciles by hunting down and editing or
  deleting the original purchase. Forcing that manual correction is exactly the executive-function
  load this app exists to remove, so refunds get their own simple "money came back" action.
- It is stored as a positive amount of a distinct type (not a negative spend) and reduces net
  spending, so it raises "available now."
- It can optionally be linked to the purchase/category it refunds, so "where money went" stays
  accurate; if unlinked, it still offsets overall spending.
- It is not treated as pay/income, so it does not affect payday logic or the "did your pay
  arrive?" flow.

## Safe-to-spend  (confirmed — see ADR-0013)
Intent: how much the user can safely spend before their next payday, with upcoming bills
already set aside.

    available now = opening balance (captured at first-run setup)
                  + pay that has arrived
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

## Reminders (timing only; sending infrastructure is a Pending ADR on T-5)
- Default bill reminder: on the payday before the due date; users can set their own schedule.
- "Which reminders are due" is a money-module date calculation; the sending/retry job is
  infrastructure (Pending ADR, built with T-5).

## Everyday rules
- One home per fact: whether a bill is paid lives only in bill_payments; whether pay arrived
  only in income_arrivals.
- Spending entries, income, and bills can each be edited or removed, and a removal shows an
  Undo right afterward. Fixing a mistake must be quick and low-effort — never a chore.