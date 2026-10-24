# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**My Diary**: a private, single-page diary web app. Plain HTML, CSS and JavaScript
with no framework, dependencies or build step.

- `index.html`: page structure (sidebar entry list + editor + weekly report)
- `styles.css`: styling; colors are CSS variables on `:root`, with a dark theme under
  `prefers-color-scheme: dark` (or `data-theme`); phone layout at `max-width: 720px`;
  print styles for the report at the end
- `app.js`: core logic (storage, check-in, rendering, autosave, search, export/import, prefs)
- `lock.js`: optional passcode lock (Web Crypto PBKDF2 → AES-GCM; loaded right after `app.js`)
- `report.js`: weekly report, 💬 bring-to-therapy list, goal (loaded after `lock.js`,
  uses its globals; SVG charts)
- `fx.js`: logo tilt, starfield, number count-up (loaded after `lock.js`)
- `docx.js`: tiny ZIP + .docx writer, no libraries (loaded before `brief.js`)
- `brief.js`: Therapy Homework Brief, session to session (loaded after `report.js`;
  format + rules in `docs/brief-format.md`)
- `rewards.js`: totals, badges, palettes, confetti, daily prompt (loaded last; all
  derived from existing data). `app.js` fires `diary:changed`, `diary:checkin-done`,
  `diary:entry-opened`, `diary:imported` events that these files listen to.

## How it works

- Entries live only in the browser's `localStorage` under the key `diary.entries.v3`.
  Each entry is `{ id, date (YYYY-MM-DD), title, body, mood, energy, anxiety, sleep,
  themes, oneLiner, skills, skillsReview, keyEvent, meaning, updatedAt }`; ratings are
  1–5 or `null`. Older `diary.entries.v2`/`v1` data is migrated on first load and left
  untouched. UI prefs: `diary.prefs.v1`.
- Sleep per night: `diary.sleep.v1` = `{ "<night of>": { bedtime, wake, asleepMin,
  awakeMin, score, estimated, updatedAt } }`. Night of = the entry date − 1. Missing
  values stay `null`; never fill them in (see `docs/brief-format.md`).
- If the entry shape changes, bump the key version and migrate old data, so existing
  diaries are never lost.
- Typing autosaves with a 400 ms debounce (`touch()` → `persist()`).
- Weekly report notes: `diary.reports.v1` = `{ "<week start>": { wins, struggles, talk,
  sessionNotes, goal, updatedAt } }`; a `null` wins/struggles stays auto-filled.
- Bring-to-therapy items: `diary.talk.v1` = `[{ id, text, addedOn, discussedOn }]`.
- Therapy briefs: `diary.briefs.v1` = `{ sessions: [dates], notes: { "<session>": { start,
  subtitle, headline, focus, takeaway, updatedAt } } }`; `null` = auto-drafted from data.
- Lock on: entries, reports, talk items, sleep and briefs live only in `diary.vault.v1` (encrypted);
  the plain keys are removed. All saves go through `writeData()` in `app.js`, which
  refuses to write while locked. Never bypass it with a direct `localStorage.setItem`.
- Backups are JSON `{ format: "my-diary", version: 5, entries, reports, talkItems, sleep, briefs }`
  (v2–v4 and old plain arrays still import). Import only adds entries and items whose
  `id` is new, and report weeks / sleep nights / sessions not already present.
- Never commit real therapy content, names or the owner's brief PDFs: the repo is public.

## Running

Open `index.html` in a browser, or serve the folder with any static server.
Nothing needs installing.

## Working style

### Communication
- Report extremely concisely. Sacrifice grammar for concision.
- Ambiguous request → ask ONE clarifying question before doing anything.
- Multiple options → always present them as clickable multiple choice (AskUserQuestion
  tool), never a plain list. Put your recommendation first, marked "(Recommended)",
  and say why you recommend it.
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
- Keep working in the same session across phases. Don't start a new session just
  because a phase is done.
- Only when the chat feels heavy and context is at ~60%: ask (clickable choice) about a
  handoff, per the user-wide "Context handoff" rule. Never hand off automatically.
- Keep the docs current after each phase anyway, so any later session can pick up.
- Build prompts live in `docs/prompts.md`. When a phase is done, offer the next prompt
  as a clickable choice (AskUserQuestion), e.g. "Start prompt N (Recommended)".

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
