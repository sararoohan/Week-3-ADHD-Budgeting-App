# ADR-0001: Record architecture decisions as ADRs

## Date and status
2026-11-13. Accepted

## Context
This app is built by one person (the architect) directing an AI coding agent (the developer), on a short timeline, reusing decisions already made during the Week 2 product specs. Those decisions need to live where they are discoverable from the code — so the reasoning survives, nothing is silently lost, and the AI agent stays consistent with them across many sessions.

## Options
- **Numbered ADR files in the repo (chosen)**
  - Good: live next to the code; versioned with git; the agent can be told to read them; a clear, honest trail of *what* and *why*.
  - Bad: a few minutes of writing per decision.
- **Keep decisions only in Notion / Claude Docs**
  - Good: already where the specs live.
  - Bad: not in the repo, so the coding agent and future readers of the code don't see them; easy to drift from the code.
- **Keep no formal record**
  - Good: nothing to maintain.
  - Bad: reasoning is lost; the agent re-litigates or contradicts past choices.

## Decision
Record each significant, hard-to-reverse decision as a numbered ADR in `docs/adr`, using the course's ADR template. `CLAUDE.md` tells the coding agent to read every ADR before changing code and to write a new ADR for every big choice. Decisions are never erased; a changed decision is captured in a new ADR that supersedes the old one.

## Consequences
Every big choice costs a few minutes to record. In return, decisions are discoverable in the repo, the coding agent stays consistent, and the reasoning is preserved. Decisions already made in the Week 2 specs are backfilled here as ADRs.
