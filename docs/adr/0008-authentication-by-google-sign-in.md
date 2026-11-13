# ADR-0008: Authentication by Google sign-in (no passwords)

## Date and status
2026-11-13. Accepted

## Context
The homework requires secure user accounts, and users share sensitive money data, so sign-in must be safe. The ADHD audience also benefits from not having to remember a password (WCAG 2.2 "Accessible Authentication" and the "don't rely on memory" principle). Budget is free.

## Options
- **Google sign-in via Supabase Auth (chosen)**
  - Good: no passwords to store or remember; Google handles the hard security; fast to build; shares only email and name.
  - Bad: assumes the user has a Google account.
- **Email + password**
  - Good: no third party.
  - Bad: password storage/reset burden; worse for the ADHD memory principle.
- **Email magic link / one-time code**
  - Good: no passwords.
  - Bad: more flows to build; email deliverability friction.
- **Passkey**
  - Good: very secure, no password.
  - Bad: newer, more to build; kept as an optional add-on.

## Decision
Use Google sign-in through Supabase Auth, requesting only email and name. No passwords in MVP #1. An optional passkey is considered for later and built last if time allows.

## Consequences
Requires setting up Google OAuth credentials (a one-time account step); the OAuth client secret is kept in environment variables, never in the repo (ADR-0006). No password storage. Supabase Auth manages sessions; sign-in rate limits use Supabase defaults. Users without a Google account can't sign in yet — acceptable for MVP #1 and testing with made-up data.
