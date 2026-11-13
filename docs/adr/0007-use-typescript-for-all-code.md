# ADR-0007: Use TypeScript for all code

## Date and status
2026-11-13. Accepted

## Context
The app's screens, server code, and reminder function all handle money, where small mistakes matter. It's built by one person with an AI coding agent, so catching errors early (before they reach the live app) is valuable.

## Options
- **TypeScript everywhere (chosen)**
  - Good: catches type mistakes before runtime; makes the money logic safer; better editor help for a solo builder.
  - Bad: a little more setup and stricter code.
- **Plain JavaScript**
  - Good: slightly less ceremony.
  - Bad: errors surface only at runtime, in front of users.

## Decision
Use TypeScript for all code, with TypeScript's `strict` mode enabled in `tsconfig.json` (so missing/`null` values must be handled explicitly). Production builds fail on type errors, so a broken type never ships. (This is the Next.js default in our setup.)

## Consequences
Mistakes are caught at build time instead of in the live app. Minor extra strictness while writing code. Pairs with the pure money module (ADR-0011) to make money rules both typed and testable.
