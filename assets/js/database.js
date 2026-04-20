let DB = {
  items: [],
  sales: [],
  settings: {
    storeName: 'ShopMate',
    currency: '₹',
    lowStockThreshold: 5,
    defaultGrid: true,
    showUid: true
  }
};

function loadDB() {
  const data = localStorage.getItem('shopmate_db');
  if (data) {
    try { DB = JSON.parse(data); } catch(e) { console.error("DB Load Error", e); }
  }
}

function saveDB() {
  localStorage.setItem('shopmate_db', JSON.stringify(DB));
}

function exportData() {
  const dataStr = JSON.stringify(DB, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `shopmate_backup_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
}