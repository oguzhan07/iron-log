/* ============================================================
   UI UTILITIES
   ============================================================ */

// Show toast notification
export function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.className = 'toast show' + (isError ? ' error' : '');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

// Open modal
export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('open');
}

// Close modal
export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

// Set syncing state
export function setSyncing(isSyncing) {
  const dot = document.getElementById('syncDot');
  const label = document.getElementById('syncLabel');
  
  if (!dot || !label) return;
  
  dot.className = 'sync-dot' + (isSyncing ? ' syncing' : '');
  label.textContent = isSyncing ? 'SENKRON...' : 'BAĞLI';
}

// Initialize modal click-outside-to-close
export function initModals() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
      }
    });
  });
}