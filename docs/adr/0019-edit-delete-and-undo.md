# ADR-0019: How entries are edited and deleted, and how Undo works

## Date and status
2026-11-17. Accepted

## Context
MVP #1 lets a user edit a spending entry (FR-34) and delete one with an Undo (FR-35); the same edit, delete and Undo apply to every money entry — purchases, deposits (money in, ADR-0020), and money-back refunds. The specs describe the behavior ("a removal shows an Undo") but not the mechanism, and the mechanism carries architectural weight: it touches the data model, Row Level Security (ADR-0012), the "money stays exact" rule (ADR-0009), and the privacy promise that deleting data means it is really gone. A refund can be linked to the purchase it offsets (ADR-0014), so deleting a purchase has to decide what happens to that linked refund — or the balance goes wrong.

## Options
**Delete and Undo**
- **Hard delete + a transient, in-memory Undo (chosen)**
  - Good: no schema change; every query and RLS policy stays simple (no "is it deleted?" filter to add to ADR-0012); "deleted means gone" is literally true, so account deletion and the privacy promise stay clean; no purge job to run.
  - Bad: Undo only lasts while its prompt is on screen — leaving or refreshing ends it (this matches how a snackbar Undo is expected to behave).
- **Soft delete (a `deleted_at` tombstone) + restore**
  - Good: Undo survives a refresh or navigating away.
  - Bad: every query and every RLS policy must filter out deleted rows (more surface to get wrong, and it complicates ADR-0012); "deleted" rows linger until purged, muddying the privacy promise; needs a scheduled purge job — more than MVP #1 needs, for an Undo the requirement never asks to survive a refresh.

**Edit**
- **Overwrite in place (chosen)**
  - Good: simplest; FR-34 only asks that an edit be reflected in safe-to-spend within 1 second; no audit trail to store.
  - Bad: no record of what an entry used to be (not needed for MVP #1).
- **Keep an edit history / audit trail**
  - Good: a full change history.
  - Bad: more schema and storage for a feature MVP #1 does not require.

## Decision
- **Delete is a hard delete.** The row is removed from the database immediately, and safe-to-spend recalculates to match.
- **Undo is transient and in-memory.** When an entry is deleted the app keeps a copy in memory and shows an Undo prompt; choosing Undo calls a server action that re-inserts the entry **with its original id**, re-validated as the signed-in user's (never trusting a user id sent from the browser — ADR-0011; RLS sets ownership from the session — ADR-0012). Preserving the original id matters because a refund can reference a purchase by id (ADR-0014). The Undo window is the lifetime of its prompt; leaving the screen ends it.
- **Deleting a purchase that has linked refunds warns, then removes the purchase and every refund linked to it together** (`ON DELETE CASCADE` for the data, with a warning shown before it fires). A single Undo restores the whole set. This keeps the balance correct: a purchase and its refund(s) net out together, so removing the purchase alone would leave the refund's "money back" inflating available funds (ADR-0013). A refund with no link (a standalone money-back entry) is untouched.
- **Edit overwrites the entry in place.** No history and no separate "undo edit" — FR-34 only requires the edit to be reflected in safe-to-spend.
- **Recurring entries follow FR-9.** For a repeating deposit (money in), bill or spending entry, editing or deleting first asks "just this one, or all future ones?" (FR-9); the same hard delete and in-memory Undo then apply to the chosen occurrence or the whole series.

## Consequences
Queries and RLS stay simple, and "deleted means gone" holds, which keeps account deletion and the privacy story clean and compatible with monitoring (ADR-0018 keeps no analytics copy of deleted rows). The Undo server action must re-insert idempotently and preserve the original id, created-at and amount, so links and ordering survive. Because a purchase delete can cascade, the delete operation caches the purchase and its linked refunds together, and Undo restores all of them. The warning before a cascading delete is part of the blame-free, nothing-lost-by-surprise experience (NFR-6). If a future version needs durable (cross-session) undo or an edit history, that is a new ADR that supersedes this one.
