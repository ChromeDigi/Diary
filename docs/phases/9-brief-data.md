# Phase 9: Data for the therapy brief

**Status:** Done (2026-10-23)

## Goal
Capture what the Therapy Homework Brief ([brief-format.md](../brief-format.md)) needs,
quickly and honestly: sleep per night, skills actually used, and key events.

## Sleep (owner choice: quick manual entry)
- In the check-in card: "😴 Last night" for the night before the entry's date
  (night of = date − 1), e.g. "Night of Oct 22 → Oct 23".
- Fields: bedtime, wake time, time asleep (h + min), awake (min), Apple Sleep Score
  (0–100, optional), and an **Estimated** toggle. Empty fields stay empty.
- If time asleep is empty but bedtime + wake exist, the total is calculated
  (wake − bedtime − awake) and shown as "calculated".
- Stored per night in `diary.sleep.v1` = `{ "<night of>": { bedtime, wake, asleepMin,
  awakeMin, score, estimated, updatedAt } }`.

## Skills (honest by design)
- "Skills I actually used": DEAR MAN, GIVE, FAST, STOP, Distress tolerance,
  Emotion labeling, Boundaries, plus custom.
- A separate chip: "Didn't use skills, need review".
- Entry fields `skills: string[]`, `skillsReview: boolean`.

## Key events
- Toggle "⭐ Key event for therapy" + "Why it matters" text.
- Entry fields `keyEvent: boolean`, `meaning: string`.

## Storage
- Entry shape changes → `diary.entries.v3`; on load, migrate from v2 (or v1) if v3 is
  missing; older keys stay untouched (removed only when the lock turns on).
- Vault bundle and backups (version 4) include `sleep`. Import adds nights not present.

## Test plan
- v2 → v3 migration keeps everything; defaults for new fields.
- Sleep: enter, calculate, estimated flag, clear; persists; correct night-of date.
- Skills + review chip; key event + meaning; all autosave.
- Backup v4 round trip; v3 backup imports; lock on/off keeps sleep.
- Phone 375px; no console errors.

## Verified (browser, 2026-10-23)
- v2 → v3 migration: moods kept, new fields default (no skills, no key event); v2 left untouched
- Sleep: night-of label ("Night of Oct 22 → Oct 23"); bed 23:30 + wake 07:10 − 20 min awake = "7h 20m (calculated)"; entered 6h 50m overrides; estimated flag shown and saved; clearing all fields removes the night
- Each entry shows its own night; skills chips, custom skill, "need review" chip, key event + meaning all autosave
- Backup v4 includes sleep; import restores missing nights; lock on removes plain v2/v3/sleep keys, lock off restores them
- Desktop dark + phone 375px: no horizontal scroll; no console errors

## Not verified
- Real phone time pickers; Safari
