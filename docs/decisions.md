# Decisions

- **Plain HTML/CSS/JS, no build step.** Simple to run, host and change.
- **Entries in localStorage only.** The repo is public, so entries must never touch it. Trade-off: no sync between devices; JSON export/import covers backups.
- **Hosted on GitHub Pages** (https://chromedigi.github.io/Diary/) from `main` / root. Every push deploys.
- **Commits use the GitHub no-reply email** to keep the personal email private.
- **Phase 2 = entry tags** (owner, 2026-10-23): small, no deps, fits localStorage; storage moves to `diary.entries.v2` with v1 kept as a safety net.
- **New purpose: weekly therapy update** (owner, 2026-10-23). Roadmap rewritten around daily check-in → weekly report. Design-first order so every later screen is built once in the new style.
- **Tags folded into Phase 3 check-in as "theme chips"** (2026-10-23). `phases/2-tags.md` is superseded; reuse its migration + test ideas.
- **Charts are hand-made inline SVG** (2026-10-23), keeping the app dependency-free.
- **Aurora glass style + CSS 3D, no libraries** (owner, 2026-10-23, from a live prototype). Remotion ruled out for the UI (video tool, needs Node); could return later for recap videos. Calm mode + reduced motion turn all motion off.
- **UI prefs in `diary.prefs.v1`** (2026-10-23), separate from entries, so prefs never touch the entry schema.
- **Check-in = tap scales 1–5 + mood as 1–5 orbs** (owner, 2026-10-23). Skippable ratings keep weekly charts honest; numbers feed Phase 4. Storage → `diary.entries.v2`, v1 kept.
- **Report notes in `diary.reports.v1`, backup format v2 with reports** (2026-10-23). Notes auto-fill until edited, so the weekly update never starts from scratch. Report code in `report.js` to keep `app.js` readable.
- **Bring-to-therapy items in `diary.talk.v1`; session notes + goal stored with the week in `diary.reports.v1`; backup v3** (2026-10-23). A floating 💬 button makes adding one tap from anywhere.
