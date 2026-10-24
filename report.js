// Weekly therapist report. Loaded after app.js and uses its entries, prefs and helpers.

const METRICS = [
  { key: 'mood', label: 'Mood', color: '#7f9cff', goodHigh: true },
  { key: 'energy', label: 'Energy', color: '#5dcaa5', goodHigh: true },
  { key: 'anxiety', label: 'Anxiety', color: '#e24b6a', goodHigh: false },
  { key: 'sleep', label: 'Sleep', color: '#b18cff', goodHigh: true },
];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// Auto-filled notes. The older free-text `talk` note only shows if it has text.
const NOTE_FIELDS = [
  { key: 'wins', label: 'Wins', placeholder: 'What went well this week?' },
  { key: 'struggles', label: 'Struggles', placeholder: 'What was hard?' },
];
const EXTRA_NOTE = { key: 'talk', label: 'Extra notes', placeholder: 'Anything else' };

const reportEl = $('report');
const hiddenLines = new Set();
let weekOffset = 0; // 0 = this week, -1 = last week, …
let notesTimer = null;
let countedWeek = null; // week whose tile numbers already counted up

// ---------- Week math (local dates as YYYY-MM-DD) ----------

function isoOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(iso, n) {
  const d = new Date(iso + 'T00:00');
  d.setDate(d.getDate() + n);
  return isoOf(d);
}

function weekStartDay() {
  return Number.isInteger(prefs.weekStart) ? prefs.weekStart : 1;
}

function startOfWeek(iso) {
  const d = new Date(iso + 'T00:00');
  d.setDate(d.getDate() - ((d.getDay() - weekStartDay() + 7) % 7));
  return isoOf(d);
}

function shownWeekStart() {
  return addDays(startOfWeek(today()), 7 * weekOffset);
}

function dayName(iso, short) {
  const name = DAY_NAMES[new Date(iso + 'T00:00').getDay()];
  return short ? name.slice(0, 3) : name;
}

function average(values) {
  const v = values.filter((x) => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

// Per-day averages, week averages, themes and highlights for the week starting at `start`.
function weekData(start) {
  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const iso = addDays(start, i);
    const es = entries.filter((e) => e.date === iso);
    const day = { iso, entries: es };
    METRICS.forEach((m) => { day[m.key] = average(es.map((e) => e[m.key])); });
    return day;
  });
  const week = { start, days };
  METRICS.forEach((m) => { week[m.key] = average(days.map((d) => d[m.key])); });
  week.checkins = days.filter((d) => METRICS.some((m) => d[m.key] != null)).length;

  const counts = {};
  days.flatMap((d) => d.entries).forEach((e) => e.themes.forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
  week.themes = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  week.highlights = days.flatMap((d) => sorted(d.entries).reverse()
    .filter((e) => e.oneLiner.trim()).map((e) => ({ iso: d.iso, text: e.oneLiner.trim() })));
  return week;
}

// ---------- Small DOM helpers ----------

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function svg(tag, attrs) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

// ---------- Rendering ----------

function renderHeader(start) {
  const end = addDays(start, 6);
  const fmt = (iso, opts) => new Date(iso + 'T00:00').toLocaleDateString(undefined, opts);
  $('weekTitle').textContent = `${fmt(start, { month: 'short', day: 'numeric' })} – ${fmt(end, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  $('weekTag').textContent = weekOffset === 0 ? 'This week'
    : weekOffset === -1 ? 'Last week'
      : weekOffset < 0 ? `${-weekOffset} weeks ago` : `In ${weekOffset} week${weekOffset === 1 ? '' : 's'}`;
  $('thisWeekBtn').hidden = weekOffset === 0;
}

function renderTiles(week, prev) {
  const tiles = METRICS.map((m) => {
    const tile = el('div', 'tile');
    tile.style.setProperty('--c', m.color);
    tile.append(el('div', 'tile-label', m.label));
    tile.append(el('div', 'num', week[m.key] == null ? '–' : week[m.key].toFixed(1)));
    if (m.key === 'mood' && week.mood != null) tile.append(el('div', 'word', MOODS[Math.round(week.mood) - 1].label));
    if (week[m.key] != null && prev[m.key] != null) {
      const diff = Math.round((week[m.key] - prev[m.key]) * 10) / 10;
      const better = diff === 0 ? 'same' : (diff > 0) === m.goodHigh ? 'good' : 'bad';
      const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '=';
      tile.append(el('div', `delta ${better}`, `${arrow} ${Math.abs(diff).toFixed(1)} vs last week`));
    }
    return tile;
  });
  const count = el('div', 'tile');
  count.style.setProperty('--c', '#f2d94e');
  count.append(el('div', 'tile-label', 'Check-ins'), el('div', 'num', `${week.checkins}/7`));
  const d = week.checkins - prev.checkins;
  count.append(el('div', `delta ${d > 0 ? 'good' : d < 0 ? 'bad' : 'same'}`,
    `${d > 0 ? '▲' : d < 0 ? '▼' : '='} ${Math.abs(d)} vs last week`));
  $('tiles').replaceChildren(...tiles, count);
  // Numbers count up when the report opens or the week changes, not on every redraw.
  if (countedWeek !== week.start) $('tiles').querySelectorAll('.num').forEach(countUp);
  countedWeek = week.start;
}

function renderLegend() {
  $('legend').replaceChildren(...METRICS.map((m) => {
    const b = el('button', 'legend-item', m.label);
    b.type = 'button';
    b.style.setProperty('--c', m.color);
    b.setAttribute('aria-pressed', String(!hiddenLines.has(m.key)));
    b.addEventListener('click', () => {
      if (hiddenLines.has(m.key)) hiddenLines.delete(m.key); else hiddenLines.add(m.key);
      renderReport();
    });
    return b;
  }));
}

function renderChart(week, prev) {
  // Match the chart's real width (up to 640) so labels stay readable on phones.
  const W = Math.max(300, Math.min(640, $('chart').clientWidth || 640));
  const H = W < 480 ? 220 : 250, L = 34, R = 18, T = 16, B = 34;
  const x = (i) => L + (i * (W - L - R)) / 6;
  const y = (v) => T + ((5 - v) * (H - T - B)) / 4;
  const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Line chart of mood, energy, anxiety and sleep for each day' });

  for (let v = 1; v <= 5; v++) {
    root.append(svg('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), class: 'grid-line' }));
    const label = svg('text', { x: L - 12, y: y(v) + 4, 'text-anchor': 'middle', class: 'axis' });
    label.textContent = v;
    root.append(label);
  }
  week.days.forEach((d, i) => {
    const label = svg('text', { x: x(i), y: H - 10, 'text-anchor': 'middle', class: 'axis' });
    label.textContent = dayName(d.iso, true);
    root.append(label);
  });

  // A path that breaks at days with no value.
  const pathFor = (values) => {
    let dPath = '', pen = false;
    values.forEach((v, i) => {
      if (v == null) { pen = false; return; }
      dPath += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)} `;
      pen = true;
    });
    return dPath.trim();
  };

  if (!hiddenLines.has('mood')) {
    const ghost = pathFor(prev.days.map((d) => d.mood));
    if (ghost) root.append(svg('path', { d: ghost, class: 'line ghost', stroke: METRICS[0].color }));
  }
  METRICS.filter((m) => !hiddenLines.has(m.key)).forEach((m) => {
    const values = week.days.map((d) => d[m.key]);
    const dPath = pathFor(values);
    if (dPath) root.append(svg('path', { d: dPath, class: 'line', stroke: m.color, style: `--c:${m.color}` }));
    values.forEach((v, i) => {
      if (v == null) return;
      const dot = svg('circle', { cx: x(i), cy: y(v), r: 5, class: 'dot', fill: m.color });
      const tip = svg('title');
      tip.textContent = `${dayName(week.days[i].iso)} · ${m.label} ${v.toFixed(1)}`;
      dot.append(tip);
      root.append(dot);
    });
  });

  const box = $('chart');
  box.replaceChildren(root);
  if (week.checkins === 0) box.append(el('p', 'muted chart-empty', 'No check-ins this week yet.'));
}

function renderStrip(week) {
  $('strip').replaceChildren(...week.days.map((d) => {
    const cell = el('div', d.mood == null ? 'day empty' : 'day');
    const block = el('div', 'block');
    if (d.mood != null) {
      const m = MOODS[Math.round(d.mood) - 1];
      block.style.setProperty('--c', m.color);
      block.title = `${dayName(d.iso)}: ${m.label}`;
    }
    cell.append(block, el('div', 'day-name', dayName(d.iso, true)),
      el('div', 'day-mood', d.mood == null ? '–' : MOODS[Math.round(d.mood) - 1].label));
    return cell;
  }));
}

function renderThemes(week) {
  const box = $('topThemes');
  if (!week.themes.length) {
    box.replaceChildren(el('p', 'muted', 'No themes tagged this week.'));
    return;
  }
  const max = week.themes[0][1];
  box.replaceChildren(...week.themes.slice(0, 6).map(([t, n]) => {
    const row = el('div', 'theme-row');
    const bar = el('div', 'theme-bar');
    bar.style.setProperty('--w', `${(n / max) * 100}%`);
    row.append(el('span', 'mini-chip', t), bar, el('span', 'muted', `${n}×`));
    return row;
  }));
}

function renderHighlights(week) {
  const items = week.highlights.map((h) => {
    const li = el('li');
    li.append(el('strong', '', dayName(h.iso, true)), el('span', '', h.text));
    return li;
  });
  $('highlights').replaceChildren(...(items.length ? items : [el('li', 'muted', 'No "biggest thing today" notes this week.')]));
}

// Suggested note text, rebuilt from the week's entries.
function autoNote(week, key) {
  const lines = [];
  week.days.forEach((d) => d.entries.forEach((e) => {
    const what = e.oneLiner.trim() || e.title.trim();
    if (key === 'wins' && (e.themes.includes('win') || e.mood >= 4) && what) lines.push(`• ${dayName(d.iso, true)}: ${what}`);
    if (key === 'struggles' && ((e.mood && e.mood <= 2) || e.anxiety >= 4)) {
      const why = [e.mood && e.mood <= 2 ? `mood ${MOODS[e.mood - 1].label.toLowerCase()}` : '', e.anxiety >= 4 ? 'high anxiety' : '']
        .filter(Boolean).join(', ');
      lines.push(`• ${dayName(d.iso, true)}: ${what || 'hard day'} (${why})`);
    }
  }));
  return lines.join('\n');
}

// Saves one field of a week's report notes (debounced).
function saveReportField(start, key, value) {
  reports[start] = { ...cleanReport(reports[start] || {}), [key]: value, updatedAt: Date.now() };
  clearTimeout(notesTimer);
  notesTimer = setTimeout(persistReports, 400);
}

function renderNotes(week) {
  const saved = reports[week.start] || {};
  const fields = saved.talk ? [...NOTE_FIELDS, EXTRA_NOTE] : NOTE_FIELDS;
  $('notes').replaceChildren(...fields.map((f) => {
    const wrap = el('label', 'note');
    const value = saved[f.key] == null ? autoNote(week, f.key) : saved[f.key];
    const area = el('textarea');
    area.value = value;
    area.placeholder = f.placeholder;
    area.dataset.auto = String(saved[f.key] == null);
    const printText = el('div', 'print-text', value || '—');
    area.addEventListener('input', () => {
      area.dataset.auto = 'false';
      printText.textContent = area.value || '—';
      saveReportField(week.start, f.key, area.value);
    });
    wrap.append(el('span', 'note-label', f.label), area, printText);
    return wrap;
  }));
}

// ---------- Bring-to-therapy list ----------

function addTalk(text) {
  const t = cleanTalk({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), text, addedOn: today() });
  if (!t) return false;
  talkItems.push(t);
  persistTalk();
  renderHome();
  if (!reportEl.hidden) renderTalk(shownWeekStart());
  return true;
}

// Items still open at some point that week: added by its end, not discussed before it.
function renderTalk(start) {
  const end = addDays(start, 6);
  const shown = talkItems
    .filter((t) => t.addedOn <= end && (!t.discussedOn || t.discussedOn >= start))
    .map((t) => ({ t, done: !!t.discussedOn && t.discussedOn <= end }))
    .sort((a, b) => a.done - b.done || a.t.addedOn.localeCompare(b.t.addedOn));

  const items = shown.map(({ t, done }) => {
    const li = el('li', done ? 'done' : '');
    const box = el('input');
    box.type = 'checkbox';
    box.checked = done;
    box.setAttribute('aria-label', `Discussed: ${t.text}`);
    box.addEventListener('change', () => {
      t.discussedOn = box.checked ? (today() <= end ? today() : end) : null;
      persistTalk();
      renderTalk(start);
      renderHome();
    });
    const text = el('span', 'talk-text', t.text);
    li.append(box, text);
    if (t.addedOn < start) li.append(el('span', 'mini-chip', 'carried over'));
    const remove = el('button', 'talk-remove', '×');
    remove.type = 'button';
    remove.setAttribute('aria-label', `Remove: ${t.text}`);
    remove.addEventListener('click', () => {
      talkItems = talkItems.filter((x) => x !== t);
      persistTalk();
      renderTalk(start);
      renderHome();
    });
    li.append(remove);
    return li;
  });
  $('talkList').replaceChildren(...(items.length ? items
    : [el('li', 'muted', 'Nothing yet. Tap 💬 anytime to add something.')]));
}

function renderAfterSession(start) {
  const saved = reports[start] || {};
  $('sessionNotes').value = saved.sessionNotes || '';
  $('sessionNotesPrint').textContent = saved.sessionNotes || '—';
  $('goalInput').value = saved.goal || '';
  $('goalPrint').textContent = saved.goal || '—';
}

// Sidebar: latest goal (this week's, else the most recent earlier one) and open item count.
function renderHome() {
  const thisWeek = startOfWeek(today());
  const week = Object.keys(reports).filter((w) => w <= thisWeek && reports[w].goal && reports[w].goal.trim()).sort().pop();
  $('goalCard').hidden = !week;
  $('goalText').textContent = week ? reports[week].goal : '';
  const open = talkItems.filter((t) => !t.discussedOn).length;
  $('talkCount').hidden = open === 0;
  $('talkCount').textContent = `💬 ${open} thing${open === 1 ? '' : 's'} to bring up`;
}

function showToast(text) {
  const t = $('toast');
  t.textContent = text;
  t.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { t.hidden = true; }, 1800);
}

function toggleQuickAdd(open) {
  $('quickAdd').hidden = !open;
  if (open) $('quickInput').focus();
}

function renderReport() {
  const start = shownWeekStart();
  const week = weekData(start);
  const prev = weekData(addDays(start, -7));
  renderHeader(start);
  renderTiles(week, prev);
  renderLegend();
  renderChart(week, prev);
  renderStrip(week);
  renderThemes(week);
  renderHighlights(week);
  renderTalk(start);
  renderNotes(week);
  renderAfterSession(start);
}

// ---------- Open / close ----------

function openReport() {
  currentId = null;
  form.hidden = true;
  $('placeholder').hidden = true;
  hideViews();
  reportEl.hidden = false;
  reportEl.classList.remove('swing');
  void reportEl.offsetWidth; // restart the swing-in animation
  reportEl.classList.add('swing');
  app.classList.add('editing');
  countedWeek = null;
  renderList();
  renderReport();
}

function refillNotes() {
  const start = shownWeekStart();
  const saved = reports[start];
  const edited = saved && NOTE_FIELDS.some((f) => saved[f.key] != null);
  if (edited && !confirm('Replace your wins and struggles with suggestions from this week\'s entries?')) return;
  if (saved) {
    NOTE_FIELDS.forEach((f) => { saved[f.key] = null; });
    persistReports();
  }
  renderNotes(weekData(start));
}

$('weekStart').replaceChildren(...DAY_NAMES.map((name, i) => {
  const o = el('option', '', name);
  o.value = i;
  return o;
}));
$('weekStart').value = weekStartDay();
$('weekStart').addEventListener('change', (ev) => {
  prefs.weekStart = Number(ev.target.value);
  savePrefs();
  weekOffset = 0;
  renderReport();
});

$('reportBtn').addEventListener('click', () => { weekOffset = 0; openReport(); });
$('reportBack').addEventListener('click', closeEditor);
$('prevWeek').addEventListener('click', () => { weekOffset--; renderReport(); });
$('nextWeek').addEventListener('click', () => { weekOffset++; renderReport(); });
$('thisWeekBtn').addEventListener('click', () => { weekOffset = 0; renderReport(); });
$('refillBtn').addEventListener('click', refillNotes);
$('printBtn').addEventListener('click', () => window.print());

$('talkAdd').addEventListener('keydown', (ev) => {
  if (ev.key !== 'Enter') return;
  if (addTalk(ev.target.value)) { ev.target.value = ''; showToast('Added'); }
});
$('sessionNotes').addEventListener('input', (ev) => {
  $('sessionNotesPrint').textContent = ev.target.value || '—';
  saveReportField(shownWeekStart(), 'sessionNotes', ev.target.value);
});
$('goalInput').addEventListener('input', (ev) => {
  $('goalPrint').textContent = ev.target.value || '—';
  saveReportField(shownWeekStart(), 'goal', ev.target.value);
  renderHome();
});
$('goalCard').addEventListener('click', () => { weekOffset = 0; openReport(); });

$('fab').addEventListener('click', (ev) => { ev.stopPropagation(); toggleQuickAdd($('quickAdd').hidden); });
$('quickInput').addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') toggleQuickAdd(false);
  if (ev.key !== 'Enter') return;
  if (addTalk(ev.target.value)) {
    ev.target.value = '';
    toggleQuickAdd(false);
    showToast('Added to your therapy list 💬');
  }
});
document.addEventListener('click', (ev) => {
  if (!$('quickAdd').hidden && !ev.target.closest('#quickAdd, #fab')) toggleQuickAdd(false);
});
['diary:imported', 'diary:unlocked'].forEach((name) => document.addEventListener(name, () => {
  renderHome();
  if (!reportEl.hidden) renderReport();
}));
renderHome();

let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { if (!reportEl.hidden) renderChart(weekData(shownWeekStart()), weekData(addDays(shownWeekStart(), -7))); }, 200);
});
