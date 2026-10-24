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

## Rules

- **The GitHub repo (ChromeDigi/Diary) is public.** Never commit real diary content,
  backups (`diary-backup-*.json`) or personal data.
- Keep it dependency-free: no npm packages, bundlers or CDNs unless the owner asks.
- Insert user text with `textContent`, never `innerHTML`, to avoid XSS.
- Keep the layout usable at phone width.
- Commit identity uses the GitHub no-reply email; don't change it to a personal address.
