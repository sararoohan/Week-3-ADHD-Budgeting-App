# ADR-0024: Phased quality gates (CI grows in layers; runtime gates owned by their quality tickets)

## Date and status
2026-11-23. Accepted

## Context
Phase 0 stood up a **lean CI pipeline** — lint, unit tests (Vitest), and `next build` as the type
gate — on every pull request (T-2, ADR-0016). The fuller automated quality gates named in the specs
— **Playwright** end-to-end, **axe** accessibility, and **Lighthouse CI** speed budgets — were
deliberately **not** wired yet, because they check *rendered screens* and there are none beyond the
auth shell. Wiring them now would gate pull requests on checks with nothing meaningful to measure.

This created tension. T-2's technical acceptance (TA-2) lists the full suite (lint, type, Vitest,
Playwright + axe, Lighthouse) as the Phase 0 CI workflow, which would keep T-2 — and, through the
shared Definition of Done's "axe on changed screens / speed within targets" lines, other tickets —
blocked until those gates exist. Yet the project's own Definition of Done already **schedules these
NFRs by phase**: NFR-5 (speed) and NFR-7 (accessibility) in Phase 2, NFR-8 (compatibility) and NFR-7
again in Phase 3 — not Phase 0. And each runtime gate already has a **dedicated owning ticket**:
axe → T-9, Lighthouse → T-10, Playwright phone/desktop projects → T-11.

We need a stated policy for how deferred gates are tracked, so tickets aren't blocked on later-phase
work, nothing is silently dropped, and the board stays honest.

## Options
- **Phased gates: CI grows in layers; each runtime gate is owned by its quality ticket and verified when real screens exist (chosen)**
  - Good: matches the DoD's own phase schedule (NFR-5/7/8 are Phase 2–3); gates run when they can
    measure something real; no duplicate tickets (T-9/T-10/T-11 already own axe/Lighthouse/Playwright);
    infrastructure tickets reach Done on their real merits; the deferral is documented, not silent.
  - Bad: the full gate suite isn't enforced from day one, so a screen built before its gate is wired
    needs the gate applied retroactively (mitigated: accessibility and speed are checked per-feature in
    the DoD as screens land).
- **Wire every gate into CI now (status quo per T-2 TA-2 as written)**
  - Good: one complete pipeline from the start; nothing to retrofit.
  - Bad: the gates have no real screens to check, so they pass trivially or need placeholder targets;
    over-engineers Phase 0 while the actual deliverable (features) is unbuilt; contradicts the DoD's
    own phase schedule.
- **Create new tickets for each deferred gate**
  - Good: explicit tracking.
  - Bad: duplicates T-9/T-10/T-11, which already own exactly these gates; clutters the board.

## Decision
1. **CI is layered.** Phase 0 CI runs lint, unit tests, and the `next build` type gate on every PR
   (done — T-2, ADR-0016). The runtime gates — Playwright, axe, Lighthouse — are added to CI **when
   there are real screens to check**, as their owning tickets are built.
2. **Each runtime gate is owned by its existing quality ticket:** axe accessibility → **T-9**,
   Lighthouse speed → **T-10**, Playwright phone/desktop projects → **T-11**. **No new tickets** are
   created for deferred gates; a new ticket is created only if a deferred item has *no* existing owner.
3. **Owning tickets are scheduled by the DoD phase gates**, not Phase 0: NFR-5 (speed / T-10) and
   NFR-7 (accessibility / T-9) in Phase 2; NFR-8 (compatibility / T-11) in Phase 3. Each carries a note
   that it is deferred until real screens exist.
4. **Infrastructure tickets are not blocked by gates they don't own.** T-2's TA-2 is amended to
   describe the layered pipeline (lean CI now; runtime gates added with T-9/T-10/T-11). The shared
   Definition of Done's accessibility/speed lines remain scoped *"on changed screens,"* so a ticket
   that changes no screens is not blocked by them.
5. This ADR does **not** change ADR-0016 (CI/DevOps) or ADR-0017 (testing strategy) — the tools and
   intent stand. It records the **sequencing** of when each gate comes online.

## Consequences
T-2 can reach Done on its real merits (lean CI, branch protection, Dependabot) instead of waiting on
gates that belong to later phases. The board reflects reality: deferred gate work lives on
T-9/T-10/T-11, scheduled for Phase 2–3, with no duplicate tickets and no silently-dropped
requirements. As each screen is built, its accessibility and speed are checked per the DoD, and the
corresponding CI gate is wired when its owning ticket is implemented. The main risk — a gate wired
later finds issues in screens already built — is mitigated because the DoD already requires
per-feature accessibility and speed checks as screens land, so problems surface continuously rather
than all at the end. ADR-0016 and ADR-0017 stand unchanged; this is additive sequencing, not a
reversal.
