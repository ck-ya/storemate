let cart = [];

function onSellSearch(val) {
  const resultsEl = document.getElementById('sellSearchResults');
  if (!val.trim()) {
    resultsEl.style.display = 'none';
    return;
  }
  
  const query = val.toLowerCase();
  const matches = DB.items.filter(i => 
    i.name.toLowerCase().includes(query) || i.uid.toLowerCase().includes(query)
  ).slice(0, 5);
  
  if (!matches.length) {
    resultsEl.style.display = 'none';
    return;
  }
  
  resultsEl.innerHTML = matches.map(item => `
    <div class="search-result-item" onclick="addToCart('${item.id}')">
      <div class="sri-info">
        <div class="sri-name">${item.name}</div>
        <div class="sri-uid">${item.uid}</div>
      </div>
      <div class="sri-qty">${item.qty} ${item.unit}</div>
    </div>
  `).join('');
  resultsEl.style.display = 'block';
}

function addToCart(itemId) {
  const item = DB.items.find(i => i.id === itemId);
  if (!item || item.qty <= 0) return;
  
  const existing = cart.find(c => c.id === itemId);
  if (existing) {
    if (existing.qty < item.qty) existing.qty++;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  
  document.getElementById('sellSearchResults').style.display = 'none';
  document.getElementById('sellSearch').value = '';
  renderCart();
}

function renderCart() {
  const list = document.getElementById('cartList');
  const empty = document.getElementById('cartEmpty');
  
  if (cart.length === 0) {
    list.innerHTML = '';
    list.appendChild(empty);
    document.getElementById('confirmSaleBtn').disabled = true;
  } else {
    empty.remove();
    list.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="ci-info">
          <div class="ci-name">${item.name}</div>
          <div class="ci-price">${DB.settings.currency}${item.sellPrice}</div>
        </div>
        <div class="ci-qty-val">${item.qty}</div>
      </div>
    `).join('');
    document.getElementById('confirmSaleBtn').disabled = false;
  }
  updateSummary();
}

function updateSummary() {
  const total = cart.reduce((sum, item) => sum + (item.sellPrice * item.qty), 0);
  document.getElementById('summaryTotal').textContent = `${DB.settings.currency}${total}`;
  document.getElementById('summaryItems').textContent = cart.length;
}

function confirmSale() {
  cart.forEach(cartItem => {
    const dbItem = DB.items.find(i => i.id === cartItem.id);
    if (dbItem) dbItem.qty -= cartItem.qty;
  });
  
  DB.sales.push({
    id: Date.now(),
    date: new Date().toISOString(),
    items: [...cart],
    total: cart.reduce((sum, i) => sum + (i.sellPrice * i.qty), 0)
  });
  
  cart = [];
  saveDB();
  renderCart();
  showToast("Sale confirmed!", "success");
}