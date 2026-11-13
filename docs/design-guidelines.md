# ADHD Budgeting App — Design Guidelines

Source: our Research Foundation Report, Sections 6–9. These apply to **every screen**.
They are evidence-informed; items noted as assumptions are to validate with real users.

## Who we design for
Adults with ADHD (primary audience 25–49). ADHD is a cognitive accessibility need —
attention, working memory, executive function. We remove barriers; we never label or judge.

## Non-negotiable baseline
- Meet **WCAG 2.2 AA**, plus W3C cognitive accessibility guidance.
- **No shame, ever.** Supportive, plain, literal language. Never blame the user.
- **Don't rely on memory.** The app remembers; the user shouldn't have to.
- **Nothing lost.** Auto-save; a failed action keeps the user's input on screen; undo is easy.

## The 8 design principles (what to build toward)
1. **Build around the 5 budgeting steps** (income, spending, bills, staying in the plan, the adjust loop). Anything else waits for a later release.
2. **Let the app remember** — automatic tracking, bill calendar, payday-timed reminders.
3. **Put a pause between impulse and purchase** — a "safe to spend" number, optional limits, a cooling-off step.
4. **Keep every task tiny** — one action per screen, check-ins under ~2 minutes, auto-save.
5. **Carry the load first; teach just in time** — optional 1-minute tips at the moment of a real decision, never required lessons.
6. **Reward progress, never shame slips** — celebrate wins; offer a fresh start after overspending.
7. **Keep it calm, clear, and visual** — one key number per screen, plain language, visuals over tables, minimal alerts.
8. **Design for long-term habits and personal differences** — personalization; gentle re-engagement after time away.

## Per-screen checklist (apply to every screen)
- [ ] Is the screen's purpose clear at a glance?
- [ ] Is there only one main action or idea?
- [ ] Are distractions removed (no pop-ups, animations, clutter)?
- [ ] Does the user need to remember anything from a previous step? (They shouldn't.)
- [ ] Is progress saved automatically?
- [ ] Can mistakes be undone?
- [ ] Is the most important number or action highlighted?
- [ ] Is the language plain and short (~8th-grade reading level)?
- [ ] Does the user get positive feedback when they finish something?
- [ ] Is the tone free of shame?
- [ ] Does it meet WCAG 2.2 AA?
- [ ] Are there 5 or fewer main choices on the screen?

## Visual style decisions
- **Font:** Inter (self-hosted). Chosen for legibility. (No ADHD-specific research proves one font is best; a clean, readable sans-serif is what matters.)
- **Color:** calm, muted, lower-saturation palette; soft off-white background (not stark white); strong contrast (AA). **Never rely on color alone** — always pair it with text or an icon.
  - Reserve **red** for genuinely destructive actions (e.g., delete account), **never** for "you overspent." Use soft amber for caution and a calm green/blue for positive status, always with supportive wording. (Our audience is shame-sensitive; red reads as failure.)
- **Light / dark mode:** **Light mode only for MVP #1.** Dark mode (or following the device's setting) is a **nice-to-have for a later release** — it needs a second, fully contrast-checked palette.
- **Spacing:** generous white space; large touch targets.

## Honesty note
No published study has tested a budgeting app built for adults with ADHD. Treat these as
evidence-informed starting points and validate with real users (co-design) when possible.
