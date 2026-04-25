/* ════════════════════════════════════════
   SETTINGS — UI, Save, Export, Import
   ════════════════════════════════════════ */

function loadSettingsUI() {
  document.getElementById('settStoreName').value   = DB.settings.storeName || '';
  document.getElementById('settCurrency').value    = DB.settings.currency  || '₹';
  document.getElementById('settLowStock').value    = DB.settings.lowStockThreshold || 5;
  document.getElementById('settGridView').checked  = DB.settings.defaultGrid !== false;
  document.getElementById('settShowUid').checked   = DB.settings.showUid   !== false;
}

function saveSetting(key, val) {
  DB.settings[key] = val;
  if (key === 'storeName') {
    const el = document.querySelector('.brand-name');
    if (el) el.textContent = val || 'ShopMate';
  }
  if (key === 'defaultGrid') {
    currentView = val ? 'grid' : 'list';
  }
  saveDB();
}

/* ── Export / Import ─────────────────── */
function exportData() {
  try {
    const json = JSON.stringify(DB, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'shopmate_backup_' + new Date().toLocaleDateString('en-CA') + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('Data exported successfully', 'success');
  } catch (e) {
    toast('Export failed', 'error');
    console.error('[ShopMate] exportData:', e);
  }
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data || !Array.isArray(data.items)) {
        toast('Invalid backup file', 'error'); return;
      }
      if (!confirm('This will replace ALL current data. Continue?')) return;

      DB          = Object.assign(JSON.parse(JSON.stringify(DEFAULT_DB)), data);
      DB.settings = Object.assign(JSON.parse(JSON.stringify(DEFAULT_DB.settings)), data.settings || {});
      saveDB();
      loadSettingsUI();
      renderCart();
      toast('Data imported successfully', 'success');
    } catch (err) {
      toast('Failed to parse backup file', 'error');
      console.error('[ShopMate] importData:', err);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

/* ── Clear all data ──────────────────── */
function confirmClearAll() {
  if (!confirm('Clear ALL data? This cannot be undone.')) return;
  if (!confirm('Last chance — permanently delete everything?')) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}
