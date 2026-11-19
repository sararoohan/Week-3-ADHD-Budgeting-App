# Definition of Done — ADHD Budgeting App (MVP #1)

Source: the Technical Architecture spec — Quality Engineering Architecture.

Every Kanban card is Done only when **all** of the following are true. The NFRs live in
this shared checklist rather than being repeated on each card. Each card also has its own
"Done when" (its numbered acceptance items, named tests, and technical-acceptance items)
that points back here.

> **Money test cases:** the cases that prove NFR-3 are specified in the Quality Engineering
> Architecture spec and implemented as the Vitest money-logic suite (T-8, authored test-first in
> Phase 0). That test suite — not a repo markdown doc — is the source of truth for the cases.

- [ ] Every acceptance criterion on the card passes, and its BDD scenarios (if any) run as tests.
- [ ] New or changed money rules have unit tests; all tests pass.
- [ ] axe finds no problems on changed screens; speed checks stay within targets (NFR-5).
- [ ] Changed screens work with a keyboard alone, with visible focus; every control has a label a screen reader reads; contrast meets AA; one main task per screen (NFR-7 — accessibility is checked on every card, not only at the end).
- [ ] Wording is plain and blame-free, with a next step on every error.
- [ ] Nothing the user typed can be lost on a failed save.
- [ ] No secret, personal data, or amount in code, URLs, or error records.
- [ ] Sara has read the pull request.

## Quality gates by phase

Each build phase has a gate in addition to the per-card Definition of Done.

| Phase | Gate | NFRs proven |
|-------|------|-------------|
| 0 Foundation | PR to preview with checks passing; Google sign-up/-out and account deletion work; a test reminder arrives; no user can read another's data; accessibility and speed checks run on every PR; error records delete after 30 days | NFR-1, 2, 4, 9 (+ setup for 5–8, 10, 11) |
| 1 Prove the core | All money test cases pass | NFR-3 |
| 2 Make it usable | Each card meets its acceptance criteria and this Definition of Done | NFR-4, 5, 6, 7 |
| 3 Trust & launch readiness | Accessibility, browser and legal checks pass; manual accessibility pass done | NFR-7, 8, 10, 11 |
| 4 Launch | All tests pass again on the final commit | All |