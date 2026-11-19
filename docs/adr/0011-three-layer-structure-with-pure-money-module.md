# ADR-0011: Three-layer structure with the money rules in one pure module

## Date and status
2026-11-13. Accepted

## Context
The money rules are the heart of the app and must be testable and protected from changes to the screens or the database.

## Options
- **Three layers, money rules in a pure module (chosen)**
  - Good: business rules isolated from UI/DB; every rule unit-testable; clear where code belongs.
  - Bad: a little more structure up front.
- **Logic mixed into components and database calls**
  - Good: quicker to start.
  - Bad: rules hard to test; changes to screens or DB risk breaking money math.

## Decision
Split the code into three layers — presentation (screens), domain (a pure TypeScript money module: safe-to-spend, bills due before payday, repeating dates, which reminders are due, the next step), and data access (Supabase queries) — with dependencies pointing inward. The money module holds no screen or database code. In the repo this maps to `src/app` (presentation), `src/domain` (the pure money module), and `src/data` (Supabase queries).

## Consequences
Every money rule can be unit-tested with made-up numbers. The data layer is the only place that talks to the database and never trusts a user ID sent from the browser. A bit more structure to set up, repaid in testability.
