# ADR-0015: Reminder delivery — dedicated Gmail account, 5-minute Supabase Cron, retry then fail

## Date and status
2026-11-17. Accepted

## Context
Bill reminders are a core promise of the app (NFR-4: reliable reminders): a user who sets a reminder for a bill should get an email close to the time they chose, in their own time zone. Sign-in is Google OAuth (ADR-0008), so the app sends no sign-in emails — bill reminders are the *only* email it sends. MVP #1 has no domain of its own and no budget, which rules out the usual domain-verified email services, and Supabase is already the data and scheduled-jobs tier (ADR-0004). Three things need settling: what sends the email, what runs on a schedule to trigger it, and what happens when a send fails.

## Options
**Sending the email**
- **The app's own Gmail account over port 465 (chosen)**
  - Good: works with no domain (a transactional service like Resend can only send to the account owner's address until a domain is verified); free; a Gmail account sends real email to any tester's inbox; the app password is kept server-only (ADR-0006).
  - Bad: Google calls app passwords "not recommended" and revokes them when the account password changes; sent reminders pile up in the account's Sent folder (one reason testers use made-up data); Gmail's daily send limit caps volume (fine for a class project).
- **Resend (or another transactional email service)**
  - Good: purpose-built for transactional email; easy Supabase integration.
  - Bad: without a verified domain it can only email the account owner — useless for reaching testers; MVP #1 has no domain.

**Triggering on a schedule**
- **Supabase Cron every 5 minutes, calling an Edge Function (chosen)**
  - Good: can run as often as needed and is on the free plan; every 5 minutes keeps a reminder within ~5 minutes of the chosen time, inside the 15-minute target (NFR-4); lets users pick the time, not just the day.
  - Bad: UTC-only schedules (the function checks each user's time zone); no built-in delivery guarantee or automatic retry; stops if the free project pauses (ADR-0004).
- **Vercel's free scheduler**
  - Good: already hosting the app.
  - Bad: runs at most once a day at a fixed UTC hour, so every user's reminders would fire together and users couldn't choose a time — this breaks the feature.

## Decision
Send bill reminders from a dedicated Gmail account created only for the app, over SMTP on port 465, with 2-Step Verification and an app password kept on the server only (ADR-0006). Trigger sending with Supabase Cron running every 5 minutes, calling an Edge Function that finds the reminders due now (in each user's time zone) and sends them. On a failed send, retry on the next two runs of the 5-minute job; if the third try also fails, record it as failed in the error records (ADR-0018) and stop. Reminder emails carry only the recipient, the bill name and the due date — never a balance or amount.

## Consequences
Setup needs a Gmail account with 2-Step Verification and an app password, both stored as server-only environment variables (ADR-0006). Because Cron has no native retry, the function's own "picked up on the next run" logic is what satisfies the 15-minute target — and it must be idempotent so a reminder isn't sent twice. UTC-only scheduling means the function, not the schedule, resolves each user's local time. Reminder-send failures are a first-class error-record type (ADR-0018). If the free Supabase project pauses, reminders stop until it's restored (ADR-0016). A reminder-timing check (a test account receives a reminder within 15 minutes of its set time) is a Phase 0 gate and a pre-release check.
