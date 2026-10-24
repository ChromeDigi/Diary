# Handoff

**Goal:** Build the weekly-therapy-update diary, phase by phase. Next: Phase 7 (optional), passcode lock.

## Status
- Live: https://chromedigi.github.io/Diary/ (repo ChromeDigi/Diary, public; every push to `main` deploys)
- Done: Phase 1 MVP, 2 3D redesign, 3 daily check-in (storage v2), 4 weekly report,
  5 bring-to-therapy list + session notes + goal (backup v3), 6 guilt-free rewards
  (`rewards.js`). See [plan.md](plan.md) and `phases/`.
- Prompts for each phase: [prompts.md](prompts.md). Decisions: [decisions.md](decisions.md).

## Next steps
1. Run prompt 7 from [prompts.md](prompts.md): write `docs/phases/7-passcode.md` first.
2. Real encryption (Web Crypto: PBKDF2 → AES-GCM) of all `diary.*` data keys, not a
   cosmetic lock. Clear "forgotten passcode = lost data" warning; push export first.
3. Migration: encrypting existing data must be reversible (turn lock off → decrypt).

## Key files
`app.js` (storage, check-in, prefs, backup), `report.js` (weekly report, 💬 list, goal), `rewards.js`,
`styles.css` (Aurora glass; print styles at the end), `index.html`, `CLAUDE.md`

## Open questions
- None.

## Notes
- Same chat across phases; hand off only at ~60% context (see `CLAUDE.md`).
- Local preview: `powershell -File .claude\serve.ps1` → http://localhost:8123. If port 8123 is in use, it's already running; open the URL.
- Testing: back up the `diary.*` localStorage keys first, seed test data, restore after.
- Edit JS with the Edit tool, not perl/sed: shell escaping breaks `$` and backticks.
- No Python or Node on this PC.
