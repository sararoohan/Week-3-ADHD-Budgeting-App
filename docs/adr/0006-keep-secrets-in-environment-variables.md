# ADR-0006: Keep secrets in environment variables, never in the repo

## Date and status
2026-11-13. Accepted

## Context
The app needs several configuration values to reach Supabase: the project URL, the public "anon" key used by the browser, and the private "service-role" key used only by server code. The service-role key bypasses Row Level Security (see ADR-0004), so if it ever leaked it would expose every user's data. The code lives in a public-style GitHub repo and deploys to Vercel (see ADR-0003), so there must be one clear rule for where these values live and how they stay out of version control. ADR-0003 and ADR-0004 already assume this decision ("see the secrets ADR"); this records it.

## Options
- **Environment variables, split public vs. server-only (chosen)**
  - Good: secrets never enter git, so they can't leak through the repo or its history; local and deployed environments read the same names from different places; Next.js's `NEXT_PUBLIC_` prefix makes it explicit which values are safe for the browser and which are server-only; rotating a key is a settings change, not a code change.
  - Bad: every environment (each laptop, Vercel) must have the variables set, so a missing one causes a runtime error until it's added; contributors need to be told which values they need.
- **Hard-code values in the source**
  - Good: nothing to configure; it "just works" on checkout.
  - Bad: secrets land in git history permanently and are visible to anyone with the repo — unacceptable for the service-role key.
- **Commit a filled-in `.env` file**
  - Good: one place, travels with the project.
  - Bad: same problem — the secrets are in version control.

## Decision
Store all configuration secrets in environment variables.
- **Local:** keep them in `.env.local`, which is already covered by `.gitignore` (the `.env*` rule) and is never committed.
- **Deployed:** set the same variables in Vercel's environment-variable settings.
- **Public vs. server-only:** only values safe for the browser get the `NEXT_PUBLIC_` prefix (the Supabase URL and anon key). The **service-role key has no prefix and is read only in server code — never in a client component.**
- **Sharing:** commit a `.env.example` listing the variable *names* with empty values, so anyone setting up the project knows what to provide, without exposing any real secret.

## Consequences
`.gitignore` must keep excluding `.env*` (verify before every commit; this is part of the pre-commit secret scan). A missing or misnamed variable shows up as a runtime/connection error, and the first thing to check is that every name exists in both `.env.local` and Vercel. The service-role key's server-only placement must be respected in code review — it must never appear in anything the browser downloads. If a secret is ever committed or exposed, rotate it in Supabase and update both environments; removing it from code alone is not enough, since git history keeps the old value. This decision backs the course's "Keep Your App Safe" checklist.
