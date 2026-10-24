# Phase 12: Daily Health + work-calendar import (iPhone Shortcut)

**Status:** Done (2026-10-24)

## Goal
Stop typing sleep and activity by hand. One tap each morning brings last night's sleep,
the last days' activity and the coming week's work calendar into the diary.

## Why a Shortcut
A web page can't read Apple Health or Calendar; only installed iPhone apps can.
Apple's own **Shortcuts** app can, with permission (asked on first run; managed in
Settings → Privacy & Security → Health / Calendars → Shortcuts). Fitness-app data
(workouts, exercise minutes, rings) lives in Health, so Health covers it.

## Owner choices
- **Morning one-tap button** (home-screen shortcut), not an evening automation.
- Work calendar is in Apple's **Calendar app** (Shortcuts can read it).

## Flow
1. Tap "Diary check-in" on the home screen.
2. The shortcut reads: sleep samples (last 2 days), steps / exercise minutes / active
   energy grouped by day (last 2 days), workouts if available, and work-calendar events
   from today through 7 days ahead.
3. It builds plain text lines and opens
   `https://chromedigi.github.io/Diary/#health=<url-encoded text>`.
4. The diary reads the part after `#` (never sent to any server), saves it, removes it
   from the address bar, shows "Imported …", and opens today's check-in.
   If the diary is locked, the import waits until it's unlocked.

## Text format (one record per line, `|`-separated)
```
DIARY-HEALTH 1
SLEEP|2026-10-23T23:41|2026-10-24T01:10|Core
STEPS|2026-10-23|8421
EXERCISE|2026-10-23|34
ENERGY|2026-10-23|512
WORKOUT|2026-10-23T18:02|2026-10-23T18:55|Traditional Strength Training
EVENT|2026-10-24T09:00|2026-10-24T10:00|Team meeting
```
- Dates are local time (`yyyy-MM-dd'T'HH:mm`); a space instead of `T` also works.
- Numbers may carry units or thousands separators ("8,421", "34 min").
- EVENT: `start|end|title` (title optional; all-day detected from 00:00–00:00 times).

## Turning samples into data
- **Sleep night** = night of the evening it starts (samples starting before noon belong
  to the previous evening; 12:00–18:00 samples are treated as naps and skipped).
  Asleep samples (Asleep/Core/Deep/REM) are merged so overlapping Watch + iPhone data
  isn't double-counted. Bedtime = first sleep start, wake = last sleep end,
  awake = merged Awake time inside that span. Sleep Score isn't imported (keep typing it).
- **Manual wins:** a night I typed or edited keeps my values; Health only fills empty
  fields there. Health-filled nights are marked "from Health".
- **Activity** per day: latest import replaces that day (today's partial numbers are
  completed by the next morning's import).
- **Work calendar**: events for today … today + 7 replace what was stored for those days,
  so cancelled meetings disappear.

## Storage
- `diary.days.v1` = `{ "<date>": { steps, exerciseMin, activeKcal, workouts: [{start,end,type}],
  work: [{start,end,allDay,title}], updatedAt } }`.
- Sleep records gain `source: "health" | "manual"`.
- Included in the lock vault and backups (version 6).

## Setup guide
- In-app "📲 iPhone setup" page with the exact Shortcut steps, plus a paste box to import
  text by hand (fallback / testing). Same guide in `docs/iphone-shortcut.md`.

## Test plan
- Parser: sleep merge (overlaps, awake, naps, cross-midnight), activity numbers with
  units/commas, events incl. all-day and `|` in titles, bad lines ignored.
- Manual-wins rule; activity replace; calendar window replace.
- `#health=` link: imports, strips the hash, opens check-in; waits while locked.
- Backup v6 and lock keep `days`. Phone 375px; no console errors.
- Not testable here: the Shortcut itself on an iPhone (owner checks).

## Verified (browser, 2026-10-24, test payload via the real `#health=` link)
- Sleep: Watch stages + duplicate source merged, awake 15 min, nap (14:00) skipped → night of Oct 23: 23:41–06:55, 6h 59m asleep, "from Health"
- Manual wins: a typed night kept bedtime + score, Health filled only empty wake/asleep; a Health night edited by hand stayed mine on re-import
- Activity: "8,421", "1,203 steps", "34 min", "512.4 kcal" parsed; workout stored; re-import replaced the day's numbers
- Calendar: old event in the window cleared; title with "|" kept; all-day detected; bad line skipped and counted
- Link removed from the address bar; check-in opened for today; activity line shown; toast summary
- Locked: link cleared at once, import waited, applied after unlock; lock on/off keeps `days`; backup v6 includes days
- Paste box: empty/useless text refused with a message, valid text imported; "Last import" shown
- Phone 375px: no horizontal scroll; no console errors

## Not verified
- The Shortcut on a real iPhone (action names, sleep "Value" wording, Group By Day, Workouts type, URL length); Sleep Score access
