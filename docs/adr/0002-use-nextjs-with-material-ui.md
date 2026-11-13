# ADR-0002: Use Next.js with Material UI for the app

## Date and status
2026-11-13. Accepted

## Context
The app is a three-tier web app that needs both user-facing screens (the presentation tier) and server code (the middle tier). It is built by one person with an AI coding agent on a short timeline, and the audience — adults with ADHD — needs an interface that is consistent, accessible (WCAG 2.2 AA), and calm. The course sets Next.js plus a design system as the front end.

## Options
- **Next.js (App Router, TypeScript) + Material UI (chosen)**
  - Good: one framework runs both the screens and the server code (server actions), so there is less to wire together; Material UI supplies accessible, ready-made components, so we meet the accessibility baseline without hand-building controls; one theme file gives a consistent, calm look; deploys natively on Vercel.
  - Bad: Material UI brings its styling engine (Emotion) as a dependency and has its own theming learning curve; component libraries add bundle weight.
- **Next.js + Tailwind or a headless kit**
  - Good: smaller, more custom styling.
  - Bad: more UI built by hand, including accessibility; slower for a solo build; mixing with Material UI causes conflicts.
- **A plain React single-page app + a separate API**
  - Good: flexible.
  - Bad: two things to build, wire, and host; no built-in server tier; more work.

## Decision
Use Next.js (App Router, TypeScript) for both the screens and the server code, with Material UI as the design system, themed once in `src/theme.ts` for a calm, ADHD-friendly look. Do not use Tailwind (avoid running two styling systems). This is also a course requirement.

## Consequences
Material UI's Emotion engine is wired for the App Router (`AppRouterCacheProvider`) so styles render correctly on the server. The team customizes one theme rather than restyling each screen. Accessible components come for free, which speeds the build; the cost is Material UI's theming learning curve and some bundle size. The font and colors are design choices recorded in `docs/design-guidelines.md`, not here.
