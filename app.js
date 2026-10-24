// My Diary: entries are stored only in this browser's localStorage.

const STORAGE_KEY = 'diary.entries.v3';
// Older entry keys, newest first: read once for migration; only removed when the lock is turned on.
const OLD_KEYS = ['diary.entries.v2', 'diary.entries.v1'];
const SLEEP_KEY = 'diary.sleep.v1'; // sleep per night, keyed by "night of" date
const BRIEFS_KEY = 'diary.briefs.v1'; // therapy session dates + brief notes (brief.js)
const PREFS_KEY = 'diary.prefs.v1';
const REPORTS_KEY = 'diary.reports.v1'; // weekly report notes, keyed by week start date
const TALK_KEY = 'diary.talk.v1'; // bring-to-therapy items
const VAULT_KEY = 'diary.vault.v1'; // encrypted entries + reports + talk items (lock.js)
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Mood is 1–5, shown as orbs. Index 0 = score 1.
const MOODS = [
  { label: 'Awful', color: '#e24b6a' },
  { label: 'Low', color: '#ef9f27' },
  { label: 'Okay', color: '#f2d94e' },
  { label: 'Good', color: '#5dcaa5' },
  { label: 'Great', color: '#7f9cff' },
];
// v1 stored an emoji; v2 stores a score.
const EMOJI_TO_MOOD = { '😄': 5, '🙂': 4, '😐': 3, '😔': 2, '😢': 1, '😡': 1 };

const GOOD_HIGH = MOODS.map((m) => m.color);
const SCALES = [
  { key: 'energy', label: 'Energy', words: ['Empty', 'Low', 'Okay', 'Good', 'Buzzing'], colors: GOOD_HIGH },
  { key: 'anxiety', label: 'Anxiety', words: ['Calm', 'Mild', 'Some', 'High', 'Very high'],
    colors: ['#5dcaa5', '#a8d672', '#f2d94e', '#ef9f27', '#e24b6a'] },
  { key: 'sleep', label: 'Sleep', words: ['Awful', 'Poor', 'Okay', 'Good', 'Great'], colors: GOOD_HIGH },
];
const DEFAULT_THEMES = ['work', 'family', 'friends', 'sensory overload', 'health', 'win'];
const DEFAULT_SKILLS = ['DEAR MAN', 'GIVE', 'FAST', 'STOP', 'Distress tolerance', 'Emotion labeling', 'Boundaries'];
const SLEEP_INPUTS = ['sleepBed', 'sleepWake', 'sleepH', 'sleepM', 'sleepAwake', 'sleepScore', 'sleepEst'];

const $ = (id) => document.getElementById(id);
const app = $('app');
const list = $('entryList');
const form = $('entryForm');
const fields = { date: $('date'), title: $('title'), body: $('body'), oneLiner: $('oneLiner'), meaning: $('meaning') };

let vaultKey = null; // set by lock.js after unlocking; null when the lock is off
let entries = load();
let reports = loadReports();
let talkItems = loadTalk();
let sleepLog = loadSleep();
let briefs = loadBriefs();
let sleepTimer = null;
let currentId = null;
let saveTimer = null;
let lastTap = null; // "key:value" of the rating just tapped, for the jelly animation
let animateList = true; // entries slide in on the next render (load, search, unlock)

// ---------- Storage ----------

function hasVault() {
  return localStorage.getItem(VAULT_KEY) !== null;
}

// Locked = encrypted data exists but isn't unlocked yet. Nothing may be saved then,
// or the empty app would overwrite the real diary.
function isLocked() {
  return !vaultKey && hasVault();
}

function score(v) {
  return Number.isInteger(v) && v >= 1 && v <= 5 ? v : null;
}

function cleanTheme(t) {
  return String(t).trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 30);
}

function isEntry(e) {
  return e && e.id && typeof e.body === 'string';
}

// Turns a v1, v2 or v3 entry into a valid v3 entry.
function normalize(e) {
  return {
    id: String(e.id),
    date: /^\d{4}-\d{2}-\d{2}$/.test(e.date) ? e.date : today(),
    title: typeof e.title === 'string' ? e.title : '',
    body: e.body,
    mood: typeof e.mood === 'string' ? EMOJI_TO_MOOD[e.mood] ?? null : score(e.mood),
    energy: score(e.energy),
    anxiety: score(e.anxiety),
    sleep: score(e.sleep),
    themes: Array.isArray(e.themes) ? [...new Set(e.themes.map(cleanTheme).filter(Boolean))] : [],
    oneLiner: typeof e.oneLiner === 'string' ? e.oneLiner : '',
    skills: Array.isArray(e.skills) ? [...new Set(e.skills.map(cleanSkill).filter(Boolean))] : [],
    skillsReview: e.skillsReview === true,
    keyEvent: e.keyEvent === true,
    meaning: typeof e.meaning === 'string' ? e.meaning : '',
    updatedAt: Number(e.updatedAt) || Date.now(),
  };
}

function cleanSkill(s) {
  return String(s).trim().replace(/\s+/g, ' ').slice(0, 30);
}

// ---------- Sleep (per night) ----------

function minutesOrNull(v, max) {
  const n = Number(v);
  return v !== '' && v != null && Number.isFinite(n) && n >= 0 && n <= max ? Math.round(n) : null;
}

function cleanSleep(n) {
  const time = (v) => (typeof v === 'string' && /^\d{2}:\d{2}$/.test(v) ? v : '');
  return {
    bedtime: time(n.bedtime),
    wake: time(n.wake),
    asleepMin: minutesOrNull(n.asleepMin, 24 * 60),
    awakeMin: minutesOrNull(n.awakeMin, 24 * 60),
    score: minutesOrNull(n.score, 100),
    estimated: n.estimated === true,
    updatedAt: Number(n.updatedAt) || Date.now(),
  };
}

function cleanSleepLog(obj) {
  const out = {};
  Object.entries(obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {}).forEach(([night, n]) => {
    if (ISO_DATE.test(night) && n && typeof n === 'object') out[night] = cleanSleep(n);
  });
  return out;
}

function loadSleep() {
  if (hasVault()) return {};
  try {
    return cleanSleepLog(JSON.parse(localStorage.getItem(SLEEP_KEY)));
  } catch {
    return {};
  }
}

function persistSleep() {
  writeData(SLEEP_KEY, sleepLog);
}

// ---------- Therapy briefs: session dates + editable notes ----------

function cleanBriefs(obj) {
  const src = obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {};
  const text = (v) => (typeof v === 'string' ? v : null);
  const sessions = [...new Set((Array.isArray(src.sessions) ? src.sessions : []).filter((d) => ISO_DATE.test(d)))].sort();
  const notes = {};
  Object.entries(src.notes && typeof src.notes === 'object' ? src.notes : {}).forEach(([s, n]) => {
    if (!ISO_DATE.test(s) || !n || typeof n !== 'object') return;
    notes[s] = {
      start: ISO_DATE.test(n.start) ? n.start : null,
      subtitle: text(n.subtitle), headline: text(n.headline), focus: text(n.focus), takeaway: text(n.takeaway),
      updatedAt: Number(n.updatedAt) || Date.now(),
    };
  });
  return { sessions, notes };
}

function loadBriefs() {
  if (hasVault()) return cleanBriefs(null);
  try {
    return cleanBriefs(JSON.parse(localStorage.getItem(BRIEFS_KEY)));
  } catch {
    return cleanBriefs(null);
  }
}

function persistBriefs() {
  writeData(BRIEFS_KEY, briefs);
}

// Minutes asleep: as entered, else wake − bedtime − awake. Returns { min, calculated }.
function sleepTotal(n) {
  if (!n) return { min: null, calculated: false };
  if (n.asleepMin != null) return { min: n.asleepMin, calculated: false };
  if (!n.bedtime || !n.wake) return { min: null, calculated: false };
  const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  let span = toMin(n.wake) - toMin(n.bedtime);
  if (span <= 0) span += 24 * 60;
  return { min: Math.max(0, span - (n.awakeMin || 0)), calculated: true };
}

function formatMinutes(min) {
  return min == null ? '–' : `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`;
}

function readList(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

// With the lock on, data arrives later from lock.js after unlocking.
function load() {
  if (hasVault()) return [];
  const current = readList(STORAGE_KEY);
  if (current) return current.filter(isEntry).map(normalize);
  const old = OLD_KEYS.map(readList).find(Boolean);
  if (!old) return [];
  const migrated = old.filter(isEntry).map(normalize);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)); } catch { /* retried on next save */ }
  return migrated;
}

function loadReports() {
  if (hasVault()) return {};
  try {
    const r = JSON.parse(localStorage.getItem(REPORTS_KEY));
    return r && typeof r === 'object' && !Array.isArray(r) ? r : {};
  } catch {
    return {};
  }
}

// Writes one data key, or the whole encrypted vault when the lock is on.
// Returns false if nothing could be saved.
function writeData(key, value) {
  if (isLocked()) return false;
  if (vaultKey) {
    saveVault();
  } else {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      return false;
    }
  }
  document.dispatchEvent(new Event('diary:changed'));
  return true;
}

function persistReports() {
  writeData(REPORTS_KEY, reports);
}

// Keeps only well-formed report notes from a backup.
function cleanReport(r) {
  const text = (v) => (typeof v === 'string' ? v : null);
  return {
    wins: text(r.wins), struggles: text(r.struggles), talk: text(r.talk),
    sessionNotes: text(r.sessionNotes), goal: text(r.goal),
    updatedAt: Number(r.updatedAt) || Date.now(),
  };
}

function cleanTalk(t) {
  if (!t || !t.id || typeof t.text !== 'string' || !t.text.trim()) return null;
  return {
    id: String(t.id),
    text: t.text.trim().slice(0, 200),
    addedOn: ISO_DATE.test(t.addedOn) ? t.addedOn : today(),
    discussedOn: ISO_DATE.test(t.discussedOn) ? t.discussedOn : null,
  };
}

function loadTalk() {
  if (hasVault()) return [];
  const list = readList(TALK_KEY);
  return list ? list.map(cleanTalk).filter(Boolean) : [];
}

function persistTalk() {
  writeData(TALK_KEY, talkItems);
}

function persist() {
  if (writeData(STORAGE_KEY, entries)) setStatus(vaultKey ? 'Saved 🔒' : 'Saved');
  else setStatus('Could not save. Export a backup!');
}

// ---------- Helpers ----------

function today() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function formatDate(iso) {
  return new Date(iso + 'T00:00').toLocaleDateString(undefined, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });
}

function sorted(items) {
  return [...items].sort((a, b) =>
    b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt);
}

function setStatus(text) {
  const words = fields.body.value.trim().split(/\s+/).filter(Boolean).length;
  $('status').textContent = `${words} word${words === 1 ? '' : 's'} · ${text}`;
}

function allThemes() {
  const used = entries.flatMap((e) => e.themes).filter((t) => !DEFAULT_THEMES.includes(t));
  return [...DEFAULT_THEMES, ...[...new Set(used)].sort()];
}

function matches(e, q) {
  return [e.title, e.body, e.oneLiner, ...e.themes].some((s) => s.toLowerCase().includes(q));
}

// ---------- Rendering ----------

function renderList() {
  const q = $('search').value.trim().toLowerCase();
  const shown = sorted(entries).filter((e) => !q || matches(e, q));

  const enter = animateList;
  animateList = false;
  list.replaceChildren(...shown.map((e, i) => {
    const li = document.createElement('li');
    li.className = e.id === currentId ? 'active' : '';
    if (enter) {
      li.classList.add('enter');
      li.style.setProperty('--i', Math.min(i, 12));
    }
    if (e.mood) li.style.setProperty('--c', MOODS[e.mood - 1].color);
    li.innerHTML = `
      <div class="entry-meta"><span></span><span></span></div>
      <div class="entry-title"></div>
      <div class="entry-snippet"></div>
      <div class="entry-themes"></div>`;
    li.querySelector('.entry-meta span:first-child').textContent = formatDate(e.date);
    li.querySelector('.entry-meta span:last-child').textContent = e.mood ? MOODS[e.mood - 1].label : '';
    li.querySelector('.entry-title').textContent = e.title || 'Untitled';
    li.querySelector('.entry-snippet').textContent = e.oneLiner || e.body.slice(0, 80) || 'Empty entry';
    li.querySelector('.entry-themes').replaceChildren(...e.themes.slice(0, 3).map((t) => {
      const s = document.createElement('span');
      s.className = 'mini-chip';
      s.textContent = t;
      return s;
    }));
    li.addEventListener('click', () => openEntry(e.id));
    return li;
  }));

  $('emptyList').hidden = entries.length > 0;
}

function renderCheckin() {
  const e = current();

  $('moods').replaceChildren(...MOODS.map((m, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(e.mood === i + 1));
    b.setAttribute('aria-label', `Mood: ${m.label}`);
    b.dataset.label = m.label;
    b.style.setProperty('--c', m.color);
    b.dataset.tap = `mood:${i + 1}`;
    b.addEventListener('click', () => rate('mood', i + 1));
    return b;
  }));

  $('scales').replaceChildren(...SCALES.map((s) => {
    const row = document.createElement('div');
    row.className = 'scale';
    const label = document.createElement('div');
    label.className = 'scale-label';
    label.textContent = s.label;
    const word = document.createElement('span');
    word.className = 'muted';
    word.textContent = e[s.key] ? ` · ${s.words[e[s.key] - 1]}` : ' · tap to rate';
    label.append(word);

    const pills = document.createElement('div');
    pills.className = 'pills';
    pills.setAttribute('role', 'radiogroup');
    pills.setAttribute('aria-label', s.label);
    pills.append(...s.words.map((w, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = i + 1;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(e[s.key] === i + 1));
      b.setAttribute('aria-label', `${s.label}: ${w}`);
      b.title = w;
      b.style.setProperty('--c', s.colors[i]);
      b.dataset.tap = `${s.key}:${i + 1}`;
      b.addEventListener('click', () => rate(s.key, i + 1));
      return b;
    }));
    row.append(label, pills);
    return row;
  }));

  const chips = allThemes().map((t) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = t;
    b.setAttribute('aria-pressed', String(e.themes.includes(t)));
    b.addEventListener('click', () => toggleTheme(t));
    return b;
  });
  const add = document.createElement('input');
  add.className = 'chip add-theme';
  add.placeholder = '+ add theme';
  add.setAttribute('aria-label', 'Add a theme');
  add.maxLength = 30;
  add.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' && ev.key !== ',') return;
    ev.preventDefault();
    const t = cleanTheme(add.value);
    if (t && !e.themes.includes(t)) toggleTheme(t, true);
  });
  $('themes').replaceChildren(...chips, add);

  renderSkills(e);
  $('keyBtn').setAttribute('aria-pressed', String(e.keyEvent));
  fields.meaning.hidden = !e.keyEvent;

  $('doneBadge').hidden = !isComplete(e);

  // Jelly squish + ripple on the button that was just tapped.
  const tapped = lastTap && document.querySelector(`.checkin [data-tap="${lastTap}"]`);
  lastTap = null;
  if (tapped) {
    tapped.classList.add('jelly');
    tapped.addEventListener('animationend', () => tapped.classList.remove('jelly'), { once: true });
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    tapped.append(ripple);
    setTimeout(() => ripple.remove(), 700);
  }
}

// ---------- Actions ----------

function current() {
  return entries.find((e) => e.id === currentId);
}

function isComplete(e) {
  return !!(e.mood && e.energy && e.anxiety && e.sleep);
}

function rate(key, value) {
  const e = current();
  const wasComplete = isComplete(e);
  e[key] = e[key] === value ? null : value;
  lastTap = `${key}:${value}`;
  renderCheckin();
  touch();
  if (!wasComplete && isComplete(e)) document.dispatchEvent(new Event('diary:checkin-done'));
}

// The main pane shows one of: editor, report, brief, rewards, privacy.
function hideViews() {
  $('report').hidden = true;
  $('rewards').hidden = true;
  $('privacy').hidden = true;
  $('brief').hidden = true;
}

// Skills: only what was actually used, plus an honest "need review" chip.
function renderSkills(e) {
  const custom = entries.flatMap((x) => x.skills).filter((s) => !DEFAULT_SKILLS.includes(s));
  const chips = [...DEFAULT_SKILLS, ...[...new Set(custom)].sort()].map((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = s;
    b.setAttribute('aria-pressed', String(e.skills.includes(s)));
    b.addEventListener('click', () => toggleSkill(s));
    return b;
  });
  const review = document.createElement('button');
  review.type = 'button';
  review.className = 'chip review-chip';
  review.textContent = "Didn't use skills, need review";
  review.setAttribute('aria-pressed', String(e.skillsReview));
  review.addEventListener('click', () => {
    e.skillsReview = !e.skillsReview;
    renderSkills(e);
    touch();
  });
  const add = document.createElement('input');
  add.className = 'chip add-theme add-skill';
  add.placeholder = '+ add skill';
  add.setAttribute('aria-label', 'Add a skill');
  add.maxLength = 30;
  add.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter') return;
    ev.preventDefault();
    const s = cleanSkill(add.value);
    if (s && !e.skills.includes(s)) toggleSkill(s, true);
  });
  $('skills').replaceChildren(...chips, review, add);
}

function toggleSkill(s, refocus) {
  const e = current();
  e.skills = e.skills.includes(s) ? e.skills.filter((x) => x !== s) : [...e.skills, s];
  renderSkills(e);
  if (refocus) document.querySelector('.add-skill').focus();
  touch();
}

// ---------- Sleep entry (the night before the entry's date) ----------

function nightBefore(iso) {
  const d = new Date(iso + 'T00:00');
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function renderSleep() {
  const e = current();
  if (!e) return;
  const night = nightBefore(e.date);
  const n = sleepLog[night];
  const short = (iso) => new Date(iso + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  $('sleepNight').textContent = `Night of ${short(night)} → ${short(e.date)}`;
  $('sleepBed').value = n?.bedtime || '';
  $('sleepWake').value = n?.wake || '';
  $('sleepH').value = n?.asleepMin != null ? Math.floor(n.asleepMin / 60) : '';
  $('sleepM').value = n?.asleepMin != null ? n.asleepMin % 60 : '';
  $('sleepAwake').value = n?.awakeMin ?? '';
  $('sleepScore').value = n?.score ?? '';
  $('sleepEst').checked = !!n?.estimated;
  renderSleepTotal(n);
}

function renderSleepTotal(n) {
  const t = sleepTotal(n);
  $('sleepTotal').textContent = t.min == null ? ''
    : `${formatMinutes(t.min)}${t.calculated ? ' (calculated)' : ''}${n.estimated ? ' · estimated' : ''}`;
}

function onSleepInput() {
  const e = current();
  if (!e) return;
  const night = nightBefore(e.date);
  const h = $('sleepH').value, m = $('sleepM').value;
  const n = cleanSleep({
    bedtime: $('sleepBed').value,
    wake: $('sleepWake').value,
    asleepMin: h === '' && m === '' ? null : (Number(h) || 0) * 60 + (Number(m) || 0),
    awakeMin: $('sleepAwake').value,
    score: $('sleepScore').value,
    estimated: $('sleepEst').checked,
  });
  const empty = !n.bedtime && !n.wake && n.asleepMin == null && n.awakeMin == null && n.score == null;
  if (empty) delete sleepLog[night];
  else sleepLog[night] = n;
  renderSleepTotal(empty ? null : n);
  setStatus('Saving…');
  clearTimeout(sleepTimer);
  sleepTimer = setTimeout(() => { persistSleep(); setStatus(vaultKey ? 'Saved 🔒' : 'Saved'); }, 400);
}

function toggleTheme(t, refocus) {
  const e = current();
  e.themes = e.themes.includes(t) ? e.themes.filter((x) => x !== t) : [...e.themes, t];
  renderCheckin();
  if (refocus) document.querySelector('.add-theme').focus();
  touch();
}

function openEntry(id) {
  currentId = id;
  const e = current();
  fields.date.value = e.date;
  fields.title.value = e.title;
  fields.body.value = e.body;
  fields.oneLiner.value = e.oneLiner;
  fields.meaning.value = e.meaning;
  renderSleep();
  hideViews();
  renderCheckin();
  form.hidden = false;
  form.classList.remove('swing');
  void form.offsetWidth; // restart the swing-in animation
  form.classList.add('swing');
  $('placeholder').hidden = true;
  app.classList.add('editing');
  setStatus(new Date(e.updatedAt).toLocaleString());
  renderList();
  document.dispatchEvent(new Event('diary:entry-opened'));
}

function newEntry() {
  const e = normalize({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), date: today(), body: '' });
  entries.push(e);
  persist();
  openEntry(e.id);
}

// Opens today's latest entry, or starts one.
function checkIn() {
  const todays = sorted(entries).find((e) => e.date === today());
  if (todays) openEntry(todays.id);
  else newEntry();
  document.querySelector('#moods button').focus();
}

function closeEditor() {
  currentId = null;
  form.hidden = true;
  hideViews();
  $('placeholder').hidden = false;
  app.classList.remove('editing');
  renderList();
}

// Debounced autosave after typing or rating.
function touch() {
  const e = current();
  if (!e) return;
  e.date = fields.date.value || today();
  e.title = fields.title.value;
  e.body = fields.body.value;
  e.oneLiner = fields.oneLiner.value;
  e.meaning = fields.meaning.value;
  e.updatedAt = Date.now();
  setStatus('Saving…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { persist(); renderList(); }, 400);
}

function deleteEntry() {
  const e = current();
  if (!e || !confirm(`Delete "${e.title || 'Untitled'}"? This can't be undone.`)) return;
  entries = entries.filter((x) => x.id !== e.id);
  persist();
  closeEditor();
}

function exportBackup() {
  const backup = { format: 'my-diary', version: 5, entries, reports, talkItems, sleep: sleepLog, briefs };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `diary-backup-${today()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Accepts old plain-array backups and v2/v3 backups. Only adds entries and
// bring-to-therapy items whose id is new, and report weeks / sleep nights not yet present.
async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    const list = Array.isArray(data) ? data : Array.isArray(data?.entries) ? data.entries : null;
    if (!list) throw new Error('not a backup');
    const known = new Set(entries.map((e) => e.id));
    const added = list.filter((e) => isEntry(e) && !known.has(String(e.id))).map(normalize);
    entries.push(...added);
    persist();

    let weeks = 0;
    const incoming = data?.reports && typeof data.reports === 'object' ? data.reports : {};
    for (const [week, r] of Object.entries(incoming)) {
      if (ISO_DATE.test(week) && r && typeof r === 'object' && !reports[week]) {
        reports[week] = cleanReport(r);
        weeks++;
      }
    }
    if (weeks) persistReports();

    const knownTalk = new Set(talkItems.map((t) => t.id));
    const newTalk = (Array.isArray(data?.talkItems) ? data.talkItems : [])
      .map(cleanTalk).filter((t) => t && !knownTalk.has(t.id));
    talkItems.push(...newTalk);
    if (newTalk.length) persistTalk();

    const newNights = Object.entries(cleanSleepLog(data?.sleep)).filter(([night]) => !sleepLog[night]);
    newNights.forEach(([night, n]) => { sleepLog[night] = n; });
    if (newNights.length) persistSleep();

    const inBriefs = cleanBriefs(data?.briefs);
    const newSessions = inBriefs.sessions.filter((s) => !briefs.sessions.includes(s));
    if (newSessions.length || Object.keys(inBriefs.notes).some((s) => !briefs.notes[s])) {
      briefs.sessions = [...new Set([...briefs.sessions, ...inBriefs.sessions])].sort();
      Object.entries(inBriefs.notes).forEach(([s, n]) => { if (!briefs.notes[s]) briefs.notes[s] = n; });
      persistBriefs();
    }

    renderList();
    document.dispatchEvent(new Event('diary:imported'));
    const extras = [
      weeks ? `${weeks} week${weeks === 1 ? '' : 's'} of report notes` : '',
      newTalk.length ? `${newTalk.length} bring-to-therapy item${newTalk.length === 1 ? '' : 's'}` : '',
      newNights.length ? `${newNights.length} night${newNights.length === 1 ? '' : 's'} of sleep` : '',
      newSessions.length ? `${newSessions.length} therapy session${newSessions.length === 1 ? '' : 's'}` : '',
    ].filter(Boolean);
    alert(`Imported ${added.length} new entr${added.length === 1 ? 'y' : 'ies'}`
      + (extras.length ? `, ${extras.join(' and ')}.` : '.'));
  } catch {
    alert('That file is not a valid diary backup.');
  }
}

// ---------- Preferences (theme, calm mode) ----------

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY)) || {};
  } catch {
    return {};
  }
}

const prefs = loadPrefs();

function isDark() {
  return prefs.theme ? prefs.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyPrefs() {
  const root = document.documentElement;
  if (prefs.theme) root.dataset.theme = prefs.theme;
  root.classList.toggle('calm', !!prefs.calm);
  if (prefs.palette && prefs.palette !== 'aurora') root.dataset.palette = prefs.palette;
  else delete root.dataset.palette;
  $('themeBtn').textContent = isDark() ? '☀️' : '🌌';
  $('themeBtn').title = isDark() ? 'Light theme' : 'Dark theme';
  $('calmBtn').setAttribute('aria-pressed', String(!!prefs.calm));
  $('calmBtn').title = prefs.calm ? 'Calm mode on' : 'Calm mode off';
}

function savePrefs() {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* prefs are optional */ }
  applyPrefs();
}

// ---------- Wiring ----------

$('themeBtn').addEventListener('click', () => { prefs.theme = isDark() ? 'light' : 'dark'; savePrefs(); });
$('calmBtn').addEventListener('click', () => { prefs.calm = !prefs.calm; savePrefs(); });
$('checkinBtn').addEventListener('click', checkIn);
$('newBtn').addEventListener('click', () => { newEntry(); fields.title.focus(); });
$('backBtn').addEventListener('click', closeEditor);
$('deleteBtn').addEventListener('click', deleteEntry);
$('exportBtn').addEventListener('click', exportBackup);
$('importInput').addEventListener('change', (ev) => {
  if (ev.target.files[0]) importBackup(ev.target.files[0]);
  ev.target.value = '';
});
$('search').addEventListener('input', () => { animateList = true; renderList(); });
Object.values(fields).forEach((f) => f.addEventListener('input', touch));
fields.date.addEventListener('input', renderSleep); // a new date means a different night
SLEEP_INPUTS.forEach((id) => $(id).addEventListener(id === 'sleepEst' ? 'change' : 'input', onSleepInput));
$('keyBtn').addEventListener('click', () => {
  const e = current();
  e.keyEvent = !e.keyEvent;
  $('keyBtn').setAttribute('aria-pressed', String(e.keyEvent));
  fields.meaning.hidden = !e.keyEvent;
  if (e.keyEvent) fields.meaning.focus();
  touch();
});
form.addEventListener('submit', (ev) => ev.preventDefault());

applyPrefs();
renderList();
