

let actionItemId = null;

/* ── View toggle ──────────────────────── */
function setView(v) {
  currentView = v;
  DB.settings.defaultGrid = (v === 'grid');
  saveDB();
  document.getElementById('viewGrid').classList.toggle('active', v === 'grid');
  document.getElementById('viewList').classList.toggle('active', v === 'list');
  renderInventory();
}

/* ── Render inventory list/grid ───────── */
function renderInventory(filter) {
  if (filter === undefined) {
    filter = (document.getElementById('invSearchInput') || {}).value || '';
  }
  const q         = filter.toLowerCase().trim();
  const container = document.getElementById('inventoryContainer');
  if (!container) return;

  const lowThresh = DB.settings.lowStockThreshold || 5;
  const cur       = DB.settings.currency || '₹';

  const items = q
    ? DB.items.filter(i => i.name.toLowerCase().includes(q) || i.uid.toLowerCase().includes(q))
    : DB.items;

  // Low stock banner
  const lowItems  = DB.items.filter(i => !i.soldOut && i.qty > 0 && i.qty <= lowThresh);
  const bannerEl  = document.getElementById('invLowBanner');
  if (bannerEl) {
    if (lowItems.length) {
      bannerEl.style.display = 'block';
      bannerEl.innerHTML = `<div class="low-stock-banner">
        <span class="lsb-icon">⚠️</span>
        <div class="lsb-text">Low stock: <span class="lsb-items">${lowItems.map(i => escHtml(i.name)).join(', ')}</span></div>
      </div>`;
    } else {
      bannerEl.style.display = 'none';
    }
  }

  updateLowStockDot(lowItems.length > 0);

  if (!items.length) {
    container.innerHTML = `<div class="no-data">${
      q ? 'No items match your search.' : 'No items yet. Use the + button to add inventory.'
    }</div>`;
    return;
  }

  if (currentView === 'grid') {
    container.innerHTML = `<div class="inv-grid">${items.map(item => {
      const isLow      = !item.soldOut && item.qty > 0 && item.qty <= lowThresh;
      const statusLabel = item.soldOut
        ? '· <span style="color:var(--red)">Sold Out</span>'
        : item.qty <= 0 ? '· <span style="color:var(--red)">Out of stock</span>'
        : isLow        ? '· <span style="color:var(--orange)">Low stock</span>'
        : 'in stock';
      return `<div class="inv-card${item.soldOut ? ' soldout' : ''}${isLow ? ' low-stock' : ''}" data-id="${item.id}">
        <div class="ic-name">${escHtml(item.name)}</div>
        <div class="ic-uid">${escHtml(item.uid)}</div>
        <div class="ic-qty">${item.soldOut ? '—' : item.qty}</div>
        <div class="ic-qty-label">${escHtml(item.unit || 'units')} ${statusLabel}</div>
        <div class="ic-prices">
          <span class="ic-price-tag">B: ${cur}${item.buyPrice || 0}</span>
          <span class="ic-price-tag">S: ${cur}${item.sellPrice || 0}</span>
        </div>
      </div>`;
    }).join('')}</div>`;
  } else {
    container.innerHTML = `<div class="inv-list">${items.map(item => {
      const isLow  = !item.soldOut && item.qty > 0 && item.qty <= lowThresh;
      const badge  = item.soldOut
        ? '<span class="badge badge-red" style="font-size:11px">Sold Out</span>'
        : isLow ? '<span class="badge badge-orange" style="font-size:11px">Low</span>' : '';
      return `<div class="inv-row${item.soldOut ? ' soldout' : ''}" data-id="${item.id}">
        <div class="ir-name-block">
          <div class="ir-name">${escHtml(item.name)} ${badge}</div>
          <div class="ir-uid">${escHtml(item.uid)}${item.unit ? ' · ' + escHtml(item.unit) : ''}</div>
        </div>
        <div class="ir-qty">${item.soldOut ? '—' : item.qty}</div>
        <div class="ir-prices">
          <span>Buy: ${cur}${item.buyPrice || 0}</span>
          <span>Sell: ${cur}${item.sellPrice || 0}</span>
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  // Attach click handlers via data-id (no inline onclick)
  container.querySelectorAll('[data-id]').forEach(el => {
    el.addEventListener('click', () => openItemActions(el.dataset.id));
  });
}

/* ── Add Item Modal ───────────────────── */
function openAddItem() {
  ['newItemName','newItemUID','newItemQty','newItemUnit','newItemBuyPrice','newItemSellPrice']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('itemNameAutocomplete').style.display = 'none';
  openModal('modalAddItem');
  setTimeout(() => { const el = document.getElementById('newItemName'); if (el) el.focus(); }, 120);
}

function onNewItemNameInput(val) {
  const ac = document.getElementById('itemNameAutocomplete');
  if (!val.trim()) { ac.style.display = 'none'; return; }
  const q       = val.toLowerCase();
  const matches = DB.items.filter(i => i.name.toLowerCase().includes(q));
  if (!matches.length) { ac.style.display = 'none'; return; }

  ac.innerHTML = matches.map(i =>
    `<div class="ac-item" data-id="${i.id}">
      <span>${escHtml(i.name)}</span>
      <span class="ac-item-uid">${escHtml(i.uid)} · ${i.qty} in stock</span>
    </div>`
  ).join('');

  ac.querySelectorAll('.ac-item').forEach(el => {
    el.addEventListener('click', () => selectExistingItem(el.dataset.id));
  });
  ac.style.display = 'block';
}

function selectExistingItem(id) {
  closeModal('modalAddItem');
  setTimeout(() => {
    openItemActions(id);
    toast('Item already exists — adjust quantity here.', 'warning');
  }, 150);
}

function saveNewItem() {
  const name      = (document.getElementById('newItemName').value      || '').trim();
  const uid       = (document.getElementById('newItemUID').value       || '').trim();
  const qty       = parseInt(document.getElementById('newItemQty').value)   || 0;
  const unit      = (document.getElementById('newItemUnit').value      || '').trim();
  const buyPrice  = parseFloat(document.getElementById('newItemBuyPrice').value)  || 0;
  const sellPrice = parseFloat(document.getElementById('newItemSellPrice').value) || 0;

  if (!name) { toast('Item name is required', 'error'); return; }
  if (!uid)  { toast('UID is required', 'error'); return; }
  if (DB.items.find(i => i.uid.toLowerCase() === uid.toLowerCase())) {
    toast('An item with this UID already exists', 'error'); return;
  }

  DB.items.push({
    id: 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    name, uid, qty, unit, buyPrice, sellPrice, soldOut: false
  });
  saveDB();
  closeModal('modalAddItem');
  renderInventory();
  checkLowStock();
  toast(`"${name}" added to inventory`, 'success');
}

/* ── Item Actions Modal ───────────────── */
function openItemActions(id) {
  const item = DB.items.find(i => i.id === id);
  if (!item) return;
  actionItemId = id;

  const cur       = DB.settings.currency || '₹';
  const lowThresh = DB.settings.lowStockThreshold || 5;

  document.getElementById('actionModalName').textContent  = item.name;
  document.getElementById('actionModalUID').textContent   = item.uid;
  document.getElementById('actionCurrentQty').textContent = `Current stock: ${item.qty} ${item.unit || 'units'}`;
  document.getElementById('actionQtyInput').value         = item.qty;
  document.getElementById('actionBuyPrice').textContent   = `${cur}${(item.buyPrice  || 0).toFixed(2)}`;
  document.getElementById('actionSellPrice').textContent  = `${cur}${(item.sellPrice || 0).toFixed(2)}`;

  const badge = item.soldOut
    ? '<span class="badge badge-red">Sold Out</span>'
    : item.qty <= 0        ? '<span class="badge badge-red">Out of Stock</span>'
    : item.qty <= lowThresh ? '<span class="badge badge-orange">Low Stock</span>'
    : '<span class="badge badge-green">In Stock</span>';
  document.getElementById('actionModalBadge').innerHTML = badge;

  document.getElementById('soldOutBtnIcon').textContent  = item.soldOut ? '✅' : '🚫';
  document.getElementById('soldOutBtnLabel').textContent = item.soldOut ? 'Mark as Available' : 'Mark as Sold Out';

  openModal('modalItemActions');
}

function applyQtyChange() {
  const item = DB.items.find(i => i.id === actionItemId);
  if (!item) return;
  const raw    = document.getElementById('actionQtyInput').value;
  const newQty = parseInt(raw);
  if (raw === '' || isNaN(newQty) || newQty < 0) {
    toast('Enter a valid quantity (0 or more)', 'error'); return;
  }
  item.qty = newQty;
  if (newQty > 0 && item.soldOut) item.soldOut = false;
  saveDB();
  closeModal('modalItemActions');
  renderInventory();
  checkLowStock();
  toast('Quantity updated to ' + newQty, 'success');
}

function toggleSoldOut() {
  const item = DB.items.find(i => i.id === actionItemId);
  if (!item) return;
  item.soldOut = !item.soldOut;
  saveDB();
  closeModal('modalItemActions');
  renderInventory();
  checkLowStock();
  toast(
    item.soldOut ? `"${item.name}" marked as sold out` : `"${item.name}" is now available`,
    'success'
  );
}

function deleteItemAction() {
  const item = DB.items.find(i => i.id === actionItemId);
  if (!item) return;
  const name = item.name;
  // Close modal FIRST so backdrop-filter doesn't swallow the native confirm dialog
  closeModal('modalItemActions');
  setTimeout(() => {
    if (!confirm(`Permanently remove "${name}"?\n\nThis cannot be undone.`)) return;
    DB.items = DB.items.filter(i => i.id !== actionItemId);
    cart     = cart.filter(c => c.id !== actionItemId);
    saveDB();
    renderInventory();
    renderCart();
    checkLowStock();
    toast(`"${name}" removed`, 'success');
  }, 200);
}
