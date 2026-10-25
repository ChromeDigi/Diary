# iPhone Shortcut: "Diary check-in"

One tap each morning sends last night's sleep, recent activity and your work calendar
to the diary. Built in Apple's **Shortcuts** app; nothing to install.
Being checked on a real iPhone; steps marked ✔ match what the iPhone shows. Part A
(sleep) works end to end (2026-10-24).

## Permissions
The first run asks to read **Health** (Sleep, Steps, Exercise, Active Energy, Workouts)
and **Calendars**. Tap **Allow** / **Turn On All**. Change later in
Settings → Privacy & Security → **Health → Shortcuts** and **Calendars → Shortcuts**.

✔ **Needed once:** a week of sleep is ~150–200 Health items, and iOS blocks sending that
many ("This action is trying to share 177 Health items, which is not allowed"). Fix:
Settings → Apps → **Shortcuts → Advanced → Allow Sharing Large Amounts of Data** (on).

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
   - ✔ *Format Date*: tap Date → Repeat Item → **Start Date**; Date Format **Custom** →
     Format String `yyyy-MM-dd'T'HH:mm`
   - ✔ Second *Format Date*: press and hold the first → **Duplicate**, then switch it to **End Date**
   - ✔ *Text*: `SLEEP|` Formatted Date `|` Formatted Date `|` Repeat Item. Insert each date with
     **Select Variable** and tap the matching Format action. The Repeat Item bubble already
     gives **Value** (its default), so its label stays "Repeat Item".
   - ✔ *Add to Variable*: **Text** to `Lines`
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

**E. Send it to the diary.** Put these after the last *End Repeat* (not inside it).
Pick the ending that matches where you use the diary.

*Diary on the Home Screen (recommended).* A Home Screen web app has its own storage,
separate from Safari, so a link would land in Safari's copy. Hand it over by clipboard:
1. ✔ *Combine Text*: it fills in **Repeat Results** by itself. Tap it → **Clear Variable**,
   tap the empty field → **Lines** from the bar above the keyboard. Then: with **New Lines**.
2. *Copy to Clipboard* (input: Combined Text).
3. In the diary's check-in tap **📲 Get Health data** (it starts the shortcut by name;
   the name is set on the diary's 📲 page, default "Diary Check In"). When the shortcut
   finishes, go back to the diary (top-left "◀" or the app switcher) and tap
   **📋 Paste Health data**, then iPhone's **Paste**. The diary clears the clipboard after.

*Diary in Safari.* One tap, but Safari can clear a site's data after 7 days of Safari use
without visiting it, so the Home Screen app is safer for a diary.
1. ✔ *Combine Text* as above.
2. ✔ *URL Encode* the Combined Text.
3. ✔ *Text*: `https://chromedigi.github.io/Diary/#health=` *URL Encoded Text* (no space between).
4. ✔ *Open URLs* (shows "Open Text").
5. ✔ Tap ▶ to test. It works when the diary shows "Imported N nights of sleep".

Safari route: shortcut **⋯ → Add to Home Screen** and tap it each morning.

## What the diary does with it
Clipboard or link, the text never leaves the phone (the part after `#` is never sent to a
server). The diary saves it, clears the address bar or clipboard and opens today's check-in.
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
