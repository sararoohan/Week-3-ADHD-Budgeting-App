# ADR-0014: Record refunds as "money back" entries, not negative spending

## Date and status
2026-11-14. Accepted

## Context
Users sometimes get money back — a refund, a return, a reimbursement. MVP #1 lets users record that (FR-36), and the returned money must be reflected in safe-to-spend. We need a representation that keeps the math exact (ADR-0009: amounts stored as whole positive cents) and keeps the ADHD experience low-effort (no hunting down and editing the original purchase).

## Options
- **A typed "money back" entry, stored as a positive amount (chosen)**
  - Good: amounts stay positive (keeps ADR-0009); the money module nets purchases minus money-back; a one-tap "money came back" action, no reconciling against the original; can optionally link to the purchase it refunds so "where money went" stays accurate.
  - Bad: the money module and every spending total must treat the refund type as an offset.
- **A negative amount on a normal spending entry**
  - Good: simplest storage; nets automatically in a sum.
  - Bad: breaks ADR-0009 (amounts must be above zero); muddies "spending" with negative rows; easy to mis-sum.
- **A separate refunds/adjustments table**
  - Good: fully normalized.
  - Bad: more schema and queries than MVP #1 needs; the optional link to a purchase is the only real relationship.

## Decision
Record "money back" (refunds, returns, reimbursements) as its own entry type on the spending record, stored as a positive amount. It offsets net spending (net spending = purchases − money back), so it raises "available now" and feeds safe-to-spend (ADR-0013). It may optionally be linked to the purchase or category it refunds. It is not treated as income, so it does not affect payday logic or the "did your pay arrive?" flow. A refund is corrected or removed like any spending entry (edit/delete with undo), never by editing the original purchase.

## Consequences
The spending table carries a `type` (purchase or refund) and an optional reference to the purchase a refund offsets. The money module nets money-back against purchases wherever it totals spending — a key unit-test case (a refund raises safe-to-spend by its amount and never double-counts). Reports of "where money went" subtract linked refunds. Because refunds are positive and typed, ADR-0009 holds unchanged.
