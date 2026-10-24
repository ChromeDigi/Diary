# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**My Diary**: a private, single-page diary web app. Plain HTML, CSS and JavaScript
with no framework, dependencies or build step.

- `index.html`: page structure (sidebar entry list + editor)
- `styles.css`: styling; colors are CSS variables on `:root`, with a dark theme under
  `prefers-color-scheme: dark`; the phone layout is at `max-width: 720px`
- `app.js`: all logic (storage, rendering, autosave, search, export/import)

## How it works

- Entries live only in the browser's `localStorage` under the key `diary.entries.v1`.
  Each entry is `{ id, date (YYYY-MM-DD), title, body, mood, updatedAt }`.
- If the entry shape changes, bump the key version and migrate old data, so existing
  diaries are never lost.
- Typing autosaves with a 400 ms debounce (`touch()` → `persist()`).
- Backups are exported and imported as JSON. Import only adds entries whose `id` is new.

## Running

Open `index.html` in a browser, or serve the folder with any static server.
Nothing needs installing.

## Working style

### Communication
- Report extremely concisely. Sacrifice grammar for concision.
- Ambiguous request → ask ONE clarifying question before doing anything.
- Evidence before confidence: claim something works/is done only after verifying it
  (ran it, tested it, read the output). Say what was not verified.

### Run it like an engineering team
- Project knowledge lives in docs, not chat history. Docs go in `docs/`:
  - `docs/plan.md`: roadmap, split into phases
  - `docs/decisions.md`: key decisions + why
  - `docs/phases/<n>-<name>.md`: spec + status for each phase
- Workflow per phase (or one group of related changes):
  1. **Plan**: write/update the phase doc first.
  2. **Execute**: read the docs + relevant code, then implement only that phase.
  3. **Review + test**: check the diff, run the app, verify.
  4. **Wrap up**: update the docs (status, decisions, what's next), commit, push,
     give a short final review.
- One session = one phase. When it's done, the session is done; the next phase starts
  in a fresh session that reads the docs.
- Continue in the same session only for closely related concurrent work while the
  context is fresh. Don't resume a long, old session hours later; start fresh from the docs.

### Efficiency
- Read only the files needed; no broad re-reading of the codebase.
- Don't repeat known context back to the user.
- Prefer small, focused changes and commits.

## Rules

- **The GitHub repo (ChromeDigi/Diary) is public.** Never commit real diary content,
  backups (`diary-backup-*.json`) or personal data.
- Keep it dependency-free: no npm packages, bundlers or CDNs unless the owner asks.
- Insert user text with `textContent`, never `innerHTML`, to avoid XSS.
- Keep the layout usable at phone width.
- Commit identity uses the GitHub no-reply email; don't change it to a personal address.
