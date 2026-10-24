# Phase 7: Optional passcode lock (real encryption)

**Status:** Done (2026-10-23)

## Goal
An optional lock that really encrypts the diary on this device, so someone who opens
the browser (or reads its storage) can't read it without the passcode.

## Crypto
- Web Crypto only (no libraries): PBKDF2-SHA-256, 250,000 iterations, random 16-byte
  salt → AES-GCM 256-bit key, fresh random 12-byte IV for every save.
- Vault in `diary.vault.v1` = `{ v: 1, kdf, iterations, salt, iv, data }` (base64).
  `data` = encrypted JSON `{ entries, reports, talkItems }`.
- The key lives only in memory (not extractable). Reloading or "Lock now" locks again.
- Prefs (`diary.prefs.v1`: theme, calm, palette…) stay unencrypted so the lock screen
  can be themed. They hold no diary content.

## Turning it on
- Privacy view (🔓 button in the header): explains it, a big warning that a
  **forgotten passcode means the diary can't be recovered**, an "Export backup first"
  button, passcode + confirm (min 6 characters), and an "I understand" checkbox.
- Order: encrypt → save vault → read it back and decrypt to verify → only then remove
  the plain copies (`diary.entries.v2`, `diary.reports.v1`, `diary.talk.v1`, and the
  old `diary.entries.v1` safety copy, which would otherwise leak the old diary).

## While on
- Every save writes the vault (saves are queued, so they never overlap).
- Guard: while locked, nothing can write, so an empty app can't overwrite the vault.
- Lock screen on load: passcode → unlock. Wrong passcode: friendly message, no lockout.
- "Forgot passcode?" explains there is no recovery; "Start over" (type ERASE) deletes
  the vault so a backup can be imported.
- Privacy view: Lock now, Change passcode (current + new), Turn off (current passcode →
  decrypt → write plain copies → verify → remove vault).
- Exported backups stay plain JSON (the warning says to keep them somewhere safe).

## Out of scope
Sync, biometrics, auto-lock timer.

## Test plan
- Turn on: plain keys removed, vault present, stored text contains no diary words.
- Reload: lock screen; wrong passcode refused; right passcode restores entries,
  reports, talk list; edits save to the vault and survive reload.
- Locked state never overwrites the vault.
- Change passcode: old one stops working, new one works.
- Turn off: plain keys back, vault gone, app works as before.
- Start over requires ERASE. Import while unlocked goes into the vault.
- Phone 375px, dark + light; no console errors.

## Verified (browser, 2026-10-23, test passcodes only)
- Turn on: validation (length, match, checkbox); plain keys incl. old v1 removed; vault has only v/kdf/iterations/salt/iv/data; a marker word from entries, reports and talk is not in stored text
- Edits while unlocked rewrite the vault ("Saved 🔒")
- Reload: lock screen, focus on passcode; while locked, saves are refused and the vault is untouched
- Wrong passcode refused with message; right one restores entries, report notes, goal, talk list; no spurious badge toasts
- Change passcode: wrong current refused; afterwards old fails, new works
- Import while unlocked goes into the vault (no plain copy); "Lock now" saves then locks
- Turn off: wrong passcode refused; right one writes plain keys back, removes vault; later saves are plain
- Erase: needs ERASE + confirm; cancel keeps the vault; confirmed erase starts fresh
- Phone 375px lock screen + 3-icon header fit; no console errors

## Not verified
- Real phone, Safari; very large diaries (encryption speed); file:// use (lock needs a secure page)
