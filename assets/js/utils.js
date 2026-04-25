
function escHtml(str) {
  if (typeof str !== 'string') str = String(str || '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Toast notifications ──────────────── */
function toast(msg, type = '') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  const icons = { success: '✓', warning: '⚠', error: '✕' };
  el.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${escHtml(msg)}`;
  container.appendChild(el);

  setTimeout(() => {
    el.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
  }, 2800);
}

/* ── Modal helpers ────────────────────── */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

// Close modals on overlay click
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
});

/* ── Clock ────────────────────────────── */
function updateClock() {
  const el = document.getElementById('clockDisplay');
  if (!el) return;
  const now = new Date();
  el.textContent =
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0');
}

setInterval(updateClock, 10000);
