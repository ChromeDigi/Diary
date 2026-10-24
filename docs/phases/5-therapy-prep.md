# Phase 5: Bring-to-therapy list, session notes, weekly goal

**Status:** Done (2026-10-23)

## Goal
Catch things to bring up the moment I think of them, see them in the weekly report,
tick them off after the session, and carry the rest over. Keep a goal for the week
in sight.

## Bring-to-therapy list
- A floating 💬 button (bottom right, every screen) opens a small "Bring to therapy…"
  box. Enter adds the item; a short "Added" toast confirms. Esc closes.
- Item: `{ id, text, addedOn (YYYY-MM-DD), discussedOn (date or null) }`.
- Stored in `diary.talk.v1` (array).
- The sidebar shows a count ("3 to bring up").

## In the weekly report
- "Bring to therapy" card replaces the old free-text "Things I want to talk about":
  - Shows items added by the week's end that are still open, or were discussed that week.
  - Items from earlier weeks get a "carried over" tag.
  - A checkbox marks an item discussed (today); unticking reopens it. × removes it.
  - An add box at the bottom.
  - Old `talk` text (if any) still shows as "Extra notes".
- "After the session" card: **Session notes** (textarea) and **Goal for next week**.
  Both saved in `diary.reports.v1` for that week (`sessionNotes`, `goal`).
- Prints cleanly: items as a ✓ / ○ list, notes as text.

## Goal on the home screen
- A goal card at the top of the sidebar shows the latest goal set (this week's, else
  the most recent earlier week's). Click opens the report. Hidden when no goal exists.

## Backup
- Format becomes `version: 3` with `talkItems`. Imports still accept v2 and plain
  arrays; items are added only if their `id` is new.

## Out of scope
Reminders/notifications, rewards (Phase 6).

## Test plan
- Quick add from the entry list, editor and report; toast; count updates.
- Report: open items show; discussed this week stay (ticked); discussed earlier
  weeks disappear; carried-over tag; tick/untick/remove persist after reload.
- Session notes + goal save per week; goal card shows latest goal and opens the report.
- Backup v3 round trip; v2 backup still imports.
- Item text with HTML shows as text. Print rules: list readable, no buttons.
- Phone 375px: FAB doesn't cover controls badly; no horizontal scroll; no console errors.

## Verified (browser, 2026-10-23)
- 💬 quick add from list and editor: opens focused, Enter adds + toast, Esc and outside click close; count updates
- Report list: open items, carried-over tag, discussed-this-week ticked, discussed-last-week hidden; tick/untick/remove/add persist
- Past week view shows items as they were then; old `talk` text shows as "Extra notes"
- Session notes + goal save per week; goal card shows latest goal (falls back to last week's)
- Backup v3 round trip restores items; v2 backup still imports; malformed items dropped; HTML in items shows as text
- Print rules: FAB, add box, × and goal input hidden; session notes + goal print as text
- Desktop dark, phone light: no horizontal scroll; fixed 💬 covering "Import backup" on phone; no console errors

## Not verified
- Real print/PDF; real phone; Safari
- Refill keeping session notes + goal (code changed to reset only wins/struggles; not re-run)
