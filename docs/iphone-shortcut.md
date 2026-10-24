# iPhone Shortcut: "Diary check-in"

One tap each morning sends last night's sleep, recent activity and your work calendar
to the diary. Built in Apple's **Shortcuts** app; nothing to install.
Being checked on a real iPhone; steps marked ✔ match what the iPhone shows.

## Permissions
The first run asks to read **Health** (Sleep, Steps, Exercise, Active Energy, Workouts)
and **Calendars**. Tap **Allow** / **Turn On All**. Change later in
Settings → Privacy & Security → **Health → Shortcuts** and **Calendars → Shortcuts**.

## Build it (Shortcuts → + → name it "Diary check-in")
Date format used everywhere below: **Format Date → Custom →** `yyyy-MM-dd'T'HH:mm`
(for day-only values: `yyyy-MM-dd`).

**Putting actions inside a Repeat:** a new action always lands at the bottom. Press and
hold it, then drag it up between *Repeat with Each* and *End Repeat*.

**A. Sleep**
1. ✔ *Find Health Samples* where **Type is Sleep** (iOS calls it "Sleep", not "Sleep
   Analysis") and **Start Date is in the last 7 days**. 7 days back-fills mornings you
   skipped. **Sort by: None** is fine; the diary sorts.
2. *Repeat with Each* result:
   - *Format Date* (Repeat Item → Start Date, custom format) → rename **S**
   - *Format Date* (Repeat Item → End Date, custom format) → rename **E**
   - *Text*: `SLEEP|` **S** `|` **E** `|` Repeat Item → **Value**
   - *Add to Variable* **Lines**
3. End Repeat.

**B. Activity** (repeat this block for each type)
- Types and line names: **Steps** → `STEPS`, **Exercise Time** (may be called Exercise
  Minutes) → `EXERCISE`, **Active Energy** → `ENERGY`.
1. *Find Health Samples* where **Type is Steps** and **Start Date is in the last 7 days**,
   **Group By: Day**.
2. *Repeat with Each*: *Format Date* (Start Date, `yyyy-MM-dd`) → *Text*
   `STEPS|` date `|` Repeat Item → **Value** → *Add to Variable* **Lines**. End Repeat.

**C. Workouts** (skip if your Shortcuts has no Workouts type)
- *Find Health Samples* where **Type is Workouts**, last 7 days → Repeat: *Text*
  `WORKOUT|` start `|` end `|` Repeat Item → **Type** (or **Name**) → *Add to Variable* **Lines**.

**D. Work calendar**
1. *Date*: `today at 12:00 AM` → rename **Today**.
2. *Adjust Date*: add **8 days** to Today → rename **Until**.
3. *Find Calendar Events* where **Calendar is** *(your work calendar)*,
   **Start Date is after** Today, **Start Date is before** Until, sort by Start Date.
4. *Repeat with Each*: *Text* `EVENT|` start `|` end `|` Repeat Item → **Title**
   (or type `busy` instead of the title to keep meeting names private)
   → *Add to Variable* **Lines**. End Repeat.

**E. Send it to the diary**
Put these after the last *End Repeat* (not inside it).
1. *Combine Text*: **Lines** with **New Lines**.
2. *URL Encode* the Combined Text.
3. *Text*: `https://chromedigi.github.io/Diary/#health=` *URL Encoded Text* (no space between).
4. *Open URLs*.
5. Tap ▶ to test. It works when the diary shows "Imported N nights of sleep".

Then: shortcut **⋯ → Add to Home Screen**. Tap it each morning.

## What the diary does with it
The part after `#` stays on your phone (browsers never send it to a server). The diary
saves it, clears it from the address bar and opens today's check-in.
- Sleep: fills last night (bedtime, wake, asleep, awake). Nights you typed or edited keep
  your values. Sleep Score isn't imported; type it if you want it.
- Activity: per day, last 7 days; this morning's import completes yesterday.
- Work calendar: today + 7 days, replaced on every import.

## Format reference
The `DIARY-HEALTH 1` first line is optional; the diary ignores it.
```
DIARY-HEALTH 1
SLEEP|2026-10-23T23:41|2026-10-24T01:10|Core
STEPS|2026-10-23|8421
EXERCISE|2026-10-23|34
ENERGY|2026-10-23|512
WORKOUT|2026-10-23T18:02|2026-10-23T18:55|Traditional Strength Training
EVENT|2026-10-24T09:00|2026-10-24T10:00|Team meeting
```
