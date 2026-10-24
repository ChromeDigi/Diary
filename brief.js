// Therapy Homework Brief: builds the session-to-session brief from logged data.
// Format and rules: docs/brief-format.md. Loaded after report.js (uses el, addDays, dayName, average).

const SHORT_NIGHT_MIN = 6 * 60;
const briefEl = $('brief');
let briefSession = null; // session date shown
let briefTimer = null;

// ---------- Periods ----------

function fmtDate(iso, opts) {
  return new Date(iso + 'T00:00').toLocaleDateString(undefined, opts);
}

function periodFor(session) {
  const i = briefs.sessions.indexOf(session);
  const prev = briefs.sessions[i - 1];
  const start = briefs.notes[session]?.start || (prev ? addDays(prev, 1) : addDays(session, -13));
  return { start, end: session };
}

function rangeText({ start, end }) {
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${fmtDate(start, { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) })} – ${fmtDate(end, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function fileName({ start, end }) {
  const md = (iso) => fmtDate(iso, { month: 'short', day: 'numeric' }).replace(/\s+/g, '');
  return `Therapy_Homework_${md(start)}-${md(end)}_${end.slice(0, 4)}`;
}

function datesBetween(start, end) {
  const out = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

// ---------- Data for one period ----------

function briefData(period) {
  const days = datesBetween(period.start, period.end);
  const inPeriod = sorted(entries.filter((e) => e.date >= period.start && e.date <= period.end)).reverse();

  const nights = datesBetween(addDays(period.start, -1), addDays(period.end, -1)).map((night) => {
    const n = sleepLog[night];
    return { night, wake: addDays(night, 1), n, total: sleepTotal(n) };
  });
  const logged = nights.filter((r) => r.n);
  const totals = logged.map((r) => r.total.min).filter((m) => m != null);

  const dayStats = days.map((d) => {
    const es = inPeriod.filter((e) => e.date === d);
    return { mood: average(es.map((e) => e.mood)), anxiety: average(es.map((e) => e.anxiety)) };
  });

  const skillCounts = {};
  inPeriod.forEach((e) => e.skills.forEach((s) => { skillCounts[s] = (skillCounts[s] || 0) + 1; }));

  return {
    period,
    nights,
    logged,
    unlogged: nights.length - logged.length,
    sleepAvg: totals.length ? Math.round(average(totals)) : null,
    sleepMin: totals.length ? Math.min(...totals) : null,
    sleepMax: totals.length ? Math.max(...totals) : null,
    sleepCount: totals.length,
    shortNights: totals.filter((m) => m < SHORT_NIGHT_MIN).length,
    estimated: logged.filter((r) => r.n.estimated).length,
    mood: average(dayStats.map((d) => d.mood)),
    moodDays: dayStats.filter((d) => d.mood != null).length,
    anxiety: average(dayStats.map((d) => d.anxiety)),
    anxietyDays: dayStats.filter((d) => d.anxiety != null).length,
    keyEvents: inPeriod.filter((e) => e.keyEvent),
    skillCounts: Object.entries(skillCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    reviewDays: [...new Set(inPeriod.filter((e) => e.skillsReview).map((e) => e.date))],
    talk: talkItems.filter((t) => t.addedOn <= period.end && (!t.discussedOn || t.discussedOn >= period.start)),
  };
}

// ---------- Auto-drafted text (data only, no interpretation) ----------

function shortDate(iso) {
  return fmtDate(iso, { month: 'short', day: 'numeric' });
}

function autoText(field, d) {
  if (field === 'subtitle') {
    return [d.logged.length && 'Sleep', (d.moodDays || d.anxietyDays) && 'Mood & Anxiety',
      d.keyEvents.length && 'Key Events', (d.skillCounts.length || d.reviewDays.length) && 'Skills']
      .filter(Boolean).join(' · ') || 'Period summary';
  }
  if (field === 'headline') {
    const parts = [];
    if (d.sleepAvg != null) {
      parts.push(`Sleep averaged ${formatMinutes(d.sleepAvg)} over ${d.sleepCount} logged night${d.sleepCount === 1 ? '' : 's'}`
        + ` (range ${formatMinutes(d.sleepMin)}–${formatMinutes(d.sleepMax)}; ${d.shortNights} under 6 h).`);
    }
    const rated = [d.mood != null && `mood averaged ${d.mood.toFixed(1)}/5 over ${d.moodDays} day${d.moodDays === 1 ? '' : 's'}`,
      d.anxiety != null && `anxiety ${d.anxiety.toFixed(1)}/5 over ${d.anxietyDays} day${d.anxietyDays === 1 ? '' : 's'}`].filter(Boolean);
    if (rated.length) parts.push(`Self-ratings: ${rated.join('; ')}.`);
    if (d.keyEvents.length) parts.push(`${d.keyEvents.length} key event${d.keyEvents.length === 1 ? '' : 's'} logged.`);
    return parts.join(' ') || 'No data logged for this period yet.';
  }
  if (field === 'focus') {
    const lines = d.talk.filter((t) => !t.discussedOn || t.discussedOn > d.period.end).map((t) => `• ${t.text}`);
    if (d.reviewDays.length) {
      lines.push(`• Skills review: I noted skills weren't used on ${d.reviewDays.length} day${d.reviewDays.length === 1 ? '' : 's'} (${d.reviewDays.map(shortDate).join(', ')}).`);
    }
    d.keyEvents.slice(0, 3).forEach((e) => lines.push(`• ${shortDate(e.date)}: ${e.oneLiner.trim() || e.title.trim() || 'key event'}`));
    return lines.join('\n');
  }
  return '';
}

// ---------- Rendering ----------

function saveBriefField(session, field, value) {
  const prev = briefs.notes[session] || { start: null, subtitle: null, headline: null, focus: null, takeaway: null };
  briefs.notes[session] = { ...prev, [field]: value, updatedAt: Date.now() };
  clearTimeout(briefTimer);
  briefTimer = setTimeout(persistBriefs, 400);
}

// A block I can type into directly; shows the auto draft until I edit it.
function editable(tag, className, field, d, placeholder) {
  const saved = briefs.notes[briefSession]?.[field];
  const node = el(tag, `${className} editable`, saved == null ? autoText(field, d) : saved);
  node.contentEditable = 'true';
  node.spellcheck = true;
  node.dataset.placeholder = placeholder;
  node.dataset.auto = String(saved == null);
  node.addEventListener('input', () => {
    node.dataset.auto = 'false';
    saveBriefField(briefSession, field, node.innerText);
  });
  return node;
}

const BRIEF_FOOTNOTE = 'Sleep values are entered from Apple Health; "est." = estimated, "calc." = calculated from bedtime/wake. '
  + 'Mood and anxiety are my own 1–5 ratings. Missing values are left blank, not filled in.';

function skillsText(d) {
  const used = d.skillCounts.length
    ? `Used: ${d.skillCounts.map(([s, n]) => `${s} (${n}×)`).join(', ')}.`
    : 'No skills logged as used this period.';
  const review = d.reviewDays.length
    ? ` Noted as not used / need review on ${d.reviewDays.length} day${d.reviewDays.length === 1 ? '' : 's'}: ${d.reviewDays.map(shortDate).join(', ')}.`
    : '';
  return used + review;
}

// The text shown for an editable part: my edit, else the auto draft.
function fieldText(field, d) {
  const saved = briefs.notes[briefSession]?.[field];
  return saved == null ? autoText(field, d) : saved;
}

// Up to 4 dashboard cards, only for metrics the data supports.
function cardData(d) {
  const cards = [];
  if (d.sleepAvg != null) cards.push({ label: 'Average sleep', value: formatMinutes(d.sleepAvg), sub: `${d.sleepCount} night${d.sleepCount === 1 ? '' : 's'} · range ${formatMinutes(d.sleepMin)}–${formatMinutes(d.sleepMax)}` });
  if (d.sleepCount) cards.push({ label: 'Short nights (< 6 h)', value: `${d.shortNights} of ${d.sleepCount}`, sub: d.estimated ? `${d.estimated} estimated` : 'all as logged' });
  if (d.mood != null) cards.push({ label: 'Mood (self-rated)', value: `${d.mood.toFixed(1)} / 5`, sub: `${d.moodDays} day${d.moodDays === 1 ? '' : 's'}` });
  if (d.anxiety != null) cards.push({ label: 'Anxiety (self-rated)', value: `${d.anxiety.toFixed(1)} / 5`, sub: `${d.anxietyDays} day${d.anxietyDays === 1 ? '' : 's'}` });
  return cards.slice(0, 4);
}

function briefCard(label, value, sub) {
  const c = el('div', 'b-card');
  c.append(el('div', 'b-card-label', label), el('div', 'b-card-value', value));
  if (sub) c.append(el('div', 'b-card-sub', sub));
  return c;
}

function cell(row, text, className) {
  const td = el('td', className || '', text);
  row.append(td);
  return td;
}

function renderBriefDoc() {
  const doc = $('briefDoc');
  const period = periodFor(briefSession);
  const d = briefData(period);

  const head = el('header', 'b-head');
  head.append(el('h1', 'b-title', 'THERAPY HOMEWORK BRIEF'), el('div', 'b-range', rangeText(period)),
    editable('div', 'b-subtitle', 'subtitle', d, 'Main domains'));

  const headline = el('section', 'b-section');
  headline.append(el('h2', '', 'Period headline'),
    editable('p', 'b-headline', 'headline', d, '1–3 sentences on the main pattern for this period'));

  const cards = cardData(d).map((c) => briefCard(c.label, c.value, c.sub));
  const dash = el('section', 'b-cards');
  dash.append(...cards);

  const sleep = el('section', 'b-section');
  sleep.append(el('h2', '', 'Sleep snapshot'));
  if (d.logged.length) {
    const table = el('table', 'b-table');
    const hr = el('tr');
    ['Night of → wake', 'Total', 'Bedtime', 'Wake', 'Awake', 'Sleep score', 'Note'].forEach((h) => hr.append(el('th', '', h)));
    table.append(el('thead'), el('tbody'));
    table.tHead.append(hr);
    d.logged.forEach((r) => {
      const tr = el('tr', r.total.min != null && r.total.min < SHORT_NIGHT_MIN ? 'short' : '');
      cell(tr, `${fmtDate(r.night, { weekday: 'short', month: 'short', day: 'numeric' })} → ${fmtDate(r.wake, { weekday: 'short' })}`);
      cell(tr, formatMinutes(r.total.min), 'num');
      cell(tr, r.n.bedtime || '–', 'num');
      cell(tr, r.n.wake || '–', 'num');
      cell(tr, r.n.awakeMin != null ? `${r.n.awakeMin} min` : '–', 'num');
      cell(tr, r.n.score != null ? String(r.n.score) : '–', 'num');
      cell(tr, [r.n.estimated && 'est.', r.total.calculated && 'calc.'].filter(Boolean).join(', '), 'b-note');
      table.tBodies[0].append(tr);
    });
    sleep.append(table);
    if (d.unlogged) sleep.append(el('p', 'b-small', `${d.unlogged} night${d.unlogged === 1 ? '' : 's'} not logged (left blank, not estimated).`));
  } else {
    sleep.append(el('p', 'b-small', 'No sleep logged for this period.'));
  }

  const events = el('section', 'b-section');
  events.append(el('h2', '', 'Key events & functioning'));
  if (d.keyEvents.length) {
    const table = el('table', 'b-table b-events');
    const hr = el('tr');
    ['Date', 'What happened', 'Why it matters'].forEach((h) => hr.append(el('th', '', h)));
    table.append(el('thead'), el('tbody'));
    table.tHead.append(hr);
    d.keyEvents.forEach((e) => {
      const tr = el('tr');
      cell(tr, fmtDate(e.date, { weekday: 'short', month: 'short', day: 'numeric' }), 'date');
      cell(tr, e.oneLiner.trim() || e.title.trim() || '–');
      const why = cell(tr, e.meaning.trim() || '–');
      if (e.skills.length) why.append(el('div', 'b-skills', `Skills used: ${e.skills.join(', ')}`));
      if (e.skillsReview) why.append(el('div', 'b-skills', 'Skills not used; need review'));
      table.tBodies[0].append(tr);
    });
    events.append(table);
  } else {
    events.append(el('p', 'b-small', 'No key events marked for this period.'));
  }

  const skills = el('section', 'b-section');
  skills.append(el('h2', '', 'Skills'));
  skills.append(el('p', '', skillsText(d)));

  const focus = el('section', 'b-section');
  focus.append(el('h2', '', 'Therapy focus'), editable('div', 'b-focus', 'focus', d, 'The 2–4 issues worth discussing next'));

  const takeaway = el('section', 'b-section b-takeaway');
  takeaway.append(el('h2', '', 'Overall takeaway'), editable('p', '', 'takeaway', d, 'One short closing synthesis'));

  const foot = el('footer', 'b-foot', BRIEF_FOOTNOTE);

  doc.replaceChildren(head, headline, ...(cards.length ? [dash] : []), sleep, events, skills, focus, takeaway, foot);
}

// ---------- Word (.docx) copy, same content and order as the page ----------

function briefDocxBody() {
  const period = periodFor(briefSession);
  const d = briefData(period);
  const NAVY = '1B365D', STEEL = '4A6A8A', SOFT = '5B6B7C';
  const heading = (t) => wPara(t, { bold: true, caps: true, color: NAVY, size: 10, before: 12, after: 4, border: 'D6E0EA' });
  const small = (t) => wPara(t, { color: SOFT, size: 8.5 });
  const out = [
    wPara('THERAPY HOMEWORK BRIEF', { bold: true, color: NAVY, size: 17, align: 'center', after: 2 }),
    wPara(rangeText(period), { bold: true, color: STEEL, size: 11, align: 'center', after: 2 }),
    wPara(fieldText('subtitle', d), { color: SOFT, size: 9.5, align: 'center', after: 8, border: NAVY, borderSize: 12 }),
    heading('Period headline'),
    wPara(fieldText('headline', d) || ' ', { size: 11 }),
  ];

  const cards = cardData(d);
  if (cards.length) {
    const w = Math.floor(10080 / cards.length);
    out.push(wTable([cards.map((c) => wPara(c.label, { bold: true, caps: true, color: SOFT, size: 7.5, after: 0 })
      + wPara(c.value, { bold: true, color: NAVY, size: 15, after: 0 })
      + wPara(c.sub, { color: SOFT, size: 8, after: 0 }))],
    { widths: cards.map(() => w), fills: ['EEF3F8'], borderColor: 'FFFFFF' }), wPara(' ', { after: 0 }));
  }

  out.push(heading('Sleep snapshot'));
  if (d.logged.length) {
    const head = ['Night of → wake', 'Total', 'Bedtime', 'Wake', 'Awake', 'Score', 'Note']
      .map((h) => wPara(h, { bold: true, color: 'FFFFFF', size: 9, after: 0 }));
    const rows = d.logged.map((r) => [
      `${fmtDate(r.night, { weekday: 'short', month: 'short', day: 'numeric' })} → ${fmtDate(r.wake, { weekday: 'short' })}`,
      formatMinutes(r.total.min), r.n.bedtime || '–', r.n.wake || '–',
      r.n.awakeMin != null ? `${r.n.awakeMin} min` : '–', r.n.score != null ? String(r.n.score) : '–',
      [r.n.estimated && 'est.', r.total.calculated && 'calc.'].filter(Boolean).join(', '),
    ].map((t) => wPara(t, { size: 9, after: 0 })));
    const fills = [null, ...d.logged.map((r, i) => (r.total.min != null && r.total.min < SHORT_NIGHT_MIN ? 'FFF6D6' : i % 2 ? 'F5F8FB' : null))];
    out.push(wTable([head, ...rows], { header: true, widths: [2300, 1100, 1100, 1100, 1100, 1000, 2380], fills }));
    if (d.unlogged) out.push(small(`${d.unlogged} night${d.unlogged === 1 ? '' : 's'} not logged (left blank, not estimated).`));
  } else {
    out.push(small('No sleep logged for this period.'));
  }

  out.push(heading('Key events & functioning'));
  if (d.keyEvents.length) {
    const head = ['Date', 'What happened', 'Why it matters'].map((h) => wPara(h, { bold: true, color: 'FFFFFF', size: 9, after: 0 }));
    const rows = d.keyEvents.map((e) => [
      wPara(fmtDate(e.date, { weekday: 'short', month: 'short', day: 'numeric' }), { bold: true, color: STEEL, size: 9, after: 0 }),
      wPara(e.oneLiner.trim() || e.title.trim() || '–', { size: 9, after: 0 }),
      wPara(e.meaning.trim() || '–', { size: 9, after: 0 })
        + (e.skills.length ? wPara(`Skills used: ${e.skills.join(', ')}`, { color: SOFT, size: 8, after: 0 }) : '')
        + (e.skillsReview ? wPara('Skills not used; need review', { color: SOFT, size: 8, after: 0 }) : ''),
    ]);
    out.push(wTable([head, ...rows], { header: true, widths: [1500, 4200, 4380], fills: [null, ...rows.map((_, i) => (i % 2 ? 'F5F8FB' : null))] }));
  } else {
    out.push(small('No key events marked for this period.'));
  }

  out.push(heading('Skills'), wPara(skillsText(d)));
  out.push(heading('Therapy focus'), wPara(fieldText('focus', d) || ' '));
  out.push(heading('Overall takeaway'),
    wTable([[wPara(fieldText('takeaway', d) || ' ', { after: 0 })]], { widths: [10080], fills: ['EEF3F8'], borderColor: 'EEF3F8' }));
  out.push(wPara(BRIEF_FOOTNOTE, { color: SOFT, size: 7.5, before: 10 }));
  return out.join('');
}

function downloadDocx() {
  const blob = buildDocx(briefDocxBody());
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${fileName(periodFor(briefSession))}.docx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function renderBrief() {
  const has = briefs.sessions.length > 0;
  if (has && !briefs.sessions.includes(briefSession)) {
    briefSession = briefs.sessions.find((s) => s >= today()) || briefs.sessions[briefs.sessions.length - 1];
  }
  $('briefEmpty').hidden = has;
  $('briefDoc').hidden = !has;
  ['prevBrief', 'nextBrief', 'refillBrief', 'printBrief', 'wordBrief', 'removeSession', 'briefStart', 'sessionPick'].forEach((id) => { $(id).disabled = !has; });
  $('sessionPick').replaceChildren(...briefs.sessions.map((s) => {
    const o = el('option', '', `Session ${fmtDate(s, { month: 'short', day: 'numeric', year: 'numeric' })} (${rangeText(periodFor(s))})`);
    o.value = s;
    return o;
  }));
  if (!has) return;
  $('sessionPick').value = briefSession;
  const i = briefs.sessions.indexOf(briefSession);
  $('prevBrief').disabled = i <= 0;
  $('nextBrief').disabled = i >= briefs.sessions.length - 1;
  $('briefStart').value = periodFor(briefSession).start;
  $('briefStart').max = briefSession;
  renderBriefDoc();
}

function openBrief() {
  currentId = null;
  form.hidden = true;
  $('placeholder').hidden = true;
  hideViews();
  briefEl.hidden = false;
  briefEl.classList.remove('swing');
  void briefEl.offsetWidth; // restart the swing-in animation
  briefEl.classList.add('swing');
  app.classList.add('editing');
  if (!$('newSession').value) $('newSession').value = today();
  $('sessionMsg').textContent = '';
  renderList();
  renderBrief();
}

// ---------- Wiring ----------

$('briefBtn').addEventListener('click', openBrief);
$('briefBack').addEventListener('click', closeEditor);
$('sessionPick').addEventListener('change', (ev) => { briefSession = ev.target.value; renderBrief(); });
$('prevBrief').addEventListener('click', () => { briefSession = briefs.sessions[briefs.sessions.indexOf(briefSession) - 1]; renderBrief(); });
$('nextBrief').addEventListener('click', () => { briefSession = briefs.sessions[briefs.sessions.indexOf(briefSession) + 1]; renderBrief(); });

$('addSession').addEventListener('click', () => {
  const s = $('newSession').value;
  if (!ISO_DATE.test(s)) { $('sessionMsg').textContent = 'Pick a date first.'; return; }
  if (briefs.sessions.includes(s)) { $('sessionMsg').textContent = 'That session is already in the list.'; return; }
  briefs.sessions = [...briefs.sessions, s].sort();
  briefSession = s;
  persistBriefs();
  $('sessionMsg').textContent = '';
  renderBrief();
});

$('removeSession').addEventListener('click', () => {
  if (!briefSession || !confirm(`Remove the session on ${fmtDate(briefSession, { month: 'short', day: 'numeric', year: 'numeric' })} and its brief notes?`)) return;
  briefs.sessions = briefs.sessions.filter((s) => s !== briefSession);
  delete briefs.notes[briefSession];
  briefSession = null;
  persistBriefs();
  renderBrief();
});

$('briefStart').addEventListener('change', (ev) => {
  const v = ev.target.value;
  saveBriefField(briefSession, 'start', ISO_DATE.test(v) && v <= briefSession ? v : null);
  renderBrief();
});

$('refillBrief').addEventListener('click', () => {
  const n = briefs.notes[briefSession];
  const edited = n && ['subtitle', 'headline', 'focus'].some((f) => n[f] != null);
  if (edited && !confirm('Replace the subtitle, headline and focus with fresh drafts from your data? Your takeaway stays.')) return;
  if (n) {
    ['subtitle', 'headline', 'focus'].forEach((f) => { n[f] = null; });
    persistBriefs();
  }
  renderBriefDoc();
});

// Printing from the brief names the PDF like the usual homework files.
let titleBeforePrint = document.title;
$('printBrief').addEventListener('click', () => window.print());
$('wordBrief').addEventListener('click', downloadDocx);
window.addEventListener('beforeprint', () => {
  titleBeforePrint = document.title;
  if (!briefEl.hidden && briefSession) document.title = fileName(periodFor(briefSession));
});
window.addEventListener('afterprint', () => { document.title = titleBeforePrint; });

['diary:imported', 'diary:unlocked'].forEach((name) => document.addEventListener(name, () => {
  if (!briefEl.hidden) renderBrief();
}));
