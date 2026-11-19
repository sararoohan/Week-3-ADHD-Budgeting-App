# ADR-0010: Calculate safe-to-spend, never store it

## Date and status
2026-11-13. Accepted

## Context
"Safe to spend" (and similar derived numbers) must always match the latest income, bills, and spending. A stored value that falls out of date would show a wrong number and erode trust.

## Options
- **Calculate each time from stored data (chosen)**
  - Good: always matches the latest entries; one tested money module; data per user is small, so it stays fast.
  - Bad: a little computation on each view.
- **Save it and update after each change**
  - Good: faster reads.
  - Bad: a missed update shows a stale, wrong amount.

## Decision
Never store safe-to-spend or other values the app can derive. Compute them in one money module each time they're shown.

## Consequences
Numbers are always current. Slight compute cost, negligible at per-user scale. Lives in the pure money module (ADR-0011) so it's unit-tested with made-up numbers.
