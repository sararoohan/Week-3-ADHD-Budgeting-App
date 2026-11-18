# Non-functional Requirements — ADHD Budgeting App (MVP #1)

Source: the Requirements spec — Non-functional Requirements.

The 11 NFRs are how well the app must work: each is grouped by the ISO/IEC 25010:2023
quality model, with a measurable target and a way to check it. They're numbered in priority
order — privacy and accuracy first, since trust is the app's key differentiator. The technical tasks
T-1…T-14 (see the Epics doc) are the work that makes them true. These are built first
(Build Plan, Phase 0), because they shape the architecture and tool choices. Every NFR
is carried per-ticket by the shared Definition of Done (docs/definition-of-done.md),
not repeated on each card.

### NFR-1 — Privacy and data ownership  (Security)
Each user can read and change only their own data. Collect only what the functional
tasks need; no ADHD or health data. Never sold or shared for advertising. Closing an
account deletes the sign-in record and all of that user's data — including error
records and reminder history — in one action, immediately. Users can download their
money data as CSV.
- Checked by: automated test (a second user can't read the first's data); account-deletion test; privacy notice reviewed before launch.
- Related: ADR-0012 (RLS on every table), ADR-0004 (Supabase). Source task: T-4.1, T-7, T-3.3.1.

### NFR-2 — Secure accounts and secure coding  (Security)
Google sign-in asking only for email and name; no stored passwords. Sessions expire
and refresh securely; users can sign out of all devices. Optional passkey only if ready
by Phase 3. Secrets live on the server only. HTTPS with secure headers; input validated
on the server; user content shown as text; no personal or financial data in URLs.
Supabase's default sign-in / token rate limits stay on.
- Checked by: end-to-end test (sign up, sign in, sign out of all devices, delete account); no secrets in the repo.
- Related: ADR-0008 (Google sign-in), ADR-0006 (secrets in env vars). Source task: T-3, T-6, T-1.2.2, T-2.1.2.

### NFR-3 — Accurate money logic  (Functional Suitability)
Safe-to-spend and bill due dates are correct in 100% of the money test cases (bills due
before payday, money not yet arrived, month-ends, schedule changes). Amounts stored
without rounding error; dates land on the right day in the user's time zone. When an
amount is uncertain, the app says so rather than guessing. A wrong amount or date can be
reported in one step.
- Checked by: unit tests on every pull request; Phase 1 gate = all money test cases pass.
- Related: ADR-0009 (whole cents), ADR-0010 (calculate, never store), ADR-0011 (pure money module), ADR-0013 (safe-to-spend formula). Source task: T-8.1, T-8.2.1, T-4.2, T-12.1.1.

### NFR-4 — Reliable reminders  (Reliability)
Each reminder is sent within 15 minutes of the chosen time, in the user's time zone, by
email and in the app's reminder list. Each names the bill and its due date, never
balances. A failed send is retried on the next two runs, then recorded as failed. Users
can pause, change or stop reminders in one step.
- Checked by: a test reminder email arrives (Phase 0 gate); failed sends show in the error records.
- Related: ADR-0015 (reminder delivery). Source task: T-5.

### NFR-5 — Speed  (Performance Efficiency)
Core Web Vitals "good" at the 75th percentile on phones and desktop (largest content
≤ 2.5 s, interaction response ≤ 0.2 s, layout shift ≤ 0.1). Saving an entry is confirmed,
and safe-to-spend updates, within 1 second; any longer wait shows the app is working.
Check-ins under 2 minutes (an Assumption to test after launch).
- Checked by: Lighthouse CI (phone settings) on every pull request; real-user data from Vercel Speed Insights.
- Source task: T-10.1.

### NFR-6 — Graceful failure  (Reliability)
Every error message says what happened in plain, blame-free words, gives a next step, and
loses nothing the user entered; progress saves automatically. No uptime percentage is
promised in MVP #1 — when something is down the app says so, and a paused Supabase project
is restored from the dashboard. No automatic backups (free plan); the schema and test data
can be rebuilt from the repo.
- Checked by: failed-save tests; the Supabase pause-warning email is watched.
- Source task: T-10.2, T-9.2.2, T-4.3.1.

### NFR-7 — Accessible and easy on attention and memory  (Interaction Capability)
Meets WCAG 2.2 AA. Sign-in needs no memory test. One main task per screen, clear headings,
plain language. No flashing or moving elements that can't be paused, and few alerts.
Usability tests with adults with ADHD are an Assumption to test after launch.
- Checked by: automated accessibility checks (axe) on every pull request; a manual accessibility pass before release.
- Related: docs/design-guidelines.md. Source task: T-9.

### NFR-8 — Works where users are  (Compatibility)
Works on current Chrome, Safari, Firefox and Edge, and from small phone screens up with no
sideways scrolling.
- Checked by: cross-browser and width checks before release (method in Quality Engineering).
- Source task: T-11.

### NFR-9 — Maintainable and safely delivered  (Maintainability)
Changes reach main only through pull requests that pass every automated check, and Sara
reads each one. A bad release can be rolled back. Money calculations live in one place.
Vulnerable dependencies are flagged and fixed through pull requests. A new developer can
run the app from the repo's setup instructions.
- Checked by: protected main with required checks; Dependabot; type check on every pull request.
- Related: ADR-0007 (TypeScript), ADR-0011 (one money module). Source task: T-1, T-2, T-6.3, T-12.

### NFR-10 — Honest and legal  (product trust)
Plain-language terms, a privacy notice and a "not financial advice" statement are available
before sign-up and reviewed before launch. The app is free in MVP #1 and says so. No cash
advances or buy-now-pay-later. Testers are told to use made-up numbers.
- Checked by: review before launch (Phase 3 gate).
- Source task: T-13, T-8.3, 8.1.1, 8.1.2.

### NFR-11 — Privacy-safe measurement  (Security)
Error records hold only time, type and screen — never amounts or personal details — and are
deleted after 30 days. KPIs are counted from the app's own data; no financial or ADHD-related
data goes to third parties. Real-user speed data is anonymous. Optional self-report check-ins
are stored separately from budget data.
- Checked by: error-record fields reviewed; automatic 30-day deletion tested.
- Source task: T-14.