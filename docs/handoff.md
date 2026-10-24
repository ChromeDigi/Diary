# Handoff

**Goal:** Implement Phase 2 of the Diary app: entry tags.

## Status
- Phase 1 (MVP) done, live and fully tested: https://chromedigi.github.io/Diary/
- Phase 2 chosen by owner (tags) and planned: [phases/2-tags.md](phases/2-tags.md). Not started.
- Repo: ChromeDigi/Diary (public), branch `main`; every push deploys to Pages.

## Done so far
- Phase 1 gaps tested (export/import, delete, phone layout, dark mode): see [phases/1-mvp.md](phases/1-mvp.md)
- Phase 2 spec, storage migration (v1 → `diary.entries.v2`) and test plan written
- Decision logged in [decisions.md](decisions.md)

## Next steps
1. Read [phases/2-tags.md](phases/2-tags.md), then `app.js`, `index.html`, `styles.css`.
2. Implement tags + v2 migration per the spec.
3. Run the spec's test plan in the browser; update the phase doc status; commit, push.

## Key files
`app.js`, `index.html`, `styles.css`, `docs/phases/2-tags.md`

## Open questions
- None.

## Notes
- Local preview: `powershell -File .claude\serve.ps1` serves http://localhost:8123 (`.claude/` is git-ignored). If port 8123 is already in use, the server is likely already running; open the URL directly.
- No Python or Node on this PC.
