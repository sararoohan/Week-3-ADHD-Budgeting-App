# ADR-0005: Disable Next.js 16 Cache Components and partial prefetching

## Date and status
2026-11-13. Accepted

## Context
When the app was scaffolded, the current `create-next-app` turned on two new Next.js 16 options by default: `cacheComponents` (Cache Components, formerly "dynamic IO") and `partialPrefetching`. Cache Components changes the default data model: anything that reads request-time data — cookies, headers, the current user — must be wrapped in a cache boundary or a Suspense boundary, or the build fails with errors that are hard to read. This project will sign users in with Supabase Auth, which reads cookies on the server (see ADR-0004), so this default would create friction exactly where the app is most sensitive. These were framework defaults, not a choice we made up front, so the decision could only be made once the project existed.

## Options
- **Disable both for now (chosen)**
  - Good: the standard, well-documented Next.js data model applies, so Supabase cookie/auth handling later is straightforward; fewer confusing build errors for a solo builder; nothing is lost for an MVP that has no caching needs yet.
  - Bad: we forgo the newest caching/prefetch performance features; adopting them later is a deliberate migration rather than a default.
- **Keep both enabled**
  - Good: uses Next.js's newest performance model from day one.
  - Bad: every piece of request-time data (auth especially) needs cache or Suspense boundaries; more to learn and more to get wrong on a short timeline, for performance the MVP does not yet need.

## Decision
Set `cacheComponents: false` and `partialPrefetching: false` in `next.config.ts`. Revisit once the core features exist and there is a real, measured reason to adopt them.

## Consequences
The app uses Next.js's conventional rendering and data model, which keeps the upcoming Supabase auth work simple. The config carries a comment explaining why the flags are off and how to turn them back on. If we later adopt Cache Components, it should be its own ADR that supersedes this one, done as a focused change with auth paths wrapped correctly.
