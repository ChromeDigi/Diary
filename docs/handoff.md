# Handoff

**Goal:** Build the weekly-therapy-update diary, phase by phase. Next: Phase 6, guilt-free motivation.

## Status
- Live: https://chromedigi.github.io/Diary/ (repo ChromeDigi/Diary, public; every push to `main` deploys)
- Done: Phase 1 MVP, 2 3D redesign, 3 daily check-in (storage v2), 4 weekly report,
  5 bring-to-therapy list + session notes + goal (backup v3). See [plan.md](plan.md) and `phases/`.
- Prompts for each phase: [prompts.md](prompts.md). Decisions: [decisions.md](decisions.md).

## Next steps
1. Run prompt 6 from [prompts.md](prompts.md): write `docs/phases/6-motivation.md` first.
2. Totals, never streak loss; celebrate check-in completion (the "done" badge in
   `renderCheckin()` in `app.js` is the hook). Everything optional and off in calm mode.
3. Unlockable themes/badges: store progress in prefs or a new key; keep it out of entries.

## Key files
`app.js` (storage, check-in, prefs, backup), `report.js` (weekly report, 💬 list, goal),
`styles.css` (Aurora glass; print styles at the end), `index.html`, `CLAUDE.md`

## Open questions
- None.

## Notes
- Same chat across phases; hand off only at ~60% context (see `CLAUDE.md`).
- Local preview: `powershell -File .claude\serve.ps1` → http://localhost:8123. If port 8123 is in use, it's already running; open the URL.
- Testing: back up the `diary.*` localStorage keys first, seed test data, restore after.
- Edit JS with the Edit tool, not perl/sed: shell escaping breaks `$` and backticks.
- No Python or Node on this PC.
