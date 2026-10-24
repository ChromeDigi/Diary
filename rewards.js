// Guilt-free rewards: totals, badges, palettes, celebrations and the daily prompt.
// Loaded after app.js and report.js; everything is computed from existing data.

const DAY_BADGES = [1, 3, 7, 14, 30, 50, 100];
const PALETTES = [
  { id: 'aurora', name: 'Aurora', need: 0, colors: ['#6b4dff', '#1d9e9a', '#d4537e'] },
  { id: 'sunset', name: 'Sunset', need: 3, colors: ['#ff7a59', '#f2b84e', '#d4537e'] },
  { id: 'ocean', name: 'Ocean', need: 7, colors: ['#2f7fe0', '#1fc2c2', '#7f9cff'] },
  { id: 'forest', name: 'Forest', need: 14, colors: ['#3c9d5d', '#a8d672', '#1d9e9a'] },
  { id: 'galaxy', name: 'Galaxy', need: 30, colors: ['#9b4dff', '#ff5ca8', '#3b2fb0'] },
];
const STICKERS = ['🌟', '🦄', '🌈', '🐢', '🌻', '🚀', '🐙', '🍀', '🎈', '🦋', '🐝', '🍩'];
const CONFETTI_COLORS = ['#7f9cff', '#5dcaa5', '#f2d94e', '#ef9f27', '#e24b6a', '#b18cff'];
const PROMPTS = [
  'What made you smile today, even a little?',
  'What drained your energy today? What gave some back?',
  'Describe one moment you want to remember.',
  'What did your body need today?',
  'Was there a sound, light or texture that bothered you? What helped?',
  'What is one thing you did well today?',
  'Who did you enjoy being around lately?',
  'What is taking up the most space in your head right now?',
  'What would make tomorrow 1% easier?',
  'What are you looking forward to?',
  'Did anything surprise you today?',
  'What is something you are proud of this week?',
  'When did you feel most calm today?',
  'What is one thing you want your therapist to know?',
  'What did you hyperfocus on today? How did it feel?',
  'What is a small win nobody else noticed?',
  'What did you learn about yourself recently?',
  'What helped you get through a hard moment?',
  'If today had a color, what would it be and why?',
  'What would you tell a friend who had your day?',
  'Which routine helped you today, and which one got in the way?',
  'What do you wish people understood about you this week?',
];

const rewardsEl = $('rewards');
const celebrated = new Set(); // entry ids celebrated this session
let promptShift = 0;
let knownBadges = null; // badge names seen at the last summary update

// ---------- Progress (all derived) ----------

function progress() {
  const days = new Set(entries.filter((e) => e.mood || e.energy || e.anxiety || e.sleep).map((e) => e.date));
  const themesUsed = new Set(entries.flatMap((e) => e.themes));
  const weekStart = startOfWeek(today());
  return {
    days: days.size,
    thisWeek: [...days].filter((d) => d >= weekStart && d <= addDays(weekStart, 6)).length,
    themes: themesUsed.size,
    discussed: talkItems.some((t) => t.discussedOn),
    reviewed: Object.values(reports).some((r) => [r.wins, r.struggles, r.sessionNotes].some((v) => v && v.trim())),
  };
}

function badgeList(p) {
  return [
    ...DAY_BADGES.map((n) => ({
      icon: n >= 30 ? '🏆' : n >= 7 ? '🌟' : '⭐', name: `${n} check-in day${n === 1 ? '' : 's'}`,
      got: p.days >= n, hint: `${Math.max(0, n - p.days)} more to go`,
    })),
    { icon: '🎨', name: 'Theme explorer', got: p.themes >= 5, hint: `Use ${Math.max(0, 5 - p.themes)} more themes` },
    { icon: '💬', name: 'Speaking up', got: p.discussed, hint: 'Tick off something you brought to therapy' },
    { icon: '📝', name: 'Week reviewed', got: p.reviewed, hint: 'Write wins, struggles or session notes' },
  ];
}

// ---------- Rendering ----------

// Updates the sidebar button and announces any badge earned since the last update.
function renderRewardsSummary() {
  const p = progress();
  const got = badgeList(p).filter((b) => b.got);
  $('rewardsBtn').textContent = `⭐ ${p.days} check-in day${p.days === 1 ? '' : 's'} · ${got.length} badge${got.length === 1 ? '' : 's'}`;
  if (knownBadges) {
    const fresh = got.find((b) => !knownBadges.has(b.name));
    if (fresh) showToast(`New badge: ${fresh.icon} ${fresh.name}!`);
  }
  knownBadges = new Set(got.map((b) => b.name));
  if (!rewardsEl.hidden) renderRewards();
}

function tile(label, value, color) {
  const t = el('div', 'tile');
  t.style.setProperty('--c', color);
  t.append(el('div', 'tile-label', label), el('div', 'num', value));
  return t;
}

function renderRewards() {
  const p = progress();
  const badges = badgeList(p);
  $('rewardTiles').replaceChildren(
    tile('Check-in days, all time', p.days, '#f2d94e'),
    tile('This week', p.thisWeek, '#5dcaa5'),
    tile('Badges', `${badges.filter((b) => b.got).length}/${badges.length}`, '#b18cff'),
  );

  $('badges').replaceChildren(...badges.map((b) => {
    const card = el('div', b.got ? 'badge got' : 'badge');
    card.append(el('div', 'coin', b.got ? b.icon : '🔒'), el('div', 'badge-name', b.name));
    if (!b.got) card.append(el('div', 'badge-hint', b.hint));
    return card;
  }));

  const current = prefs.palette || 'aurora';
  $('palettes').replaceChildren(...PALETTES.map((pal) => {
    const open = p.days >= pal.need;
    const b = el('button', 'palette');
    b.type = 'button';
    b.setAttribute('aria-pressed', String(pal.id === current));
    b.disabled = !open;
    const swatch = el('span', 'swatch');
    swatch.style.background = `linear-gradient(135deg, ${pal.colors.join(', ')})`;
    b.append(swatch, el('span', 'palette-name', open ? pal.name : `🔒 ${pal.name}`),
      el('span', 'muted', open ? (pal.id === current ? 'In use' : 'Tap to use') : `${pal.need} check-in days`));
    b.addEventListener('click', () => {
      prefs.palette = pal.id;
      savePrefs();
      renderRewards();
    });
    return b;
  }));

  $('funToggle').checked = prefs.fun !== false;
}

function openRewards() {
  currentId = null;
  form.hidden = true;
  $('placeholder').hidden = true;
  hideViews();
  rewardsEl.hidden = false;
  rewardsEl.classList.remove('swing');
  void rewardsEl.offsetWidth; // restart the swing-in animation
  rewardsEl.classList.add('swing');
  app.classList.add('editing');
  renderList();
  renderRewards();
  $('rewardTiles').querySelectorAll('.num').forEach(countUp);
}

// ---------- Celebrations ----------

function quiet() {
  return prefs.fun === false || prefs.calm || matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function confetti() {
  const layer = el('div', 'confetti');
  layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 60; i++) {
    const bit = el('i');
    bit.style.setProperty('--x', `${Math.random() * 100}vw`);
    bit.style.setProperty('--drift', `${(Math.random() - 0.5) * 30}vw`);
    bit.style.setProperty('--spin', `${Math.random() * 1080 - 540}deg`);
    bit.style.setProperty('--delay', `${Math.random() * 0.3}s`);
    bit.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    layer.append(bit);
  }
  const sticker = el('div', 'sticker', STICKERS[Math.floor(Math.random() * STICKERS.length)]);
  layer.append(sticker);
  document.body.append(layer);
  setTimeout(() => layer.remove(), 2600);
}

document.addEventListener('diary:checkin-done', () => {
  const e = current();
  if (!e || celebrated.has(e.id)) return;
  celebrated.add(e.id);
  if (!quiet()) confetti();
  const days = progress().days;
  showToast(`Check-in done! ⭐ ${days} check-in day${days === 1 ? '' : 's'}`);
});

// ---------- Daily prompt ----------

function promptFor(iso) {
  const n = iso.split('-').reduce((a, b) => a * 31 + Number(b), 0);
  return PROMPTS[(n + promptShift) % PROMPTS.length];
}

function renderPrompt() {
  const e = current();
  if (e) $('promptText').textContent = promptFor(e.date);
}

document.addEventListener('diary:entry-opened', () => { promptShift = 0; renderPrompt(); });
$('promptShuffle').addEventListener('click', () => { promptShift++; renderPrompt(); });
$('promptUse').addEventListener('click', () => {
  if (!fields.title.value.trim()) {
    fields.title.value = $('promptText').textContent;
    touch();
  }
  fields.body.focus();
});

// ---------- Wiring ----------

$('rewardsBtn').addEventListener('click', openRewards);
$('rewardsBack').addEventListener('click', closeEditor);
$('funToggle').addEventListener('change', (ev) => { prefs.fun = ev.target.checked; savePrefs(); });
document.addEventListener('diary:changed', renderRewardsSummary);
document.addEventListener('diary:imported', renderRewardsSummary);
// Unlocking loads existing data; its badges aren't new, so don't announce them.
document.addEventListener('diary:unlocked', () => { knownBadges = null; renderRewardsSummary(); });
renderRewardsSummary();
