
function onSellSearch(val) {
  const results = document.getElementById('sellSearchResults');
  if (!val.trim()) { results.style.display = 'none'; return; }

  const q = val.toLowerCase();
  const matches = DB.items.filter(i =>
    i.name.toLowerCase().includes(q) || i.uid.toLowerCase().includes(q)
  );
  if (!matches.length) { results.style.display = 'none'; return; }

  results.innerHTML = matches.map(item => {
    const inCart    = cart.find(c => c.id === item.id);
    const available = !item.soldOut && item.qty > 0;
    const qtyBadge  = item.soldOut
      ? '<span class="badge badge-red">Sold Out</span>'
      : item.qty <= 0
        ? '<span class="badge badge-red">0 left</span>'
        : `<span class="badge badge-green">${item.qty} left</span>`;

    return `<div class="search-result-item${available ? '' : ' soldout'}"
                 data-id="${item.id}" data-available="${available}">
      <div class="sri-info">
        <div class="sri-name">${escHtml(item.name)}${inCart ? ' <span class="badge badge-yellow" style="font-size:10px">In cart</span>' : ''}</div>
        <div class="sri-uid">${escHtml(item.uid)}</div>
      </div>
      <div class="sri-qty">${qtyBadge}</div>
    </div>`;
  }).join('');

  results.querySelectorAll('.search-result-item').forEach(el => {
    if (el.dataset.available === 'true') {
      el.addEventListener('click', () => addToCart(el.dataset.id));
    }
  });

  results.style.display = 'block';
}

function onSellSearchKey(e) {
  if (e.key === 'Escape') {
    document.getElementById('sellSearchResults').style.display = 'none';
    document.getElementById('sellSearch').value = '';
  }
}

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrapper')) {
    const r = document.getElementById('sellSearchResults');
    if (r) r.style.display = 'none';
  }
});

/* ── Cart ─────────────────────────────── */
function addToCart(itemId) {
  const item = DB.items.find(i => i.id === itemId);
  if (!item || item.soldOut || item.qty <= 0) {
    toast('Item not available', 'warning'); return;
  }
  const existing = cart.find(c => c.id === itemId);
  if (existing) {
    if (existing.qty < item.qty) {
      existing.qty++;
    } else {
      toast(`Only ${item.qty} available`, 'warning'); return;
    }
  } else {
    cart.push({ id: item.id, qty: 1 });
  }
  document.getElementById('sellSearch').value = '';
  document.getElementById('sellSearchResults').style.display = 'none';
  renderCart();
  toast(`${item.name} added`, 'success');
}

function renderCart() {
  const list = document.getElementById('cartList');
  const cur  = DB.settings.currency || '₹';

  if (!cart.length) {
    list.innerHTML = `<div class="empty-cart">
      <div class="empty-icon">🛍️</div>
      <p>No items added yet.<br>Search above to add items.</p>
    </div>`;
    updateSummary();
    return;
  }

  list.innerHTML = cart.map(entry => {
    const item = DB.items.find(i => i.id === entry.id);
    if (!item) return '';
    const showUid   = DB.settings.showUid !== false;
    const lineTotal = (item.sellPrice || 0) * entry.qty;
    return `<div class="cart-item" data-id="${entry.id}">
      <div class="ci-info">
        <div class="ci-name">${escHtml(item.name)}</div>
        ${showUid ? `<div class="ci-uid">${escHtml(item.uid)}</div>` : ''}
        <div class="ci-price">${cur}${(item.sellPrice || 0).toFixed(2)} each &middot; Total: <strong>${cur}${lineTotal.toFixed(2)}</strong></div>
      </div>
      <div class="ci-qty-ctrl">
        <button class="ci-qty-btn" data-action="dec" data-id="${entry.id}">−</button>
        <span class="ci-qty-val">${entry.qty}</span>
        <button class="ci-qty-btn" data-action="inc" data-id="${entry.id}">+</button>
      </div>
      <button class="ci-remove" data-action="remove" data-id="${entry.id}" title="Remove">✕</button>
    </div>`;
  }).join('');

  list.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id     = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'inc')    changeCartQty(id,  1);
      if (action === 'dec')    changeCartQty(id, -1);
      if (action === 'remove') removeFromCart(id);
    });
  });

  updateSummary();
}

function changeCartQty(itemId, delta) {
  const item  = DB.items.find(i => i.id === itemId);
  const entry = cart.find(c => c.id === itemId);
  if (!entry || !item) return;
  const newQty = entry.qty + delta;
  if (newQty <= 0)        { removeFromCart(itemId); return; }
  if (newQty > item.qty)  { toast(`Only ${item.qty} available`, 'warning'); return; }
  entry.qty = newQty;
  renderCart();
}

function removeFromCart(itemId) {
  cart = cart.filter(c => c.id !== itemId);
  renderCart();
}

function clearCart() {
  if (!cart.length) return;
  cart = [];
  renderCart();
}

function updateSummary() {
  const cur = DB.settings.currency || '₹';
  let totalItems = 0, subtotal = 0;
  cart.forEach(entry => {
    const item = DB.items.find(i => i.id === entry.id);
    if (item) { totalItems += entry.qty; subtotal += (item.sellPrice || 0) * entry.qty; }
  });
  document.getElementById('summaryItems').textContent    = totalItems;
  const fmt = cart.length ? `${cur}${subtotal.toFixed(2)}` : '—';
  document.getElementById('summarySubtotal').textContent = fmt;
  document.getElementById('summaryTotal').textContent    = fmt;
  document.getElementById('confirmSaleBtn').disabled     = !cart.length;
}

/* ── Confirm Sale ─────────────────────── */
function confirmSale() {
  if (!cart.length) return;

  // Validate stock first
  for (const entry of cart) {
    const item = DB.items.find(i => i.id === entry.id);
    if (!item) { toast('An item in the cart no longer exists', 'error'); return; }
    if (item.soldOut || item.qty < entry.qty) {
      toast(`Not enough stock for: ${item.name}`, 'error'); return;
    }
  }

  const now = new Date();
  let revenue = 0, profit = 0;
  const saleItems = [];

  cart.forEach(entry => {
    const item = DB.items.find(i => i.id === entry.id);
    if (!item) return;
    item.qty -= entry.qty;
    if (item.qty < 0) item.qty = 0;
    const rev  = (item.sellPrice || 0) * entry.qty;
    const prof = ((item.sellPrice || 0) - (item.buyPrice || 0)) * entry.qty;
    revenue += rev;
    profit  += prof;
    saleItems.push({ name: item.name, uid: item.uid, qty: entry.qty, price: item.sellPrice || 0, total: rev });
  });

  checkDailyReset();
  DB.todayRevenue   += revenue;
  DB.todayProfit    += profit;
  DB.allTimeRevenue += revenue;
  DB.allTimeProfit  += profit;

  const todayStr = now.toLocaleDateString('en-CA');
  DB.periodTrackers.forEach(pt => {
    if (todayStr >= pt.start && todayStr <= pt.end) {
      pt.revenue = (pt.revenue || 0) + revenue;
      pt.profit  = (pt.profit  || 0) + profit;
    }
  });

  DB.sales.push({
    id: 'sale_' + Date.now(),
    time: now.toISOString(),
    items: saleItems,
    total: revenue,
    profit
  });

  saveDB();
  cart = [];
  renderCart();
  renderRecentSales();
  checkLowStock();
  toast(`Sale confirmed! ${DB.settings.currency || '₹'}${revenue.toFixed(2)}`, 'success');
}

/* ── Recent Sales ─────────────────────── */
function renderRecentSales() {
  const container = document.getElementById('recentSalesList');
  if (!container) return;

  const todayStr  = new Date().toLocaleDateString('en-CA');
  const todaySales = DB.sales
    .filter(s => s.time.slice(0, 10) === todayStr)
    .slice(-5)
    .reverse();
  const cur = DB.settings.currency || '₹';

  if (!todaySales.length) {
    container.innerHTML = '<span style="color:var(--text-muted)">No sales yet today.</span>';
    return;
  }

  container.innerHTML = todaySales.map(s => {
    const t       = new Date(s.time);
    const timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const names   = s.items.map(i => escHtml(i.name)).join(', ');
    return `<div style="padding:7px 0;border-bottom:1px solid var(--border-soft);
                        display:flex;justify-content:space-between;align-items:center;gap:8px">
      <span style="color:var(--text-secondary);font-size:13px;flex:1;overflow:hidden;
                   text-overflow:ellipsis;white-space:nowrap">${names}</span>
      <span style="font-weight:600;white-space:nowrap;font-size:13px">
        ${cur}${s.total.toFixed(2)}
        <span style="color:var(--text-muted);font-weight:400">${timeStr}</span>
      </span>
    </div>`;
  }).join('');
}
