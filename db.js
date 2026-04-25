/* ════════════════════════════════════════
   DB — State, Storage, Daily Reset
   ════════════════════════════════════════ */

const STORAGE_KEY = 'shopmate_db_v2';

const DEFAULT_DB = {
  items: [],
  sales: [],
  todayRevenue: 0,
  todayProfit: 0,
  todayDate: '',
  allTimeRevenue: 0,
  allTimeProfit: 0,
  periodTrackers: [],
  settings: {
    storeName: 'ShopMate',
    currency: '₹',
    lowStockThreshold: 5,
    defaultGrid: true,
    showUid: true,
  }
};

// Live working copy — mutated directly by all modules
let DB = JSON.parse(JSON.stringify(DEFAULT_DB));

// Cart lives here too (separate from persisted data)
let cart = [];

/* ── Persist ──────────────────────────── */
function saveDB() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
  } catch (e) {
    console.error('[ShopMate] saveDB failed:', e);
  }
}

function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      DB = Object.assign(JSON.parse(JSON.stringify(DEFAULT_DB)), saved);
      DB.settings = Object.assign(
        JSON.parse(JSON.stringify(DEFAULT_DB.settings)),
        saved.settings || {}
      );
      if (!Array.isArray(DB.items))          DB.items = [];
      if (!Array.isArray(DB.sales))          DB.sales = [];
      if (!Array.isArray(DB.periodTrackers)) DB.periodTrackers = [];
    }
  } catch (e) {
    console.error('[ShopMate] loadDB failed:', e);
    DB = JSON.parse(JSON.stringify(DEFAULT_DB));
  }
  checkDailyReset();
}

/* ── Daily reset (noon-based) ─────────── */
function getTodayKey() {
  const now  = new Date();
  const date = now.toLocaleDateString('en-CA');        // YYYY-MM-DD local time
  const slot = now.getHours() >= 12 ? 'pm' : 'am';
  return `${date}_${slot}`;
}

function checkDailyReset() {
  const key = getTodayKey();
  if (DB.todayDate !== key) {
    DB.todayRevenue = 0;
    DB.todayProfit  = 0;
    DB.todayDate    = key;
    saveDB();
  }
}
