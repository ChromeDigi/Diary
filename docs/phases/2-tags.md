# Phase 2: Entry tags

**Status:** Superseded (2026-10-23): folded into Phase 3 (daily check-in) as theme chips. Spec kept for reference.

## Goal
Tag entries (e.g. `work`, `travel`) and filter the list by tag.

## Scope
- Entry gets `tags: string[]` (lowercase, trimmed, unique, no empty).
- Editor: tag input under the title. Enter or comma adds a tag; each tag shows as a chip
  with a remove (×) button. Changes autosave via `touch()`.
- List: each entry shows its tags (small chips).
- Filter: tag bar above the list (all tags in use, sorted). Clicking a tag filters the
  list; click again to clear. Works together with text search.
- Search text also matches tags.
- Phone layout (`max-width: 720px`) and dark mode stay usable.

## Storage + migration
- New key `diary.entries.v2`; entry shape `{ id, date, title, body, mood, tags, updatedAt }`.
- On load: if v2 missing and v1 present, copy v1 entries with `tags: []` into v2.
  Keep v1 untouched (safety net) — never delete old data.
- Import: accept v1 and v2 backups; missing/invalid `tags` → `[]`; still add only new `id`s.

## Out of scope
- Renaming/merging tags globally, tag colors, tag autocomplete.

## Rules to keep
- Tag text inserted with `textContent` only (no `innerHTML`).
- No dependencies.

## Test plan
- Migration: seed v1 data → reload → entries present with `tags: []`, v1 still there.
- Add/remove tags, autosave persists after reload; duplicates/case collapse.
- Tag filter + text search combined; clearing filter.
- Export → import round trip keeps tags; v1 backup imports with `tags: []`.
- Tag like `<img src=x onerror=alert(1)>` renders as text.
- Phone width (375px) + dark mode: no horizontal scroll, chips readable.
