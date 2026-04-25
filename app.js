/* ════════════════════════════════════════
   APP — Tab Routing, Low Stock, Init
   ════════════════════════════════════════ */

let currentView = 'grid';

/* ── Tab router ───────────────────────── */
function switchTab(tab) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + tab).classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');

  // FAB only visible in inventory
  document.getElementById('fabAdd').style.display = tab === 'inventory' ? 'flex' : 'none';

  if (tab === 'sell')      { renderCart(); renderRecentSales(); checkLowStock(); }
  if (tab === 'inventory') { renderInventory(); }
  if (tab === 'analytics') { renderAnalytics(); }
  if (tab === 'settings')  { loadSettingsUI(); }
}

/* ── Low stock indicator ──────────────── */
function checkLowStock() {
  const lowThresh = DB.settings.lowStockThreshold || 5;
  const lowItems  = DB.items.filter(i => !i.soldOut && i.qty > 0 && i.qty <= lowThresh);
  updateLowStockDot(lowItems.length > 0);

  const banner = document.getElementById('sellLowStockBanner');
  if (!banner) return;
  if (lowItems.length) {
    banner.style.display = 'block';
    banner.innerHTML = `<div class="low-stock-banner">
      <span class="lsb-icon">⚠️</span>
      <div class="lsb-text">Low stock alert: <span class="lsb-items">${lowItems.map(i => escHtml(i.name)).join(', ')}</span></div>
    </div>`;
  } else {
    banner.style.display = 'none';
  }
}

function updateLowStockDot(show) {
  const dot = document.getElementById('lowStockDot');
  if (dot) dot.style.display = show ? 'inline-block' : 'none';
}

/* ── Bootstrap ────────────────────────── */
function init() {
  loadDB();
  updateClock();

  // Apply persisted preferences
  currentView = DB.settings.defaultGrid !== false ? 'grid' : 'list';
  const nameEl = document.querySelector('.brand-name');
  if (nameEl && DB.settings.storeName) nameEl.textContent = DB.settings.storeName;

  // Seed demo items on first launch
  if (!DB.items.length) {
    DB.items = [
      { id: 'demo1', name: 'Basmati Rice (5kg)',  uid: 'RICE5KG',   qty: 20, unit: 'bag',    buyPrice: 280, sellPrice: 350, soldOut: false },
      { id: 'demo2', name: 'Sunflower Oil (1L)',   uid: 'OIL1L',     qty: 3,  unit: 'bottle', buyPrice: 120, sellPrice: 155, soldOut: false },
      { id: 'demo3', name: 'Whole Wheat Bread',    uid: 'BREAD01',   qty: 8,  unit: 'loaf',   buyPrice: 35,  sellPrice: 50,  soldOut: false },
      { id: 'demo4', name: 'Amul Butter (100g)',   uid: 'BUTTER100', qty: 0,  unit: 'pack',   buyPrice: 52,  sellPrice: 65,  soldOut: false },
    ];
    saveDB();
  }

  renderCart();
  renderRecentSales();
  checkLowStock();
}

document.addEventListener('DOMContentLoaded', init);
