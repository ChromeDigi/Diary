// My Diary: entries are stored only in this browser's localStorage.

const STORAGE_KEY = 'diary.entries.v1';
const PREFS_KEY = 'diary.prefs.v1';
// Each mood emoji gets a color for its orb and list glow.
const MOODS = ['😄', '🙂', '😐', '😔', '😢', '😡'];
const MOOD_COLORS = {
  '😄': '#7f9cff', '🙂': '#5dcaa5', '😐': '#f2d94e',
  '😔': '#ef9f27', '😢': '#5b8def', '😡': '#e24b6a',
};
const MOOD_LABELS = {
  '😄': 'Great', '🙂': 'Good', '😐': 'Okay', '😔': 'Low', '😢': 'Sad', '😡': 'Angry',
};

const $ = (id) => document.getElementById(id);
const app = $('app');
const list = $('entryList');
const form = $('entryForm');
const fields = { date: $('date'), title: $('title'), body: $('body') };

let entries = load();
let currentId = null;
let saveTimer = null;

// ---------- Storage ----------

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    setStatus('Saved');
  } catch {
    setStatus('Could not save. Export a backup!');
  }
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

// ---------- Rendering ----------

function renderList() {
  const q = $('search').value.trim().toLowerCase();
  const shown = sorted(entries).filter((e) =>
    !q || e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q));

  list.replaceChildren(...shown.map((e) => {
    const li = document.createElement('li');
    li.className = e.id === currentId ? 'active' : '';
    if (MOOD_COLORS[e.mood]) li.style.setProperty('--c', MOOD_COLORS[e.mood]);
    li.innerHTML = `
      <div class="entry-meta"><span></span><span></span></div>
      <div class="entry-title"></div>
      <div class="entry-snippet"></div>`;
    li.querySelector('.entry-meta span:first-child').textContent = formatDate(e.date);
    li.querySelector('.entry-meta span:last-child').textContent = e.mood || '';
    li.querySelector('.entry-title').textContent = e.title || 'Untitled';
    li.querySelector('.entry-snippet').textContent = e.body.slice(0, 80) || 'Empty entry';
    li.addEventListener('click', () => openEntry(e.id));
    return li;
  }));

  $('emptyList').hidden = entries.length > 0;
}

function renderMoods(selected) {
  $('moods').replaceChildren(...MOODS.map((m) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = m;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(m === selected));
    b.setAttribute('aria-label', MOOD_LABELS[m]);
    b.title = MOOD_LABELS[m];
    b.style.setProperty('--c', MOOD_COLORS[m]);
    b.addEventListener('click', () => {
      const entry = current();
      entry.mood = entry.mood === m ? '' : m;
      renderMoods(entry.mood);
      touch();
    });
    return b;
  }));
}

// ---------- Actions ----------

function current() {
  return entries.find((e) => e.id === currentId);
}

function openEntry(id) {
  currentId = id;
  const e = current();
  fields.date.value = e.date;
  fields.title.value = e.title;
  fields.body.value = e.body;
  renderMoods(e.mood);
  form.hidden = false;
  form.classList.remove('swing');
  void form.offsetWidth; // restart the swing-in animation
  form.classList.add('swing');
  $('placeholder').hidden = true;
  app.classList.add('editing');
  setStatus(new Date(e.updatedAt).toLocaleString());
  renderList();
}

function newEntry() {
  const e = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    date: today(),
    title: '',
    body: '',
    mood: '',
    updatedAt: Date.now(),
  };
  entries.push(e);
  persist();
  openEntry(e.id);
  fields.title.focus();
}

function closeEditor() {
  currentId = null;
  form.hidden = true;
  $('placeholder').hidden = false;
  app.classList.remove('editing');
  renderList();
}

// Debounced autosave after typing.
function touch() {
  const e = current();
  if (!e) return;
  e.date = fields.date.value || today();
  e.title = fields.title.value;
  e.body = fields.body.value;
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
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `diary-backup-${today()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data)) throw new Error('not a list');
    const known = new Set(entries.map((e) => e.id));
    const added = data.filter((e) => e && e.id && !known.has(e.id) && typeof e.body === 'string');
    entries.push(...added);
    persist();
    renderList();
    alert(`Imported ${added.length} new entr${added.length === 1 ? 'y' : 'ies'}.`);
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

$('newBtn').addEventListener('click', newEntry);
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
