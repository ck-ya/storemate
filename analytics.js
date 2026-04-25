/* ════════════════════════════════════════
   ANALYTICS — Stats, Period Trackers
   ════════════════════════════════════════ */

function renderAnalytics() {
  const cur         = DB.settings.currency || '₹';
  const lowThresh   = DB.settings.lowStockThreshold || 5;
  const totalItems  = DB.items.length;
  const totalStock  = DB.items.reduce((s, i) => s + (i.soldOut ? 0 : i.qty), 0);
  const soldOutCount = DB.items.filter(i => i.soldOut).length;
  const lowCount    = DB.items.filter(i => !i.soldOut && i.qty > 0 && i.qty <= lowThresh).length;

  /* ── Stat cards ── */
  document.getElementById('analyticsCards').innerHTML = `
    <div class="stat-card">
      <div class="stat-icon">📦</div>
      <div class="stat-label">Total Items</div>
      <div class="stat-value">${totalItems}</div>
      <div class="stat-sub">${totalStock} units in stock</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">💰</div>
      <div class="stat-label">Today's Revenue</div>
      <div class="stat-value">${cur}${(DB.todayRevenue || 0).toFixed(2)}</div>
      <div class="stat-sub">Resets at 12:00 PM daily</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">📈</div>
      <div class="stat-label">Today's Profit</div>
      <div class="stat-value">${cur}${(DB.todayProfit || 0).toFixed(2)}</div>
      <div class="stat-sub">After buying cost</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🏆</div>
      <div class="stat-label">All-Time Revenue</div>
      <div class="stat-value">${cur}${(DB.allTimeRevenue || 0).toFixed(2)}</div>
      <div class="stat-sub">Total ever earned</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">💎</div>
      <div class="stat-label">All-Time Profit</div>
      <div class="stat-value">${cur}${(DB.allTimeProfit || 0).toFixed(2)}</div>
      <div class="stat-sub">Net profit overall</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">⚠️</div>
      <div class="stat-label">Low Stock Items</div>
      <div class="stat-value">${lowCount}</div>
      <div class="stat-sub">${soldOutCount} currently sold out</div>
    </div>
  `;

  /* ── Period trackers ── */
  _renderPeriodTrackers(cur);

  /* ── Items overview table ── */
  _renderItemsTable(cur, lowThresh);
}

function _renderPeriodTrackers(cur) {
  const ptContainer = document.getElementById('periodTrackers');
  if (!DB.periodTrackers || !DB.periodTrackers.length) {
    ptContainer.innerHTML = '<div class="no-data">No period trackers yet. Click "+ Period Tracker" to add one.</div>';
    return;
  }

  ptContainer.innerHTML = DB.periodTrackers.map((pt, idx) => `
    <div class="period-card">
      <div class="pc-info">
        <div class="pc-title">${escHtml(pt.name)}</div>
        <div class="pc-range">${pt.start} → ${pt.end}</div>
      </div>
      <div class="pc-values">
        <div class="pc-val">
          <div class="pc-val-num">${cur}${(pt.revenue || 0).toFixed(2)}</div>
          <div class="pc-val-label">Revenue</div>
        </div>
        <div class="pc-val">
          <div class="pc-val-num">${cur}${(pt.profit || 0).toFixed(2)}</div>
          <div class="pc-val-label">Profit</div>
        </div>
      </div>
      <div class="pc-actions">
        <button class="btn btn-outline btn-xs" data-pt-action="reset"  data-pt-idx="${idx}">Reset</button>
        <button class="btn btn-danger  btn-xs" data-pt-action="delete" data-pt-idx="${idx}">✕</button>
      </div>
    </div>
  `).join('');

  // Event delegation — no confirm inside modal backdrop here
  ptContainer.querySelectorAll('[data-pt-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx    = parseInt(btn.dataset.ptIdx);
      const action = btn.dataset.ptAction;
      if (action === 'reset')  resetPeriod(idx);
      if (action === 'delete') deletePeriod(idx);
    });
  });
}

function _renderItemsTable(cur, lowThresh) {
  const table = document.getElementById('itemsOverviewTable');
  if (!DB.items.length) { table.innerHTML = '<div class="no-data">No items yet.</div>'; return; }

  const headers = ['Name','UID','Stock','Buy Price','Sell Price','Margin','Status'];
  const thStyle = 'padding:10px 14px;color:var(--text-muted);font-weight:600;border-bottom:1px solid var(--border-soft);text-align:left';

  table.innerHTML = `<div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:var(--cream)">
          ${headers.map(h => `<th style="${thStyle}">${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${DB.items.map(item => {
          const margin = item.buyPrice > 0
            ? (((item.sellPrice - item.buyPrice) / item.buyPrice) * 100).toFixed(1) + '%'
            : '—';
          const isLow = !item.soldOut && item.qty > 0 && item.qty <= lowThresh;
          const statusBadge = item.soldOut
            ? '<span class="badge badge-red">Sold Out</span>'
            : item.qty <= 0 ? '<span class="badge badge-red">OOS</span>'
            : isLow ? '<span class="badge badge-orange">Low</span>'
            : '<span class="badge badge-green">OK</span>';
          return `<tr style="border-bottom:1px solid var(--border-soft)">
            <td style="padding:10px 14px;font-weight:500">${escHtml(item.name)}</td>
            <td style="padding:10px 14px;color:var(--text-muted)">${escHtml(item.uid)}</td>
            <td style="padding:10px 14px;font-weight:600">${item.qty}${item.unit ? ' ' + escHtml(item.unit) : ''}</td>
            <td style="padding:10px 14px">${cur}${(item.buyPrice  || 0).toFixed(2)}</td>
            <td style="padding:10px 14px">${cur}${(item.sellPrice || 0).toFixed(2)}</td>
            <td style="padding:10px 14px">${margin}</td>
            <td style="padding:10px 14px">${statusBadge}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>`;
}

/* ── Reset today's revenue ────────────── */
function resetTodayRevenue() {
  if (!confirm("Reset today's revenue and profit to 0?\n\nThis will not affect All-Time totals.")) return;
  DB.todayRevenue = 0;
  DB.todayProfit  = 0;
  // Use _r suffix so checkDailyReset() won't immediately re-trigger this slot
  DB.todayDate = getTodayKey() + '_r';
  saveDB();
  renderAnalytics();
  toast("Today's revenue reset to 0", 'success');
}

/* ── Period tracker modal ─────────────── */
function openAddPeriod() {
  document.getElementById('periodName').value  = '';
  const today = new Date().toLocaleDateString('en-CA');
  document.getElementById('periodStart').value = today;
  document.getElementById('periodEnd').value   = today;
  openModal('modalAddPeriod');
}

function savePeriodTracker() {
  const name  = (document.getElementById('periodName').value  || '').trim();
  const start = document.getElementById('periodStart').value;
  const end   = document.getElementById('periodEnd').value;

  if (!name)          { toast('Tracker name is required', 'error'); return; }
  if (!start || !end) { toast('Start and end dates are required', 'error'); return; }
  if (start > end)    { toast('Start date must be before end date', 'error'); return; }

  if (!Array.isArray(DB.periodTrackers)) DB.periodTrackers = [];
  DB.periodTrackers.push({ id: 'pt_' + Date.now(), name, start, end, revenue: 0, profit: 0 });
  saveDB();
  closeModal('modalAddPeriod');
  renderAnalytics();
  toast(`Period tracker "${name}" created`, 'success');
}

function resetPeriod(idx) {
  const pt = DB.periodTrackers[idx];
  if (!pt) return;
  if (!confirm(`Reset tracker "${pt.name}" to 0?\n\nThis will not affect All-Time totals.`)) return;
  DB.periodTrackers[idx].revenue = 0;
  DB.periodTrackers[idx].profit  = 0;
  saveDB();
  renderAnalytics();
  toast('Period tracker reset', 'success');
}

function deletePeriod(idx) {
  const pt = DB.periodTrackers[idx];
  if (!pt) return;
  if (!confirm(`Delete tracker "${pt.name}"?`)) return;
  DB.periodTrackers.splice(idx, 1);
  saveDB();
  renderAnalytics();
  toast('Tracker deleted', 'success');
}
