# Phase 8: Visual polish

**Status:** Done (2026-10-23)

## Goal
A slicker, more modern look with motion that feels alive. Chosen by owner from live
previews (`.claude/visuals.html`, git-ignored).

## Scope
- **Logo G · Holographic foil**: "My Diary" in iridescent foil letters with a slow shimmer;
  tilts toward the mouse. A deeper-colored foil in light mode so it stays readable.
- **Glowing animated border**: a rainbow ring flows around the check-in card and the
  selected entry.
- **Jelly orbs**: mood orbs and rating pills squish and send out a ripple when tapped.
- **Sliding entry cards**: entries slide in one by one on load, search and unlock (not
  on every autosave); a colored sheen sweeps across on hover.
- **Stars + count-up**: soft twinkling stars behind everything in dark mode; report and
  rewards numbers count up when the view opens or the week changes.
- Calm mode and reduced motion turn all of it off (static logo, still ring, no stars moving).
- New `fx.js` (after `app.js`) for the logo tilt, stars and count-up. No dependencies.

## Test plan
- Logo readable in dark + light; tilt on mouse; static in calm mode.
- Ring on check-in card + active entry; jelly + ripple on orb and pill taps.
- Entry list animates on load/search, not while typing.
- Stars only in dark mode; count-up shows the right final numbers.
- Calm mode: no animations. Phone 375px; no console errors.

## Verified (browser, 2026-10-23)
- Holographic logo animates; deeper foil in light mode; readable in both
- Rainbow ring on check-in card and selected entry; static in calm mode
- Orb tap adds jelly + ripple; entries slide in on load (4) and search (1), not on open or autosave
- Stars only in dark mode (60); calm mode: logo, ring, list animations all off
- Count-up logic: "3.8" and "4/7" count from 0 and end exact (checked with a timer stand-in; the test pane paused animation frames, in which case numbers simply show final values)
- Phone 375px: no horizontal scroll, header with 3 icons fits; no console errors

## Not verified
- Logo tilt by real mouse movement; count-up watched live; real phone; Safari
