# Phase 13: Day types, look-ahead and activity in the brief

**Status:** Planned (2026-10-24)

## Goal
The app knows what kind of day it is and what's coming, prepares the check-in for it,
and gives the brief the sleep + activity + workload picture my nurse practitioner wants.

## Day types (automatic, from Phase 12 data)
- **Work day** (work-calendar events) / **Day off** / **Weekend** (Sat/Sun without work).
- **Gym day** (a recorded workout, or a calendar event titled gym/workout) / **Rest day**.

## Look-ahead
- Check-in header: today's type + scheduled work hours (first–last event), tomorrow
  preview ("Tomorrow: work, 6 h 30 m scheduled").
- Prepared layout: gym day → workout shown; heavy work day → short "plan a break" nudge;
  weekend/day off → lighter check-in.

## In the brief (data only, no interpretation)
- Activity table per day: date, day type, steps, exercise min, active kcal, workouts.
- Cards (max 4, by available data): average sleep, short nights, activity (avg steps /
  total exercise), workload (work days, average scheduled hours). Mood/anxiety move to
  the headline when cards are full.
- Day-type tag in the sleep table; sleep on work nights vs days off shown side by side.
- Word export gets the same sections.
