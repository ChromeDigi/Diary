// Imports the daily text from the iPhone "Diary check-in" Shortcut: sleep samples,
// activity per day, workouts and work-calendar events. Format: docs/iphone-shortcut.md.
// Loaded after app.js and lock.js; runs the #health= link after all scripts have loaded.

const CAL_WINDOW_DAYS = 8; // today + 7, matching the shortcut's calendar range
let pendingHealth = null; // text waiting for the diary to be unlocked

// ---------- Parsing ----------

// "2026-10-23T23:41" or "2026-10-23 23:41" → "2026-10-23T23:41"
function parseStamp(s) {
  const m = String(s || '').trim().match(/^(\d{4}-\d{2}-\d{2})[T ](\d{1,2}):(\d{2})/);
  return m ? `${m[1]}T${m[2].padStart(2, '0')}:${m[3]}` : null;
}

function parseDay(s) {
  const m = String(s || '').trim().match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : null;
}

// "8,421", "34 min", "512.3 kcal", "512,3" → number
function parseNumber(s) {
  const m = String(s || '').match(/\d[\d.,]*/);
  if (!m) return null;
  let t = m[0];
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) t = t.replace(/,/g, '');
  else if (/^\d+,\d{1,2}$/.test(t)) t = t.replace(',', '.');
  else t = t.replace(/,/g, '');
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

// Apple sleep values: In Bed, Asleep, Core, Deep, REM, Awake (or HealthKit codes 0–5).
function sleepKind(v) {
  const s = String(v || '').trim().toLowerCase();
  if (s === '2' || s.includes('awake')) return 'awake';
  if (s === '0' || s.includes('bed')) return 'inBed';
  return 'asleep';
}

function parseHealthText(text) {
  const out = { sleep: [], activity: {}, workouts: [], events: [], lines: 0, skipped: 0 };
  String(text || '').split(/\r?\n/).forEach((raw) => {
    const line = raw.trim();
    if (!line || /^DIARY-HEALTH/i.test(line)) return;
    const [kind, a, b, ...rest] = line.split('|');
    const k = kind.trim().toUpperCase();
    out.lines++;
    if (k === 'SLEEP' && parseStamp(a) && parseStamp(b)) {
      out.sleep.push({ start: parseStamp(a), end: parseStamp(b), kind: sleepKind(rest[0]) });
    } else if (['STEPS', 'EXERCISE', 'ENERGY'].includes(k) && parseDay(a) && parseNumber(b) != null) {
      const field = { STEPS: 'steps', EXERCISE: 'exerciseMin', ENERGY: 'activeKcal' }[k];
      const day = (out.activity[parseDay(a)] ||= {});
      day[field] = (day[field] || 0) + parseNumber(b); // ungrouped samples add up
    } else if (k === 'WORKOUT' && parseStamp(a) && parseStamp(b)) {
      out.workouts.push({ start: parseStamp(a), end: parseStamp(b), type: rest.join('|').trim() });
    } else if (k === 'EVENT' && parseStamp(a) && parseStamp(b)) {
      const allDay = a.trim().slice(11, 16) === '00:00' && b.trim().slice(11, 16) === '00:00' && parseStamp(b) > parseStamp(a);
      out.events.push({ start: parseStamp(a), end: parseStamp(b), allDay, title: rest.join('|').trim() });
    } else {
      out.skipped++;
    }
  });
  return out;
}

// ---------- Sleep samples → one record per night ----------

const toDate = (stamp) => new Date(stamp);
const hhmm = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

// Night of = the evening it belongs to: anything starting before noon counts for the day before.
function nightOf(stamp) {
  const d = toDate(stamp);
  d.setHours(d.getHours() - 12);
  return isoOfDate(d);
}

function isoOfDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Merges overlapping [start, end] ms intervals (Watch + iPhone often overlap).
function mergeSpans(spans) {
  const sorted = spans.filter(([s, e]) => e > s).sort((x, y) => x[0] - y[0]);
  const out = [];
  sorted.forEach(([s, e]) => {
    const last = out[out.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  });
  return out;
}

const spanMinutes = (spans) => Math.round(spans.reduce((n, [s, e]) => n + (e - s), 0) / 60000);

function sleepNights(samples) {
  const nights = {};
  samples.forEach((x) => {
    const startHour = toDate(x.start).getHours();
    if (x.kind !== 'awake' && startHour >= 12 && startHour < 18) return; // a nap, not the night
    (nights[nightOf(x.start)] ||= []).push(x);
  });
  const out = {};
  Object.entries(nights).forEach(([night, list]) => {
    const span = (x) => [toDate(x.start).getTime(), toDate(x.end).getTime()];
    const asleep = mergeSpans(list.filter((x) => x.kind === 'asleep').map(span));
    const bed = mergeSpans(list.filter((x) => x.kind !== 'awake').map(span));
    const frame = asleep.length ? asleep : bed;
    if (!frame.length) return;
    const from = frame[0][0];
    const to = frame[frame.length - 1][1];
    const awake = mergeSpans(list.filter((x) => x.kind === 'awake').map(span)
      .map(([s, e]) => [Math.max(s, from), Math.min(e, to)]));
    out[night] = {
      bedtime: hhmm(new Date(from)),
      wake: hhmm(new Date(to)),
      asleepMin: asleep.length ? spanMinutes(asleep) : null,
      awakeMin: awake.length ? spanMinutes(awake) : null,
    };
  });
  return out;
}

// ---------- Applying an import ----------

function applyHealth(text) {
  const p = parseHealthText(text);
  const summary = [];

  // Sleep: Health fills nights; nights I typed or edited keep my values ("manual wins").
  const nights = sleepNights(p.sleep);
  Object.entries(nights).forEach(([night, n]) => {
    const old = sleepLog[night];
    if (!old || old.source === 'health') {
      sleepLog[night] = cleanSleep({ ...n, score: old?.score ?? null, estimated: false, source: 'health' });
    } else {
      sleepLog[night] = cleanSleep({
        ...old,
        bedtime: old.bedtime || n.bedtime,
        wake: old.wake || n.wake,
        asleepMin: old.asleepMin ?? n.asleepMin,
        awakeMin: old.awakeMin ?? n.awakeMin,
      });
    }
  });
  if (Object.keys(nights).length) {
    persistSleep();
    summary.push(`${Object.keys(nights).length} night${Object.keys(nights).length === 1 ? '' : 's'} of sleep`);
  }

  // Activity + workouts: this import's numbers replace those days.
  const workoutDays = {};
  p.workouts.forEach((w) => { (workoutDays[w.start.slice(0, 10)] ||= []).push(w); });
  const activityDates = [...new Set([...Object.keys(p.activity), ...Object.keys(workoutDays)])];
  activityDates.forEach((date) => {
    const old = daysLog[date] || {};
    const a = p.activity[date] || {};
    daysLog[date] = cleanDay({
      ...old,
      steps: a.steps ?? old.steps,
      exerciseMin: a.exerciseMin ?? old.exerciseMin,
      activeKcal: a.activeKcal ?? old.activeKcal,
      workouts: p.workouts.length ? workoutDays[date] || [] : old.workouts,
      updatedAt: Date.now(),
    });
  });
  if (activityDates.length) summary.push(`${activityDates.length} day${activityDates.length === 1 ? '' : 's'} of activity`);

  // Work calendar: replaces today … today + 7 so cancelled events disappear.
  if (p.events.length) {
    const from = today();
    const until = isoOfDate(new Date(new Date(from + 'T00:00').getTime() + CAL_WINDOW_DAYS * 864e5));
    Object.keys(daysLog).forEach((date) => {
      if (date >= from && date < until) daysLog[date] = cleanDay({ ...daysLog[date], work: [] });
    });
    p.events.forEach((ev) => {
      const date = ev.start.slice(0, 10);
      const old = daysLog[date] || {};
      daysLog[date] = cleanDay({ ...old, work: [...(old.work || []), ev], updatedAt: Date.now() });
    });
    summary.push(`${p.events.length} work event${p.events.length === 1 ? '' : 's'}`);
  }
  if (activityDates.length || p.events.length) persistDays();

  if (summary.length) {
    prefs.lastHealthImport = Date.now();
    savePrefs();
  }
  if (current()) renderSleep();
  return { summary, skipped: p.skipped, lines: p.lines };
}

function importMessage(r) {
  if (!r.summary.length) return r.lines ? 'Nothing usable found in that text.' : 'That text was empty.';
  return `Imported ${r.summary.join(', ')}${r.skipped ? ` (${r.skipped} line${r.skipped === 1 ? '' : 's'} skipped)` : ''}.`;
}

// ---------- The #health= link from the Shortcut ----------

function runHealthLink() {
  if (!location.hash.startsWith('#health=')) return;
  let text = '';
  try {
    text = decodeURIComponent(location.hash.slice('#health='.length));
  } catch {
    text = '';
  }
  // Take the data out of the address bar (and this history entry) right away.
  history.replaceState(null, '', location.pathname + location.search);
  if (isLocked()) {
    pendingHealth = text;
    return;
  }
  finishHealthLink(text);
}

function finishHealthLink(text) {
  const r = applyHealth(text);
  checkIn();
  showToast(r.summary.length ? `📲 ${importMessage(r)}` : importMessage(r));
}

document.addEventListener('diary:unlocked', () => {
  if (pendingHealth != null) {
    const text = pendingHealth;
    pendingHealth = null;
    finishHealthLink(text);
  }
});
window.addEventListener('DOMContentLoaded', runHealthLink);

// ---------- Setup view ----------

function renderSetup() {
  $('setupUrl').textContent = `${location.origin}${location.pathname}#health=`;
  $('setupStatus').textContent = prefs.lastHealthImport
    ? `Last import: ${new Date(prefs.lastHealthImport).toLocaleString()}`
    : 'No import yet.';
}

function openSetup() {
  currentId = null;
  form.hidden = true;
  $('placeholder').hidden = true;
  hideViews();
  $('setup').hidden = false;
  app.classList.add('editing');
  renderList();
  renderSetup();
}

$('setupBtn').addEventListener('click', openSetup);
$('setupBack').addEventListener('click', closeEditor);
$('healthImportBtn').addEventListener('click', () => {
  const r = applyHealth($('healthPaste').value);
  $('healthMsg').textContent = importMessage(r);
  $('healthMsg').classList.toggle('ok', r.summary.length > 0);
  if (r.summary.length) $('healthPaste').value = '';
  renderSetup();
});
