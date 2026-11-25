# ADR-0027: Plain calendar-date math in the money module (no date library, no timezone-bearing Date)

## Date and status
2026-11-25. Accepted

## Context
Phase 1 ("Prove the core") builds the pure money module (ADR-0011), and its hardest part is
**recurring-date math**: the next payday for a schedule, which bill occurrence is due, the
month-end clamp (a bill saved for the 31st in a 30-day month or February), and moving every
*future* date when a schedule changes while past facts stay put. The T-8 money test cases make
these exact behaviours the Phase 1 gate, and one case is explicit that **paydays and due dates
must land on the user's calendar day even when their time zone is far from UTC** (T-4.2.3).

The data model stores these as calendar `date` values with no time of day — `anchor_date`,
`due_date`, `deposit_date`, `entry_date` (docs/database-design.md, ADR-0022). The user's time
zone lives in `profiles.time_zone`; only moments in time (created, send) are `timestamptz` in UTC
(money-rules.md, integrity rule 3).

JavaScript's built-in `Date` is a timestamp — a single instant with an implicit time zone. Its
`getMonth()/getDate()` (local) and `getUTCMonth()/getUTCDate()` (UTC) disagree whenever the local
offset crosses midnight, which is the classic source of **off-by-one-day** bugs for values that are
really just calendar dates. Using `Date` for calendar arithmetic would make the money module's
output depend on the machine's time zone — the opposite of the deterministic, machine-independent,
fully unit-testable module ADR-0011 requires. We are at the start of Phase 1, before the date
helpers exist, so this is the cheapest moment to fix the representation.

## Options
- **Plain calendar-date math — ISO `YYYY-MM-DD` strings / `{year, month, day}`, no library (chosen)**
  - Good: a calendar date is represented as exactly what it is — year/month/day, no time, no zone;
    arithmetic (compare, add days, add months with clamp, next occurrence per frequency) is pure
    integer work with the same result on every machine; zero dependencies; nothing in the module
    ever calls `new Date()`, so there is no UTC/local ambiguity to get wrong; trivial to unit-test
    with the exact-cents / exact-date style T-8 (TA-2) asks for.
  - Bad: we hand-roll and own a small amount of date logic — month lengths, leap years, the
    month-end clamp, semimonthly — all of which the T-8 cases pin down.
- **A date library (date-fns UTC mode, Luxon, or Temporal)**
  - Good: less hand-rolled code; well-tested month/leap-year handling.
  - Bad: adds a dependency for a tiny, fixed set of frequencies; most libraries still hand back
    timezone-bearing `Date`/`DateTime` objects, so the discipline of never introducing a zone is
    still on us — the library doesn't remove the risk, it hides it; heavier than this needs.
    (Temporal's `PlainDate` fits conceptually but is not yet dependable across our runtimes.)
- **Raw JavaScript `Date` for the calendar math**
  - Good: nothing to add; familiar.
  - Bad: a `Date` is an instant with a zone, so calendar results shift with the machine's time zone
    — exactly the off-by-one class of bug that breaks the T-4.2.3 time-zone case and makes tests
    non-deterministic. Rejected.

## Decision
The money module represents every **calendar date** as an ISO `YYYY-MM-DD` string (parsed to a
`{year, month, day}` record internally) and does all recurring-date math with a small set of pure
helpers. The module **never constructs a `new Date()`** for calendar logic and does **no time-zone
math** of its own.

- **"Today" is passed in.** Every function that needs the current date takes an explicit `asOfDate`
  (the user's *local* calendar date, `YYYY-MM-DD`). The module never reads the system clock, so its
  output depends only on its inputs.
- **Time-zone conversion lives at the boundary, not in the domain.** Turning "now" (a UTC instant)
  into the user's local calendar day using `profiles.time_zone` is the job of the server/data layer
  *before* it calls the module. The module receives an already-correct calendar date. This is how
  the T-4.2.3 "far from UTC" case is satisfied: the conversion happens once, at the edge, and the
  pure math can't reintroduce an offset.
- **Month-end clamp.** Adding months preserves the *saved* day-of-month; if the target month has no
  such day, the occurrence falls on that month's **last day** (31 → Feb 28, or Feb 29 in a leap
  year; 31 → Apr 30). The saved anchor day is **retained** for future steps, so a bill saved for the
  31st runs Jan 31 → Feb 28 → Mar 31 → Apr 30, never drifting to the 28th permanently.
- **Frequencies** are the fixed set from ADR-0022 (`one_time`, `weekly`, `biweekly`, `semimonthly`,
  `monthly`); `semimonthly` uses `anchor_date`'s day plus `second_day`. All are computed from the
  stored `anchor_date` — no next-date column is ever stored (ADR-0010).
- **Schedule changes** move only future occurrences: because the next date is always *computed* from
  the current schedule and `asOfDate`, changing the schedule changes future dates automatically,
  while already-recorded facts (`bill_payments`, arrived `deposits`) are historical rows and are
  never recomputed (money-rules.md).

## Consequences
The money module is deterministic and machine-independent: the same inputs give the same cents and
the same dates on any developer's laptop and in CI, which is what makes the T-8 suite a trustworthy
Phase 1 gate (ADR-0011, ADR-0017). We take on a small, well-bounded amount of hand-rolled date
logic (month lengths, leap years, the clamp, semimonthly) — all of it covered by T-8 cases, so a
mistake fails a test loudly rather than showing a wrong date. We add **no dependency**.

The cost moves one responsibility to the edge: the **server/data layer must convert the current UTC
instant to the user's local calendar date** (via `profiles.time_zone`) before calling the module,
and must pass stored `date` columns straight through as `YYYY-MM-DD` strings without wrapping them
in a zoned `Date`. That boundary rule is recorded here and belongs in the data-layer work, not the
domain module.

If MVP grows to need many more frequencies, business-day rules, or full calendar handling, revisit
this with a dedicated date library (e.g. Temporal once dependable) in a new ADR that supersedes this
one. For MVP #1's fixed, small frequency set, plain calendar-date math is the simplest thing that is
also the most correct.
