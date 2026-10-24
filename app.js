// My Diary: entries are stored only in this browser's localStorage.

const STORAGE_KEY = 'diary.entries.v2';
const OLD_KEY = 'diary.entries.v1'; // read once for migration; only removed when the lock is turned on
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

const $ = (id) => document.getElementById(id);
const app = $('app');
const list = $('entryList');
const form = $('entryForm');
const fields = { date: $('date'), title: $('title'), body: $('body'), oneLiner: $('oneLiner') };

let vaultKey = null; // set by lock.js after unlocking; null when the lock is off
let entries = load();
let reports = loadReports();
let talkItems = loadTalk();
let currentId = null;
let saveTimer = null;

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

// Turns a v1 or v2 entry into a valid v2 entry.
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
    updatedAt: Number(e.updatedAt) || Date.now(),
  };
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
  const old = readList(OLD_KEY);
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

  list.replaceChildren(...shown.map((e) => {
    const li = document.createElement('li');
    li.className = e.id === currentId ? 'active' : '';
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

  $('doneBadge').hidden = !isComplete(e);
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
  renderCheckin();
  touch();
  if (!wasComplete && isComplete(e)) document.dispatchEvent(new Event('diary:checkin-done'));
}

// The main pane shows one of: editor, report, rewards, privacy.
function hideViews() {
  $('report').hidden = true;
  $('rewards').hidden = true;
  $('privacy').hidden = true;
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
  const backup = { format: 'my-diary', version: 3, entries, reports, talkItems };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `diary-backup-${today()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Accepts old plain-array backups and v2/v3 backups. Only adds entries and
// bring-to-therapy items whose id is new, and report notes for weeks not yet present.
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

    renderList();
    document.dispatchEvent(new Event('diary:imported'));
    const extras = [
      weeks ? `${weeks} week${weeks === 1 ? '' : 's'} of report notes` : '',
      newTalk.length ? `${newTalk.length} bring-to-therapy item${newTalk.length === 1 ? '' : 's'}` : '',
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
$('search').addEventListener('input', renderList);
Object.values(fields).forEach((f) => f.addEventListener('input', touch));
form.addEventListener('submit', (ev) => ev.preventDefault());

applyPrefs();
renderList();
