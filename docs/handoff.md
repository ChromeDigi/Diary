# Handoff

**Goal:** Build the weekly-therapy-update diary, phase by phase. Next: Phase 5, bring-to-therapy list.

## Status
- Live: https://chromedigi.github.io/Diary/ (repo ChromeDigi/Diary, public; every push to `main` deploys)
- Done: Phase 1 MVP, 2 3D redesign, 3 daily check-in (storage v2), 4 weekly report.
  See [plan.md](plan.md) and `phases/`.
- Prompts for each phase: [prompts.md](prompts.md). Decisions: [decisions.md](decisions.md).

## Next steps
1. Run prompt 5 from [prompts.md](prompts.md): write `docs/phases/5-therapy-prep.md` first.
2. Fit it into the report: "Things I want to talk about" should pull from the new
   bring-to-therapy list (report notes live in `diary.reports.v1`, see `report.js`).
3. Items need ids, added/discussed dates; undiscussed items carry over. Include them
   in backups (backup format v2 in `app.js`; bump the version if the shape changes).

## Key files
`app.js` (storage, check-in, prefs, backup), `report.js` (weekly report),
`styles.css` (Aurora glass; print styles at the end), `index.html`, `CLAUDE.md`

## Open questions
- None.

## Notes
- Same chat across phases; hand off only at ~60% context (see `CLAUDE.md`).
- Local preview: `powershell -File .claude\serve.ps1` → http://localhost:8123. If port 8123 is in use, it's already running; open the URL.
- Testing: back up the `diary.*` localStorage keys first, seed test data, restore after.
- Edit JS with the Edit tool, not perl/sed: shell escaping breaks `$` and backticks.
- No Python or Node on this PC.
