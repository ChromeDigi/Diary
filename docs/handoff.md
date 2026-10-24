# Handoff

**Goal:** Weekly-therapy-update diary. Phases 1–8 done (8 = visual polish); next is real-use feedback or new ideas.

## Status
- Live: https://chromedigi.github.io/Diary/ (repo ChromeDigi/Diary, public; every push to `main` deploys)
- Done: 1 MVP, 2 3D redesign, 3 daily check-in, 4 weekly report, 5 bring-to-therapy
  list + session notes + goal, 6 guilt-free rewards, 7 optional passcode lock, 8 visual polish (`fx.js`).
  See [plan.md](plan.md), `phases/`, [decisions.md](decisions.md).

## Next steps (owner to choose)
1. Real-device check: phone + Safari, and a real print/PDF of the weekly report.
2. Gaps listed under "Not verified" in each phase doc (e.g. calm-mode celebrations,
   refill keeping session notes, palette after reload).
3. Backlog in [plan.md](plan.md): calendar month mood grid, sync (needs a server).

## Key files
`app.js` (storage, `writeData()`, check-in, prefs, backup), `lock.js` (encryption),
`report.js` (weekly report, 💬 list, goal), `rewards.js`, `styles.css`, `index.html`, `CLAUDE.md`

## Open questions
- None.

## Notes
- Same chat across phases; hand off only at ~60% context (see `CLAUDE.md`).
- Local preview: `powershell -File .claude\serve.ps1` → http://localhost:8123. If port 8123 is in use, it's already running; open the URL.
- Testing: back up the `diary.*` localStorage keys first (incl. `diary.vault.v1`), seed test data, restore after.
- Edit JS with the Edit tool, not perl/sed: shell escaping breaks `$` and backticks.
- No Python or Node on this PC.
