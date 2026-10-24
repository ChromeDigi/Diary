// Optional passcode lock: encrypts entries, reports and talk items with Web Crypto.
// PBKDF2-SHA-256 → AES-GCM 256. The key stays in memory only. Loaded after app.js.

const KDF_ITERATIONS = 250000;
const MIN_PASS = 6;
const PLAIN_KEYS = [STORAGE_KEY, ...OLD_KEYS, REPORTS_KEY, TALK_KEY, SLEEP_KEY];
const cryptoOk = !!(window.crypto && crypto.subtle && window.isSecureContext !== false);

let vaultMeta = null; // { salt, iterations } of the unlocked vault
let vaultQueue = Promise.resolve(); // saves run one after another

// ---------- Crypto helpers ----------

function toB64(bytes) {
  let s = '';
  const u = new Uint8Array(bytes);
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
}

function fromB64(s) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

async function deriveKey(pass, salt, iterations) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  );
}

async function encryptBundle(key, meta) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify({ entries, reports, talkItems, sleep: sleepLog }));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);
  return { v: 1, kdf: 'PBKDF2-SHA-256', iterations: meta.iterations, salt: meta.salt, iv: toB64(iv), data: toB64(data) };
}

// Throws if the key is wrong or the vault was changed.
async function decryptVault(key, vault) {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(vault.iv) }, key, fromB64(vault.data));
  return JSON.parse(new TextDecoder().decode(plain));
}

function readVault() {
  try {
    const v = JSON.parse(localStorage.getItem(VAULT_KEY));
    return v && v.v === 1 && v.salt && v.iv && v.data ? v : null;
  } catch {
    return null;
  }
}

async function keyFor(pass, vault) {
  return deriveKey(pass, fromB64(vault.salt), vault.iterations);
}

async function newKey(pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(pass, salt, KDF_ITERATIONS);
  return { key, meta: { salt: toB64(salt), iterations: KDF_ITERATIONS } };
}

// Called by app.js writeData() whenever something changes while unlocked.
function saveVault() {
  const key = vaultKey, meta = vaultMeta;
  vaultQueue = vaultQueue.then(async () => {
    if (!key || key !== vaultKey) return; // locked or re-keyed meanwhile
    localStorage.setItem(VAULT_KEY, JSON.stringify(await encryptBundle(key, meta)));
  }).catch(() => showLockToast('Could not save. Export a backup!'));
  return vaultQueue;
}

function showLockToast(text) {
  if (typeof showToast === 'function') showToast(text);
}

// ---------- Loading decrypted data into the app ----------

function applyBundle(b) {
  entries = (Array.isArray(b.entries) ? b.entries : []).filter(isEntry).map(normalize);
  reports = {};
  Object.entries(b.reports && typeof b.reports === 'object' ? b.reports : {}).forEach(([week, r]) => {
    if (ISO_DATE.test(week) && r && typeof r === 'object') reports[week] = cleanReport(r);
  });
  talkItems = (Array.isArray(b.talkItems) ? b.talkItems : []).map(cleanTalk).filter(Boolean);
  sleepLog = cleanSleepLog(b.sleep);
  animateList = true;
  renderList();
  document.dispatchEvent(new Event('diary:unlocked'));
}

// ---------- Actions ----------

async function unlock(pass) {
  const vault = readVault();
  if (!vault) throw new Error('no vault');
  const key = await keyFor(pass, vault);
  const bundle = await decryptVault(key, vault);
  vaultKey = key;
  vaultMeta = { salt: vault.salt, iterations: vault.iterations };
  applyBundle(bundle);
}

async function turnOn(pass) {
  const { key, meta } = await newKey(pass);
  vaultKey = key;
  vaultMeta = meta;
  await saveVault();
  try {
    const check = await decryptVault(key, readVault());
    if (!Array.isArray(check.entries) || check.entries.length !== entries.length) throw new Error('mismatch');
  } catch (err) {
    vaultKey = null;
    vaultMeta = null;
    localStorage.removeItem(VAULT_KEY);
    throw err;
  }
  PLAIN_KEYS.forEach((k) => localStorage.removeItem(k));
}

async function turnOff(pass) {
  await vaultQueue;
  const vault = readVault();
  await decryptVault(await keyFor(pass, vault), vault); // throws on a wrong passcode
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  localStorage.setItem(TALK_KEY, JSON.stringify(talkItems));
  localStorage.setItem(SLEEP_KEY, JSON.stringify(sleepLog));
  if (readList(STORAGE_KEY).length !== entries.length) throw new Error('plain copy failed');
  localStorage.removeItem(VAULT_KEY);
  vaultKey = null;
  vaultMeta = null;
}

async function changePass(current, next) {
  await vaultQueue;
  const vault = readVault();
  await decryptVault(await keyFor(current, vault), vault); // throws on a wrong passcode
  const old = { key: vaultKey, meta: vaultMeta };
  const { key, meta } = await newKey(next);
  vaultKey = key;
  vaultMeta = meta;
  await saveVault();
  try {
    await decryptVault(key, readVault());
  } catch (err) {
    vaultKey = old.key;
    vaultMeta = old.meta;
    await saveVault();
    throw err;
  }
}

async function lockNow() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    persist();
  }
  await vaultQueue;
  location.reload();
}

// ---------- UI ----------

function setMsg(id, text, ok) {
  $(id).textContent = text;
  $(id).classList.toggle('ok', !!ok);
}

function checkNewPass(a, b, msgId) {
  if (a.length < MIN_PASS) { setMsg(msgId, `Use at least ${MIN_PASS} characters.`); return false; }
  if (a !== b) { setMsg(msgId, 'The two passcodes don\'t match.'); return false; }
  return true;
}

// Disables a button while slow crypto runs.
async function busy(btn, work) {
  btn.disabled = true;
  try {
    return await work();
  } finally {
    btn.disabled = false;
  }
}

function renderPrivacy() {
  const on = hasVault();
  $('lockBtn').textContent = on ? '🔒' : '🔓';
  $('lockBtn').title = on ? 'Privacy lock: on' : 'Privacy lock: off';
  $('privacyTitle').textContent = on ? '🔒 Privacy lock' : '🔓 Privacy lock';
  $('privacyStatus').textContent = on ? 'On: your diary is encrypted on this device.' : 'Off: your diary is stored unencrypted in this browser.';
  $('lockOn').hidden = !on;
  $('lockOff').hidden = on;
  if (!cryptoOk) {
    $('lockOnBtn').disabled = true;
    setMsg('lockOnMsg', 'The lock needs a secure (https) page.');
  }
}

function openPrivacy() {
  currentId = null;
  form.hidden = true;
  $('placeholder').hidden = true;
  hideViews();
  $('privacy').hidden = false;
  app.classList.add('editing');
  renderList();
  renderPrivacy();
}

$('lockBtn').addEventListener('click', openPrivacy);
$('privacyBack').addEventListener('click', closeEditor);
$('lockExport').addEventListener('click', exportBackup);

$('lockOnBtn').addEventListener('click', () => {
  const a = $('newPass').value, b = $('newPass2').value;
  if (!checkNewPass(a, b, 'lockOnMsg')) return;
  if (!$('lockAgree').checked) { setMsg('lockOnMsg', 'Tick the box to confirm you understand.'); return; }
  busy($('lockOnBtn'), async () => {
    try {
      await turnOn(a);
      $('newPass').value = $('newPass2').value = '';
      $('lockAgree').checked = false;
      setMsg('lockOnMsg', '');
      renderPrivacy();
      showLockToast('Diary locked and encrypted 🔒');
    } catch {
      setMsg('lockOnMsg', 'Something went wrong. Nothing was changed.');
    }
  });
});

$('lockNowBtn').addEventListener('click', lockNow);

$('changePassBtn').addEventListener('click', () => {
  const a = $('chgPass').value, b = $('chgPass2').value;
  if (!checkNewPass(a, b, 'changeMsg')) return;
  busy($('changePassBtn'), async () => {
    try {
      await changePass($('curPass').value, a);
      $('curPass').value = $('chgPass').value = $('chgPass2').value = '';
      setMsg('changeMsg', 'Passcode changed.', true);
    } catch {
      setMsg('changeMsg', 'The current passcode didn\'t work.');
    }
  });
});

$('lockOffBtn').addEventListener('click', () => {
  busy($('lockOffBtn'), async () => {
    try {
      await turnOff($('offPass').value);
      $('offPass').value = '';
      setMsg('offMsg', '');
      renderPrivacy();
      showLockToast('Lock turned off');
    } catch {
      setMsg('offMsg', 'That passcode didn\'t work. The lock is still on.');
    }
  });
});

// Lock screen
$('unlockForm').addEventListener('submit', (ev) => {
  ev.preventDefault();
  busy($('unlockBtn'), async () => {
    try {
      await unlock($('unlockPass').value);
      $('unlockPass').value = '';
      $('lockScreen').hidden = true;
      renderPrivacy();
    } catch {
      setMsg('unlockMsg', 'That passcode didn\'t work. Try again.');
      const card = $('unlockForm');
      card.classList.remove('shake');
      void card.offsetWidth; // restart the shake animation
      card.classList.add('shake');
      $('unlockPass').select();
    }
  });
});

$('eraseBtn').addEventListener('click', () => {
  if ($('eraseConfirm').value.trim() !== 'ERASE') {
    setMsg('unlockMsg', 'Type ERASE in the box to confirm.');
    return;
  }
  if (!confirm('Erase the locked diary for good? This can\'t be undone.')) return;
  localStorage.removeItem(VAULT_KEY);
  location.reload();
});

if (hasVault()) {
  $('lockScreen').hidden = false;
  $('unlockPass').focus();
}
renderPrivacy();
