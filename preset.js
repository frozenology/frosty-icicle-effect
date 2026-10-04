/**
 * Preset system — localStorage + file + clipboard
 */
const PRESET_LS_KEY = 'frosty-icicle-presets';
const PRESET_CURRENT_KEY = 'frosty-icicle-current';
const PRESET_DIR = './presets/';

function loadPresetStore() {
  try { return JSON.parse(localStorage.getItem(PRESET_LS_KEY) || '{}'); }
  catch { return {}; }
}

function savePresetStore(store) {
  localStorage.setItem(PRESET_LS_KEY, JSON.stringify(store));
}

function getCurrentParamsSnapshot() {
  if (typeof getParamsData === 'function') return getParamsData();
  return null;
}

function applySnapshot(data) {
  if (!data || typeof applyParamsData !== 'function') return false;
  applyParamsData(data);
  if (typeof scheduleGenerate === 'function') scheduleGenerate();
  else if (typeof generate === 'function') generate();
  return true;
}

function saveCurrentToLocalStorage() {
  const snap = getCurrentParamsSnapshot();
  if (!snap) return;
  try { localStorage.setItem(PRESET_CURRENT_KEY, JSON.stringify(snap)); }
  catch (e) { console.warn('localStorage save failed', e); }
}

function restoreFromLocalStorage() {
  try {
    const raw = localStorage.getItem(PRESET_CURRENT_KEY);
    if (!raw) return false;
    return applySnapshot(JSON.parse(raw));
  } catch { return false; }
}

function listPresetNames() {
  return Object.keys(loadPresetStore()).sort();
}

function refreshPresetSelect() {
  const sel = document.getElementById('presetSelect');
  if (!sel) return;
  const current = sel.value;
  const names = listPresetNames();
  sel.innerHTML = '<option value="">— presets —</option>';
  names.forEach((n) => {
    const o = document.createElement('option');
    o.value = n; o.textContent = n;
    sel.appendChild(o);
  });
  (window.BUILTIN_PRESETS || []).forEach((n) => {
    if (names.includes(n)) return;
    const o = document.createElement('option');
    o.value = 'file:' + n;
    o.textContent = n + ' (file)';
    sel.appendChild(o);
  });
  if (current) sel.value = current;
  const dl = document.getElementById('presetNameList');
  if (dl) {
    dl.innerHTML = '';
    names.forEach((n) => {
      const o = document.createElement('option');
      o.value = n; dl.appendChild(o);
    });
  }
}

function saveNamedPreset(name) {
  name = (name || '').trim();
  if (!name) { alert('Enter a preset name'); return false; }
  const store = loadPresetStore();
  store[name] = getCurrentParamsSnapshot();
  savePresetStore(store);
  refreshPresetSelect();
  const sel = document.getElementById('presetSelect');
  if (sel) sel.value = name;
  const input = document.getElementById('presetName');
  if (input) input.value = name;
  const st = document.getElementById('statusBar');
  if (st) st.textContent = 'Saved preset: ' + name;
  return true;
}

function loadNamedPreset(name) {
  if (!name) return false;
  if (name.startsWith('file:')) return loadPresetFromFile(name.slice(5));
  const store = loadPresetStore();
  if (!store[name]) { alert('Preset not found: ' + name); return false; }
  applySnapshot(store[name]);
  saveCurrentToLocalStorage();
  const input = document.getElementById('presetName');
  if (input) input.value = name;
  return true;
}

function deleteNamedPreset(name) {
  name = (name || '').trim();
  if (!name || name.startsWith('file:')) return false;
  const store = loadPresetStore();
  if (!store[name]) return false;
  if (!confirm('Delete preset "' + name + '"?')) return false;
  delete store[name];
  savePresetStore(store);
  refreshPresetSelect();
  const input = document.getElementById('presetName');
  if (input) input.value = '';
  return true;
}

async function loadPresetFromFile(filename) {
  const url = PRESET_DIR + filename.replace(/\.json$/i, '') + '.json';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    applySnapshot(await res.json());
    saveCurrentToLocalStorage();
    return true;
  } catch (e) {
    console.error(e);
    alert('Could not load: ' + url + '\n' + e.message);
    return false;
  }
}

function exportPresetToClipboard() {
  const snap = getCurrentParamsSnapshot();
  if (!snap) return;
  const text = JSON.stringify(snap, null, 2);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      const st = document.getElementById('statusBar');
      if (st) st.textContent = 'Preset copied to clipboard';
    }).catch(() => fallbackCopy(text));
  } else fallbackCopy(text);
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch (e) { prompt('Copy JSON:', text); }
  document.body.removeChild(ta);
  const st = document.getElementById('statusBar');
  if (st) st.textContent = 'Preset copied to clipboard';
}

function downloadPresetJson(name) {
  name = (name || document.getElementById('presetName')?.value || 'preset').trim() || 'preset';
  const snap = getCurrentParamsSnapshot();
  const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name.replace(/[^\w\-]+/g, '_') + '.json';
  a.click(); URL.revokeObjectURL(a.href);
}

function importPresetFromText(text) {
  try {
    applySnapshot(JSON.parse(text));
    saveCurrentToLocalStorage();
    return true;
  } catch (e) {
    alert('Invalid JSON: ' + e.message);
    return false;
  }
}

function initPresetUI() {
  refreshPresetSelect();
  const sel = document.getElementById('presetSelect');
  const nameInput = document.getElementById('presetName');
  if (sel) {
    sel.addEventListener('change', () => {
      if (!sel.value) return;
      if (sel.value.startsWith('file:')) loadNamedPreset(sel.value);
      else { if (nameInput) nameInput.value = sel.value; loadNamedPreset(sel.value); }
    });
  }
  const btnSave = document.getElementById('btnPresetSave');
  if (btnSave) btnSave.addEventListener('click', () => {
    const n = (nameInput && nameInput.value) || (sel && sel.value && !sel.value.startsWith('file:') ? sel.value : '');
    saveNamedPreset(n);
  });
  const btnLoad = document.getElementById('btnPresetLoad');
  if (btnLoad) btnLoad.addEventListener('click', () => {
    const n = (sel && sel.value) || (nameInput && nameInput.value) || '';
    loadNamedPreset(n);
  });
  const btnDel = document.getElementById('btnPresetDelete');
  if (btnDel) btnDel.addEventListener('click', () => {
    const n = (nameInput && nameInput.value) || (sel && !sel.value.startsWith('file:') ? sel.value : '');
    deleteNamedPreset(n);
  });
  const btnCopy = document.getElementById('btnPresetCopy');
  if (btnCopy) btnCopy.addEventListener('click', exportPresetToClipboard);
  const btnDl = document.getElementById('btnPresetDownload');
  if (btnDl) btnDl.addEventListener('click', () => downloadPresetJson(nameInput && nameInput.value));
  const btnImport = document.getElementById('btnPresetImport');
  if (btnImport) btnImport.addEventListener('click', () => {
    const text = prompt('Paste preset JSON:');
    if (text) importPresetFromText(text);
  });
}

window.BUILTIN_PRESETS = ['default', 'dense', 'sparse', 'radial'];
