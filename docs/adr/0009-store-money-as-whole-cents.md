# ADR-0009: Store money as whole cents

## Date and status
2026-11-13. Accepted

## Context
A budgeting app must show exact amounts; rounding errors would break trust and the "accurate money logic" requirement.

## Options
- **Whole cents in an integer column (chosen)**
  - Good: exact; fast; whole-number math has no rounding drift; convert to dollars only for display.
  - Bad: must remember to format for display.
- **`numeric(12,2)`**
  - Good: also exact.
  - Bad: slower, and arrives as text the code must convert anyway.
- **Floating point (`real`/`double`)**
  - Ruled out: inexact; rounding errors break the money logic.
- **Postgres `money` type**
  - Bad: tied to one currency format setting; no advantage over cents.

## Decision
Store all amounts as whole integer cents, in a single currency (US dollars for MVP #1). Convert to dollars only when displaying.

## Consequences
Money math is exact and simple. Every amount field is an integer; the UI formats cents into dollars for display. Any calculation that divides (e.g., splitting an amount) rounds to the nearest whole cent (round half up), so displayed totals always reconcile.
