# ADR-0013: Safe-to-spend formula

## Date and status
2026-11-13. Accepted

## Context
"Safe to spend" is the single most important number in the app (Epic 2) — the one figure on the home screen, and the basis for the "will this purchase fit?" check and the shortfall warning. The Week-2 specs describe the *intent* but never pin the exact arithmetic, and there is no bank link (ADR-0004 scope), so the app only knows about money the user tells it about. The formula must be defined precisely: it lives in the pure money module and has to be unit-testable, and getting it wrong erodes the trust the whole app depends on.

## Options
- **available = opening balance + arrived pay − spending (chosen)**
  - Good: correct from day one — even before the first payday — because first-run setup captures a starting balance; matches how a user actually experiences "what do I have right now"; works with no bank link.
  - Bad: relies on an honest opening balance and reasonably complete spending entries (mitigated by the "budget stays reliable when some spending is missing" handling, 3.2.1).
- **available = arrived pay − spending (no opening balance)**
  - Good: simpler; nothing to ask at setup.
  - Bad: shows $0 / wrong until the first payday is logged, even though the user already has money — confusing and trust-breaking at the very first impression.
- **Link a bank account for a real balance**
  - Good: most accurate.
  - Bad: out of MVP #1 scope (no bank links — privacy and cost); rejected by the product direction.

## Decision
Define:

    available now = opening balance (captured at first-run setup)
                  + pay that has arrived
                  − net spending (purchases and paid bills, minus any "money back")

    safe-to-spend = available now
                  − unpaid bills due before the next payday
                  − the user's optional flexible-spending buffer

Safe-to-spend may be negative; a negative value is the "shortfall" that becomes the single next step. A paid bill moves from the "unpaid bills" term into net spending, so it is counted exactly once (never double-counted). A "money back" entry (refund/return) reduces net spending, raising available now. Compute it every time from stored data (ADR-0010), in the pure money module (ADR-0011), in whole integer cents (ADR-0009).

## Consequences
First-run setup must capture an opening balance. The money module needs unit tests covering: the opening-balance cold start, a paid bill not being double-counted, a bill due before vs. after the next payday, a "money back" entry offsetting spending, the optional buffer, and a negative (shortfall) result. If the definition changes later (e.g., multiple pay cycles, per-goal set-asides), that is a new ADR that supersedes this one. The detailed, worked rules live in docs/money-rules.md.
