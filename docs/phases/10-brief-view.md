# Phase 10: Therapy Homework Brief view

**Status:** Done (2026-10-23)

## Goal
The app builds the brief described in [brief-format.md](../brief-format.md) from the
logged data, so each brief starts mostly done and I only edit the written parts.

## Periods (owner choice: session dates)
- I add therapy session dates. A brief covers **the day after the previous session
  through this session**. The first brief starts 13 days before its session; its start
  can be changed.
- Sleep rows = nights whose wake date falls in the period (night of = start − 1 … end − 1).

## Layout (a white "paper" page, same on screen and in print)
1. THERAPY HOMEWORK BRIEF + exact range + subtitle (editable; auto default).
2. Headline (editable; auto draft states only data: sleep average, short nights,
   check-in averages, number of key events. No interpretation.)
3. Dashboard: up to 4 cards, only when data exists: average sleep (+ range), short
   nights (< 6 h), mood average, anxiety average.
4. Sleep table: night of → wake, total, bedtime, wake, awake, score, note
   (est. / calc.). Short nights get a pale yellow row. Unlogged nights are counted, not invented.
5. Key events: date, what happened (one-liner or title), why it matters, skills that day.
6. Skills line: skills actually used (with counts) and days flagged "need review".
7. Therapy focus (editable; auto: open bring-to-therapy items + skills review + key events).
8. Overall takeaway (editable; starts empty).
9. Footnote: what is measured, estimated, calculated and self-rated.
- Editable parts are typed straight into the page. "Refill from data" resets auto parts.

## Look
Navy/steel-blue headings, pale blue cards, light table fills, pale yellow for notable,
clean sans-serif, white page in both themes. Print: only the page, about 2 pages;
the PDF file name becomes `Therapy_Homework_<Mon D>-<Mon D>_<YYYY>`.

## Storage
- `diary.briefs.v1` = `{ sessions: ["YYYY-MM-DD"…], notes: { "<session>": { start,
  subtitle, headline, focus, takeaway, updatedAt } } }`; `null` = auto.
- Included in the lock vault and backups (version 5).
- New `brief.js` (after `report.js`).

## Test plan
- Add/remove sessions; period math (previous session + 1 → session; first = −13 days).
- Cards appear only with data; averages, range and short nights correct.
- Sleep table: night-of mapping, est./calc. notes, unlogged count, short-night rows.
- Key events, skills counts, review days; focus auto-fill; edits save and survive reload.
- Print rules: only the page; file name. Backup v5 round trip; lock keeps briefs.
- Phone 375px, dark + light; no console errors; HTML in text shows as text.

## Verified (browser, 2026-10-23, seeded test data)
- Sessions: add, duplicate refused with message, picker labels with ranges; period = previous session + 1 → session (Oct 10–23); first session = −13 days (Sep 26–Oct 9); start override works and doesn't shift later periods
- Cards match hand math: avg 6h 21m, range 4h 50m–7h 50m, 2 of 5 short (1 estimated), mood 3.0, anxiety 3.2
- Sleep table: night-of → wake, calc./est. notes, short nights pale yellow, "9 nights not logged"
- Key events only from the period (earlier one excluded), skills + review lines, focus auto-fill (open bring-to-therapy item, review days, events); HTML in text shows as text
- Edits save; refill resets subtitle/headline/focus but keeps takeaway; print file name `Therapy_Homework_Oct10-Oct23_2026`, title restored after
- Backup v5 round trip; lock on removes plain briefs, lock off restores
- Print rules (applied on screen): only the page; desktop dark + phone light: no overflow; no console errors
- Fixed: short-night highlight overridden by row striping; "Note" column clashed with an existing `.note` style

## Not verified
- Real print dialog / PDF page count; real phone; Safari
