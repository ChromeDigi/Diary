// Visual effects: logo tilt, starfield and number count-up. Loaded after app.js.
// All of it stays still in calm mode or with reduced motion.

function motionOff() {
  return !!prefs.calm || matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Holographic logo tilts toward the mouse.
const logoEl = $('logo');
const logoHead = document.querySelector('.sidebar-head');
logoHead.addEventListener('pointermove', (e) => {
  if (motionOff() || e.pointerType !== 'mouse') return;
  const r = logoEl.getBoundingClientRect();
  const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / r.width));
  const dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height * 2)));
  logoEl.style.setProperty('--ry', `${dx * 18}deg`);
  logoEl.style.setProperty('--rx', `${-dy * 18}deg`);
});
logoHead.addEventListener('pointerleave', () => {
  logoEl.style.setProperty('--rx', '0deg');
  logoEl.style.setProperty('--ry', '0deg');
});

// Twinkling stars (only shown in dark mode by CSS).
$('stars').append(...Array.from({ length: 60 }, () => {
  const s = document.createElement('i');
  s.style.left = `${Math.random() * 100}%`;
  s.style.top = `${Math.random() * 100}%`;
  s.style.animationDelay = `${Math.random() * 4}s`;
  s.style.animationDuration = `${3 + Math.random() * 3}s`;
  if (Math.random() < 0.15) s.className = 'big';
  return s;
}));

// Counts a number up from 0 to its final text, e.g. "3.8" or "4/7".
function countUp(node) {
  const final = node.textContent;
  const m = final.match(/^(\d+(?:\.\d+)?)(.*)$/);
  if (!m || motionOff()) return;
  const to = Number(m[1]);
  const dp = (m[1].split('.')[1] || '').length;
  const start = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - start) / 900);
    node.textContent = p < 1 ? (to * (1 - Math.pow(1 - p, 3))).toFixed(dp) + m[2] : final;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
