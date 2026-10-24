# Decisions

- **Plain HTML/CSS/JS, no build step.** Simple to run, host and change.
- **Entries in localStorage only.** The repo is public, so entries must never touch it. Trade-off: no sync between devices; JSON export/import covers backups.
- **Hosted on GitHub Pages** (https://chromedigi.github.io/Diary/) from `main` / root. Every push deploys.
- **Commits use the GitHub no-reply email** to keep the personal email private.
- **Remotion lives in `video/`, not the app.** The owner asked for Remotion (React video framework). It has its own `package.json` and gitignored `node_modules/`, so the diary app at the root stays dependency-free and no-build. GitHub Pages also serves `video/` source files; harmless, nothing personal in it. Remotion is free for individuals and companies up to 3 people; bigger needs a company license.
