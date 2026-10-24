# Handoff

**Goal:** Choose and plan Phase 2 of the Diary app.

## Status
- Phase 1 (MVP) is done and live: https://chromedigi.github.io/Diary/
- Repo: ChromeDigi/Diary (public), branch `main`; every push deploys to Pages.
- Rules are in place: project `CLAUDE.md` plus the user-wide `~/.claude/CLAUDE.md`.

## Done so far
- Git and the GitHub CLI installed; signed in as ChromeDigi
- App built: entries, moods, autosave, search, export/import, dark mode, phone layout
- Docs: [plan.md](plan.md), [decisions.md](decisions.md), [phases/1-mvp.md](phases/1-mvp.md)

## Next steps
1. Test what Phase 1 left unverified: export/import, delete, phone layout, dark mode.
2. Ask the owner which backlog item becomes Phase 2 (clickable choice, with a
   recommendation): passcode lock, sync, tags or calendar view.
3. Write `docs/phases/2-<name>.md`, then implement it.

## Key files
`index.html`, `styles.css`, `app.js`, `CLAUDE.md`, `docs/`

## Notes
- Local preview: `powershell -File .claude\serve.ps1` serves http://localhost:8123 (`.claude/` is git-ignored).
- No Python or Node on this PC.
