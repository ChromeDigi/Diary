# Phase 2: 3D visual redesign

**Status:** Done (2026-10-23)

## Goal
A modern, colorful, fun look with real depth that keeps logging motivating, without
being overwhelming. Owner chose the "Aurora glass" style with CSS 3D (no libraries),
from a live prototype (`.claude/proto.html`, git-ignored).

## Scope
- Aurora background: soft drifting color glows; glass cards (blur, light border).
- Dark (navy) and light (pastel) themes. Default follows the system; a toggle overrides it.
- Mood picker as glossy 3D orbs, one color per mood (the emoji stays visible on the orb).
- Entry list: glass rows with a mood-color glow, a gentle 3D lift on hover.
- Opening an entry: the editor swings in with a short 3D animation.
- Calm mode toggle: stops all motion, glows and tilt, and softens saturation.
  `prefers-reduced-motion` does the same automatically.
- No tilt on the editor while typing (comfort).
- Prefs (theme, calm) saved in `localStorage` key `diary.prefs.v1`, separate from entries.
- Phone layout (`max-width: 720px`) keeps one pane at a time.

## Out of scope
- Charts, check-in sliders, theme chips (Phases 3–4).
- No entry data change: storage stays `diary.entries.v1`, mood stays an emoji.

## Test plan
- Existing entries load unchanged; create/edit/delete/search/export/import still work.
- Mood orbs select/deselect and autosave.
- Theme toggle and calm mode persist after reload.
- Reduced motion: no animations.
- Phone 375px + dark + light: no horizontal scroll, all controls reachable.
- No console errors.

## Verified (browser, 2026-10-23)
- Old v1 entries load unchanged; mood glow colors in list
- Edit autosave, mood orb select/deselect, new, delete, search, export, import
- Theme toggle + calm mode persist after reload; calm stops animations
- Editor swing-in animation; delete button stays inside the editor card on short screens (fixed)
- 1200px dark, 375px phone dark + light: no horizontal scroll; no console errors

## Not verified
- `prefers-reduced-motion` (CSS rule present, not emulated); real phone; Safari
