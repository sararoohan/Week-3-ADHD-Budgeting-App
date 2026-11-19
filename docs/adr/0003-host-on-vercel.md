# ADR-0003: Host the app on Vercel

## Date and status
2026-11-13. Accepted

## Context
The built app must be reachable by anyone on the internet, with no hosting budget and no custom domain, and must be easy for a solo builder to deploy and redeploy. The course sets Vercel as the host.

## Options
- **Vercel, Hobby (free) plan (chosen)**
  - Good: made by the same team as Next.js, so it runs Next.js with no custom setup; every push to `main` deploys automatically; a free `your-app.vercel.app` address needs no domain purchase; environment-variable settings keep secrets out of the repo; free Speed Insights for performance.
  - Bad: the free plan is for non-commercial use and has usage limits; advanced features need a paid plan.
- **Netlify / Cloudflare Pages**
  - Good: also free tiers with git-based deploys.
  - Bad: less seamless with Next.js's newest features than Vercel.
- **Self-hosting on a VPS**
  - Good: full control.
  - Bad: servers to run, secure, and pay for — far more work for a solo class project.

## Decision
Host on Vercel's free Hobby plan, deploying from the GitHub repo on every push to `main`, using a free `*.vercel.app` URL. Supabase keys are stored in Vercel's environment-variable settings. This is also a course requirement.

## Consequences
Deploys are automatic on push; if a build fails, the build log is where to look. The non-commercial Hobby limits are fine for a class project. Secrets live in Vercel settings (see the secrets ADR). Note the Supabase free database pauses after inactivity; that is handled in its own decision.
