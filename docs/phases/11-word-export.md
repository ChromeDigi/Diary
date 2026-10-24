# Phase 11: Word (.docx) export

**Status:** Done (2026-10-23)

## Goal
An editable Word copy of the brief next to the PDF, as in the usual workflow
([brief-format.md](../brief-format.md)). Owner choice: a real .docx, still no libraries.

## How
- "Download Word" button in the brief view → `Therapy_Homework_<range>.docx`.
- New `docx.js`: a tiny ZIP writer (stored, no compression, CRC-32) plus a minimal
  WordprocessingML package: `[Content_Types].xml`, `_rels/.rels`, `word/document.xml`,
  `word/styles.xml`, `word/_rels/document.xml.rels`.
- Same content and order as the on-screen brief, built from the same data and my edited
  text: title + range + subtitle, headline, cards (a shaded 1-row table), sleep table
  (navy header, striped rows, pale yellow short nights), key events table, skills,
  therapy focus, takeaway, footnote. All text XML-escaped; line breaks kept.
- Letter page, 0.75" margins, Calibri 10.5 pt, navy headings.

## Test plan
- The file downloads with the right name; the ZIP opens and every XML part parses
  (checked with PowerShell's .NET ZIP + XML readers).
- Content matches the brief (range, cards, rows, events, edited text); special
  characters (& < > " ') survive.
- Not testable here: opening it in Word / Google Docs. The owner checks that.

## Verified (browser, 2026-10-23, seeded test data)
- Download name `Therapy_Homework_Oct10-Oct23_2026.docx` (~25 KB)
- CRC-32 matches the standard check value (`cbf43926` for "123456789")
- Read back independently: valid end-of-central-directory, 5 parts, local headers OK, every CRC matches, every XML part parses without errors
- document.xml contains the range, cards (avg 6h 20m), sleep + events + takeaway tables (4), pale yellow short-night fill, edited multi-line takeaway, and `& < > " '` text intact
- No console errors

## Not verified
- Opening the file in Microsoft Word, Google Docs or Pages (owner to check)
