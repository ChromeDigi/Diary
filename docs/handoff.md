# Handoff

**Goal:** Build the weekly-therapy-update diary, phase by phase. Next: Phase 4, weekly therapist report.

## Status
- Phase 1 (MVP) done, live, tested: https://chromedigi.github.io/Diary/
- Phase 2 (3D Aurora glass redesign) done: [phases/2-redesign.md](phases/2-redesign.md).
- Phase 3 (daily check-in, storage v2) done: [phases/3-checkin.md](phases/3-checkin.md).
- Roadmap: [plan.md](plan.md) (design first, owner-chosen).
- Prompts for each phase: [prompts.md](prompts.md).
- Repo: ChromeDigi/Diary (public), branch `main`; every push deploys to Pages.

## Done so far
- Phase 1 gaps tested: [phases/1-mvp.md](phases/1-mvp.md)
- Tags plan superseded → theme chips in Phase 3 ([phases/2-tags.md](phases/2-tags.md))
- Decisions logged: [decisions.md](decisions.md)

## Next steps
1. Run prompt 4 from [prompts.md](prompts.md): write `docs/phases/4-report.md` first.
2. Data: per-day mood/energy/anxiety/sleep (1–5 or null; average if several entries a day), themes, one-liners.
3. Charts as hand-made inline SVG; print/PDF stylesheet; compare with last week.

## Key files
`app.js`, `styles.css`, `index.html`, `docs/prompts.md`; prototype `.claude/proto.html` (git-ignored)

## Open questions
- None.

## Notes
- Same chat across phases; hand off only at ~60% context (see `CLAUDE.md`).
- Local preview: `powershell -File .claude\serve.ps1` → http://localhost:8123. If port 8123 is in use, it's already running; open the URL.
- No Python or Node on this PC.
