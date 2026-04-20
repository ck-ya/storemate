let currentTab = 'sell';
let currentView = 'grid';

function init() {
  loadDB();
  
  const nameEl = document.querySelector('.brand-name');
  if (nameEl && DB.settings.storeName) nameEl.textContent = DB.settings.storeName;
  
  updateClock();
  setInterval(updateClock, 1000);
  switchTab('sell');
}

function switchTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  
  document.getElementById(`page-${tabId}`).classList.add('active');
  document.getElementById(`tab-${tabId}`).classList.add('active');
  
  const fab = document.getElementById('fabAdd');
  if (tabId === 'inventory') {
    fab.style.display = 'flex';
    renderInventory();
  } else {
    fab.style.display = 'none';
  }
}

function updateClock() {
  const el = document.getElementById('clockDisplay');
  if (el) el.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

window.onload = init;