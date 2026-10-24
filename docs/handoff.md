# Handoff

**Goal:** Build the weekly-therapy-update diary, phase by phase. Next: Phase 2, visual redesign.

## Status
- Phase 1 (MVP) done, live, tested: https://chromedigi.github.io/Diary/
- Roadmap rewritten for the new purpose: [plan.md](plan.md). Order chosen by owner (design first).
- Prompts for each phase: [prompts.md](prompts.md).
- Repo: ChromeDigi/Diary (public), branch `main`; every push deploys to Pages.

## Done so far
- Phase 1 gaps tested: [phases/1-mvp.md](phases/1-mvp.md)
- Tags plan superseded → theme chips in Phase 3 ([phases/2-tags.md](phases/2-tags.md))
- Decisions logged: [decisions.md](decisions.md)

## Next steps
1. Run prompt 2 from [prompts.md](prompts.md): show 2–3 style directions as clickable choices.
2. Write `docs/phases/2-redesign.md`, build, verify with screenshots (phone + dark + calm mode).

## Key files
`styles.css`, `index.html`, `app.js`, `docs/plan.md`, `docs/prompts.md`

## Open questions
- None.

## Notes
- Same chat across phases; hand off only at ~60% context (see `CLAUDE.md`).
- Local preview: `powershell -File .claude\serve.ps1` → http://localhost:8123. If port 8123 is in use, it's already running; open the URL.
- No Python or Node on this PC.
