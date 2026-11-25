# ADR-0026: Make `staging` the default branch so Dependabot PRs flow through it

## Date and status
2026-11-24. Accepted

## Context
Our workflow (ADR-0016) runs everything through the `staging` integration branch: feature
branches open PRs into `staging`, CI (lint / test / build) and branch protection gate them, and a
separate release PR later promotes `staging` → `main` (production). The stated principle is that
**nothing reaches `main` except via that release PR.**

Dependabot is enabled with three parts: dependency **alerts**, **security updates** (auto-PRs that
fix known vulnerabilities), and **version updates** (scheduled bumps, configured in
`.github/dependabot.yml`). A Dependabot PR (#22) opened against `main`, which exposed a conflict:
GitHub's **default branch** silently controls where automation targets, and the repo's default was
`main`.

The key constraint, verified against GitHub's own docs: **Dependabot security-update PRs always
target the repository's default branch and cannot be redirected by configuration.** The
`target-branch` option redirects *version* updates only, and setting it also removes that
ecosystem's config from security updates. So while `main` was the default, security PRs would keep
landing on `main` first — directly breaking the "nothing reaches `main` first" principle — and the
only workaround (disabling or ignoring them) would cost us timely vulnerability fixes.

We needed to decide **which branch is the repo's default**, because that single setting is what
determines where Dependabot (and new PRs generally) are aimed.

## Options
- **Make `staging` the default branch (chosen).**
  - Good: it is the **only** supported way to route Dependabot *security* PRs to `staging` instead
    of `main` (they follow the default branch and nothing else). Version updates then also target
    `staging` by default, so `dependabot.yml` needs no `target-branch`. New feature PRs auto-target
    `staging` — the branch we always want — removing the class of mistake that produced PR #22.
    Every dependency change flows through CI + branch protection + the release PR, honoring the
    principle with no loss of security coverage.
  - Bad: the default branch also sets the **default PR base**, so the release PR (`staging` → `main`)
    must now pass `--base main` explicitly (already required by our global workflow rules). New
    clones check out `staging` and the repo landing page shows `staging` rather than `main` —
    a departure from the common `main`-as-default convention.
- **Keep `main` as the default + `target-branch: staging` for version updates.**
  - Good: matches the conventional `main`-as-default mental model; smaller change.
  - Bad: **security** PRs still land on `main` (they can't be redirected), so dependencies arrive
    split across two branches and the "nothing reaches `main` first" principle is formally broken.
    A workaround that papers over the real mismatch.
- **Collapse to trunk-based (single `main`, no `staging` branch, Vercel preview environments).**
  - Good: the most current best practice for a solo Vercel app; eliminates the default-branch
    question entirely.
  - Bad: a much larger rearchitecture mid-build, discarding the release-gate flow we are
    deliberately using (and learning from). Out of scope for this decision; noted for a future
    project.

## Decision
1. Set the repository's **default branch to `staging`**.
2. Rewrite `.github/dependabot.yml` to **drop `target-branch`** (the default branch now routes both
   security and version PRs to `staging`), and to **add the `github-actions` ecosystem** (so the
   CI workflow's pinned actions are kept current) and **grouping** (batch minor/patch bumps into one
   PR; majors remain individual). These two changes — default-branch switch and the config edit —
   must ship in that order, because removing `target-branch` while `main` is still the default would
   send version PRs to `main`.
3. Keep Dependabot **alerts and security updates enabled** (already on); they are the other half of
   a complete setup and are unaffected by the config file.
4. Pin Vercel's **Production Branch to `main`** (Settings → Git / Branch Tracking) so production
   keeps deploying from `main`. Vercel's production branch is a stored per-project setting and does
   not follow GitHub's default branch, so the switch does not move production — pinning it removes
   any doubt (verified: it reads `main`).
5. Open the **release PR with `--base main`** explicitly from now on, since the default base is now
   `staging`.

## Consequences
Every dependency change — security and version alike — now lands on `staging`, flows through CI and
branch protection, and reaches `main` only through the release PR, so the "nothing reaches `main`
first" principle holds without sacrificing timely security fixes. New PRs default to the correct
base (`staging`), so the PR #22 mistake can't recur. The costs are small and known: the release PR
must name `--base main`, and the repo presents `staging` as its default view/clone target instead of
`main`, a conscious departure from the `main`-as-default convention that is the consistent choice for
a staging-first flow. This is additive to ADR-0016 (CI/DevOps & branch protection); it does not
change that decision, it resolves an automation detail left open by it. If this project ever moves to
a trunk-based model, this ADR would be superseded by that decision.
