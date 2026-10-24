# Phase 3: Quick daily check-in

**Status:** Done (2026-10-23)

## Goal
A check-in you can finish in under 30 seconds that gives the weekly report (Phase 4)
real numbers. It replaces the tags plan ([2-tags.md](2-tags.md)) with theme chips.

## Owner decisions
- Ratings use **tap scales 1–5** (skippable), not sliders.
- Mood becomes a **1–5 scale** shown as 5 orbs, replacing the 6 emoji moods.

## Entry shape (v2)
`{ id, date, title, body, mood, energy, anxiety, sleep, themes, oneLiner, updatedAt }`
- `mood`, `energy`, `anxiety`, `sleep`: 1–5 or `null` (skipped).
- `themes`: unique lowercase strings. `oneLiner`: string ("Biggest thing today").

## Storage + migration
- New key `diary.entries.v2`. On load, if v2 is missing and v1 exists, convert v1
  into v2. **v1 stays untouched** as a safety net.
- Emoji → mood: 😄→5, 🙂→4, 😐→3, 😔→2, 😢→1, 😡→1, none→`null`.
- Import accepts v1 and v2 backups (same normalizer); still adds only new `id`s.

## UI
- Sidebar primary button **"+ Check in"**: opens today's entry, or creates it. A small
  "New entry" button stays for extra entries.
- Editor top: **Check-in card**
  - Mood: 5 glossy orbs (Awful, Low, Okay, Good, Great).
  - Energy, Anxiety, Sleep: a row of 5 colored 3D pills each. Tap again to clear.
    Anxiety colors run the other way (1 calm = green, 5 = red).
  - Theme chips: defaults `work, family, friends, sensory overload, health, win` plus
    every theme already used; "+ add" makes a new one.
  - One-liner input: "Biggest thing today".
  - A "Check-in done ✓" badge once mood + all 3 ratings are set.
- Below: title + free text, as before.
- List rows: mood-color glow, up to 3 theme chips, one-liner as the snippet when set.
- Search also matches themes and the one-liner.
- Everything keyboard-reachable; big tap targets (≥ 40px); calm mode respected.

## Out of scope
Charts and weekly report (Phase 4), streaks/rewards (Phase 6), deleting default themes.

## Test plan
- Seed v1 data → reload → v2 created, moods mapped, v1 unchanged.
- Check in: rate, clear a rating, add/remove themes, add a custom theme, one-liner;
  all autosave and survive reload.
- "+ Check in" twice on one day opens the same entry.
- Search by theme and one-liner.
- Export → import round trip; v1 backup imports converted.
- Theme text like `<img src=x onerror=alert(1)>` shows as text.
- Phone 375px dark + light: no horizontal scroll; no console errors.

## Verified (browser, 2026-10-23)
- v1 → v2 migration: moods mapped (😄→5, 😡→1, none→null), v1 left unchanged; v2 reloads without re-migrating
- Check-in: mood orbs, 3 tap scales, clear by re-tap, done badge on/off, default + custom themes (lowercased, deduped), one-liner; all autosave and survive reload
- "+ Check in" twice on one day opens the same entry; focus lands on the mood orbs
- Search by theme and one-liner; list shows mood label, glow, up to 3 chips
- Import v1 + v2 backups (normalized, duplicate ids skipped); XSS theme shows as text
- 1200px light + 375px dark: no horizontal scroll; no console errors

## Not verified
- Real phone; keyboard-only walkthrough; Safari
