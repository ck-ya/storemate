function renderInventory(query = '') {
  const container = document.getElementById('inventoryContainer');
  const filtered = DB.items.filter(i => 
    i.name.toLowerCase().includes(query.toLowerCase()) || 
    i.uid.toLowerCase().includes(query.toLowerCase())
  );
  
  container.className = currentView === 'grid' ? 'inv-grid' : 'inv-list';
  
  container.innerHTML = filtered.map(item => `
    <div class="inv-card ${item.qty <= DB.settings.lowStockThreshold ? 'low-stock' : ''}">
      <div class="ic-name">${item.name}</div>
      <div class="ic-uid">${item.uid}</div>
      <div class="ic-qty">${item.qty} <span class="ic-qty-label">${item.unit}</span></div>
      <div class="ic-prices">
        <span class="ic-price-tag">${DB.settings.currency}${item.sellPrice}</span>
      </div>
    </div>
  `).join('');
}

function openAddItem() {
  document.getElementById('newItemName').value = '';
  document.getElementById('newItemUID').value = '';
  document.getElementById('newItemQty').value = '';
  document.getElementById('newItemUnit').value = '';
  document.getElementById('newItemSellPrice').value = '';
  openModal('modalAddItem');
}

function saveNewItem() {
  const name = document.getElementById('newItemName').value;
  const uid = document.getElementById('newItemUID').value;
  const qty = parseInt(document.getElementById('newItemQty').value);
  const unit = document.getElementById('newItemUnit').value;
  const sellPrice = parseFloat(document.getElementById('newItemSellPrice').value);
  
  if (!name || !uid || isNaN(qty) || isNaN(sellPrice)) {
    showToast("Please fill required fields", "error");
    return;
  }
  
  DB.items.push({
    id: 'item_' + Date.now(),
    name, uid, qty, unit, sellPrice,
    buyPrice: parseFloat(document.getElementById('newItemBuyPrice').value) || 0
  });
  
  saveDB();
  closeModal('modalAddItem');
  renderInventory();
  showToast("Item added!", "success");
}

function setView(view) {
  currentView = view;
  document.getElementById('viewGrid').classList.toggle('active', view === 'grid');
  document.getElementById('viewList').classList.toggle('active', view === 'list');
  renderInventory();
}