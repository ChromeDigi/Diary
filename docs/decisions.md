# Decisions

- **Plain HTML/CSS/JS, no build step.** Simple to run, host and change.
- **Entries in localStorage only.** The repo is public, so entries must never touch it. Trade-off: no sync between devices; JSON export/import covers backups.
- **Hosted on GitHub Pages** (https://chromedigi.github.io/Diary/) from `main` / root. Every push deploys.
- **Commits use the GitHub no-reply email** to keep the personal email private.
- **Phase 2 = entry tags** (owner, 2026-10-23): small, no deps, fits localStorage; storage moves to `diary.entries.v2` with v1 kept as a safety net.
