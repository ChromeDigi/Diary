# Phase 6: Guilt-free motivation

**Status:** Done (2026-10-23)

## Goal
Make checking in rewarding for an ADHD brain, without guilt: celebrate what I did,
never punish what I missed.

## Rules
- **Totals only.** Count check-in days (days with at least one rating). No streaks,
  no "streak lost", no red for missed days.
- Everything is computed from existing data (no new entry fields). Deleting entries can
  lower totals, which is fine.
- Optional: a **Celebrations** on/off switch (`prefs.fun`, default on). Calm mode or
  reduced motion: no confetti or bounce, just a quiet toast.

## Celebrate
- When a check-in becomes complete (mood + 3 ratings), after a tap: confetti burst,
  a random sticker pops up, and a toast "Check-in done! ⭐ N check-in days". If a badge
  unlocks, the toast says so.

## Badges (3D coins; locked ones greyed with a hint)
- Check-in days: 1, 3, 7, 14, 30, 50, 100.
- Theme explorer: 5 different themes used.
- Speaking up: first bring-to-therapy item ticked as discussed.
- Week reviewed: report notes or session notes written for a week.

## Unlockable color palettes
- Aurora (default), Sunset (3 days), Ocean (7), Forest (14), Galaxy (30).
- Picked in the Rewards view; saved as `prefs.palette`; applied via `data-palette` on `<html>`.

## Daily prompt
- A "💡 Today's prompt" card in the editor, picked by the entry's date from a list;
  "Shuffle" shows another; "Use it" fills an empty title and focuses the text.

## UI
- Sidebar: "⭐ N check-in days · B badges" opens the Rewards view (like the report).
- New `rewards.js` (loaded last). `app.js` fires `diary:changed` on save,
  `diary:checkin-done` when a tap completes a check-in, `diary:entry-opened` on open.

## Test plan
- Totals count days, not entries; badges/palettes unlock at thresholds.
- Completing a check-in by tap celebrates once; reopening a done entry doesn't.
- Celebrations off / calm mode: no confetti, toast only.
- Palette persists after reload; locked palettes can't be picked.
- Daily prompt: stable per date, shuffle, use it.
- Phone 375px dark + light; no console errors.

## Verified (browser, 2026-10-23)
- Totals count days with a rating (2 entries on one day = 1; unrated entry = 0)
- Completing a check-in by tap: confetti + sticker + "Check-in done! ⭐ N" toast, then "New badge" toast after save
- No second celebration for the same entry; reopening a done entry doesn't celebrate
- Celebrations off: no confetti, toast still shows; setting saved
- Badges and palettes unlock at thresholds; locked palette can't be picked; Sunset applies accent + glows
- Daily prompt shows, shuffles, "Use it" fills empty title and focuses text
- Desktop dark, phone light: no horizontal scroll; no console errors

## Not verified
- Calm mode / reduced motion path (same `quiet()` check as Celebrations off); palette after reload; real phone; Safari
