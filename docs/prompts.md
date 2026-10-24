# Build prompts

Paste these in order, in the same chat (hand off only at ~60% context, see `CLAUDE.md`).
Purpose: weekly therapy updates; fun, low-effort, predictable, ADHD/autism-friendly.

## 1. Re-plan the roadmap
```text
Read docs/handoff.md and CLAUDE.md. The diary's real purpose: I give my therapist a weekly update on my life. I'm autistic and have ADHD, so the app must be fun, low-effort, predictable and motivating, with graphs, colors and a modern look. Today I make these updates by hand in chat every week; the app should give me a reusable structure so I never start from scratch. Rewrite docs/plan.md as a new phase roadmap (redesign, daily check-in, weekly report, motivation, extras), fold the tags phase into it where it fits, log the change in docs/decisions.md, and update the handoff. Don't build anything yet. Ask me about the order as clickable choices.
```

## 2. Visual redesign
```text
Read docs/handoff.md and the plan. Redesign the diary UI so it looks modern, colorful and fun: a soft gradient background, rounded "glass" cards, a bold font pairing (system fonts only, no CDNs), smooth micro-animations, and a color for each mood. Keep it calm, not overwhelming: a consistent layout, no clutter, and a "calm mode" toggle plus prefers-reduced-motion support that turns off animations and saturation. Define all colors as CSS variables, with both light and dark themes. It must work at phone width. Show me 2–3 style directions as clickable choices before building, then verify with screenshots.
```

## 3. Quick daily check-in (about 30 seconds)
```text
Read docs/handoff.md and the phase docs. Add a fast daily check-in alongside the free-text entry: 1–5 sliders for mood, energy, anxiety and sleep quality, color-coded and showing emoji; tappable "theme" chips (work, family, friends, sensory overload, health, wins…, editable); and an optional one-line "biggest thing today". It should be finishable in under 30 seconds with big tap targets. The entry shape changes, so bump the storage key and migrate the old data without losing anything. Write the phase doc first.
```

## 4. Weekly therapist report (the main feature)
```text
Read docs/handoff.md and the phase docs. Build a "This week" report page for my therapist: line charts of mood, energy, anxiety and sleep across the week (hand-made inline SVG, no chart libraries), a mood-color strip with one block per day, my most frequent theme chips, and sections for wins, struggles and "things I want to talk about". It should pull from my check-ins and entries automatically, so I only edit, never start from scratch. Add a print/save-as-PDF stylesheet so it looks polished on paper. Let me compare with last week. Write the phase doc first.
```

## 5. Carry-over and session prep
```text
Read docs/handoff.md and the phase docs. Add a running "Bring to therapy" list I can add to anytime during the week (one tap, from any screen); its items appear in the weekly report automatically. After a session I can mark items as discussed, and anything not discussed carries over to next week. Also add a "notes from session" field and a "goal for this week" that shows on the home screen. Write the phase doc first.
```

## 6. Motivation that's fun and guilt-free
```text
Read docs/handoff.md and the phase docs. Make logging rewarding for an ADHD brain without shaming me: a check-in counter that celebrates totals instead of streaks breaking (missed days never show red or "streak lost"), confetti or a sticker when I finish a check-in, unlockable color themes and badges, and a rotating fun journaling prompt of the day. Everything is optional and respects calm mode. Write the phase doc first.
```

## 7. Privacy (optional, later)
```text
Read docs/handoff.md and the phase docs. Add an optional passcode lock that really encrypts entries using Web Crypto, not just hides them. Warn me clearly that a forgotten passcode means lost data, and make the export/backup flow obvious. Write the phase doc first.
```
