# Functional Requirements — ADHD Budgeting App (MVP #1)

Source: the Requirements spec — Functional Requirements. The detailed acceptance
criteria and BDD scenarios are **not** here — they live on the Notion Kanban cards (one
card per FR) and are fed to the build per feature. This file is the index.

MVP #1 has 40 functional requirements across FR-1 to FR-38, numbered in **epic order** so a
number never changes when the build order does (build order comes from the Build Plan and
each card's Phase). FR-15 and FR-32 are each split into a/b cards so each builds in one
sitting; FR-8 and FR-11 each cover two source tasks (one screen/setting delivers both, so
they're built and tested together). FR-33–FR-38 were added after the initial list and numbered
last (not in epic order) so existing FR numbers stay stable.

| ID | Requirement | Source task |
|----|-------------|-------------|
| FR-1 | Create an account and sign in with Google, no password to remember | 1.1.1 |
| FR-2 | Start budgeting without linking a bank | 1.1.2 |
| FR-3 | Get a working budget in one short first session | 1.2.1 |
| FR-4 | Record what they're paid and when | 1.2.2 |
| FR-5 | See one amount that's safe to spend until the next payday | 2.1.1 |
| FR-6 | See which bills are already counted in that amount | 2.1.2 |
| FR-7 | Plan only from money that has arrived | 2.1.3 |
| FR-8 | Check whether a purchase fits before buying | 2.2.1 + 5.1.1 |
| FR-9 | Enter repeating things once | 3.1.1 |
| FR-10 | Log a purchase in seconds | 3.1.2 |
| FR-11 | Budget stays safe when some spending isn't logged | 3.2.1 + 5.2.1 |
| FR-12 | See where money went this pay period without daily logging | 3.2.2 |
| FR-13 | See every bill and subscription in one list | 4.1.1 |
| FR-14 | See which bills are due before the next payday | 4.1.2 |
| FR-15a | Choose a reminder schedule for each bill | 4.1.3 |
| FR-15b | App sends each bill reminder and retries a failed send | 4.1.3 |
| FR-16 | See all bill reminders in the app | 4.1.4 |
| FR-17 | Money for upcoming bills is kept out of the spending amount | 4.2.1 |
| FR-18 | Calm early warning when a bill can't be covered | 4.2.2 |
| FR-19 | Set a purchase aside and decide later | 5.1.2 |
| FR-20 | An unplanned purchase that fits is shown as fitting the plan | 5.2.2 |
| FR-21 | Always see the one next step | 6.1.1 |
| FR-22 | Stop at any point and pick up later | 6.1.3 |
| FR-23 | Check in in under two minutes | 6.2.1 |
| FR-24 | See where they stand without facing everything at once | 6.2.2 |
| FR-25 | Overspending shown as something to fix, not a failure | 6.2.4 |
| FR-26 | Notice progress and small wins | 6.3.1 |
| FR-27 | Come back after time away without having to catch up | 7.1.1 |
| FR-28 | Restart their budget from today | 7.1.2 |
| FR-29 | Coming back, see the most urgent thing first | 7.2.1 |
| FR-30 | Know what the app costs and how to leave | 8.1.1 |
| FR-31 | Understand how their data is used | 8.1.3 |
| FR-32a | Close the account and delete all data | 8.1.4 |
| FR-32b | Download data as CSV files | 8.1.4 |
| FR-33 | Add a bill's due date to their own calendar *(Could)* | 4.1.5 |
| FR-34 | Edit a spending entry they got wrong | 3.1.4 |
| FR-35 | Delete a spending entry, with an undo | 3.1.4 |
| FR-36 | Record money that comes back — a refund *(see ADR-0014)* | 3.1.5 |
| FR-37 | Enter an opening balance at setup *(Must; see ADR-0013)* | 1.2.3 |
| FR-38 | Set an optional flexible-spending buffer *(Should)* | 5.2.1 |