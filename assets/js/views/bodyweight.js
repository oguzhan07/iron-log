/* ============================================================
   BODY WEIGHT VIEW — v2
   ============================================================ */

import { showToast, openModal, closeModal } from '../utils/ui.js';
import { saveBodyWeightLog, deleteBodyWeightLog } from '../firebase/firestore.js';

let bwChart = null;

export function renderBodyWeight(state) {
  const container = document.getElementById('view-bodyweight');
  if (!container) return;

  const logs = (state.bodyWeightLogs || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = logs[logs.length - 1];
  const oldest = logs[0];
  const diff = latest && oldest && logs.length > 1
    ? (latest.weight - oldest.weight).toFixed(1)
    : null;

  // Stats
  const statsEl = document.getElementById('bwStats');
  if (statsEl) {
    statsEl.innerHTML = latest ? `
      <div class="stat-card">
        <div class="stat-label">SON KİLO</div>
        <div class="stat-value">${latest.weight}</div>
        <div class="stat-sub">kg</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">TOPLAM DEĞİŞİM</div>
        <div class="stat-value" style="color:${diff > 0 ? 'var(--accent2)' : diff < 0 ? 'var(--green)' : 'var(--accent)'}">
          ${diff !== null ? (diff > 0 ? '+' : '') + diff : '—'}
        </div>
        <div class="stat-sub">kg (${logs.length} kayıt)</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">MIN / MAX</div>
        <div class="stat-value" style="font-size:22px">${Math.min(...logs.map(l => l.weight))} <span style="color:var(--text3);font-size:14px">/</span> ${Math.max(...logs.map(l => l.weight))}</div>
        <div class="stat-sub">kg</div>
      </div>
    ` : '<div style="color:var(--text3);font-family:var(--font-mono);font-size:11px;padding:16px">Henüz kayıt yok</div>';
  }

  // Chart
  renderBWChart(logs);

  // Table
  const tableEl = document.getElementById('bwTable');
  if (tableEl) {
    const recent = [...logs].reverse().slice(0, 30);
    if (recent.length === 0) {
      tableEl.innerHTML = `<div class="empty-state" style="padding:30px"><div class="icon">⚖️</div><p>Kilo kaydı yok. İlk kaydı ekle!</p></div>`;
    } else {
      tableEl.innerHTML = `
        <table class="bw-table">
          <thead><tr><th>TARİH</th><th>KİLO</th><th>DEĞİŞİM</th><th>NOT</th><th></th></tr></thead>
          <tbody>
            ${recent.map((log, i) => {
              const prev = recent[i + 1];
              const delta = prev ? (log.weight - prev.weight).toFixed(1) : null;
              const deltaHtml = delta !== null
                ? `<span class="delta-badge ${delta > 0 ? 'delta-up' : delta < 0 ? 'delta-down' : 'delta-same'}">${delta > 0 ? '+' : ''}${delta}</span>`
                : '—';
              return `
                <tr>
                  <td style="font-family:'DM Mono',monospace;font-size:11px;color:var(--text2)">${new Date(log.date).toLocaleDateString('tr-TR', {day:'2-digit',month:'short',year:'numeric'})}</td>
                  <td style="font-family:'DM Mono',monospace;font-weight:600;color:var(--accent)">${log.weight} kg</td>
                  <td>${deltaHtml}</td>
                  <td style="font-size:12px;color:var(--text3)">${log.note || '—'}</td>
                  <td><button class="btn btn-danger btn-sm" onclick="window.deleteBWLog('${log.id}')">✕</button></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
  }
}

function renderBWChart(logs) {
  const canvas = document.getElementById('bwChart');
  if (!canvas) return;

  if (bwChart) { bwChart.destroy(); bwChart = null; }
  if (logs.length === 0) return;

  const labels = logs.map(l => new Date(l.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }));
  const data = logs.map(l => l.weight);

  bwChart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        borderColor: '#e8ff47',
        backgroundColor: 'rgba(232,255,71,0.07)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#e8ff47',
        pointRadius: 4,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: {
        callbacks: {
          label: ctx => `${ctx.parsed.y} kg`
        }
      }},
      scales: {
        x: { ticks: { color: '#555', font: { family: 'DM Mono', size: 10 } }, grid: { color: '#1a1a1a' } },
        y: { ticks: { color: '#555', font: { family: 'DM Mono', size: 10 }, callback: v => `${v} kg` }, grid: { color: '#1a1a1a' } }
      }
    }
  });
}

// Modal open
export function openAddBWLog() {
  const d = document.getElementById('bwWeightInput');
  const n = document.getElementById('bwNoteInput');
  if (d) d.value = '';
  if (n) n.value = '';
  openModal('modalAddBW');
}

// Save from modal
export async function confirmAddBWLog(state, onUpdate) {
  const weightEl = document.getElementById('bwWeightInput');
  const noteEl = document.getElementById('bwNoteInput');
  const weight = parseFloat(weightEl?.value);

  if (!weight || weight < 20 || weight > 300) {
    showToast('Geçerli bir kilo gir (20–300 kg)', true);
    return;
  }

  const btn = document.getElementById('saveBWBtn');
  if (btn) { btn.disabled = true; btn.textContent = '...'; }

  try {
    await saveBodyWeightLog(weight, noteEl?.value?.trim() || '');
    if (onUpdate) await onUpdate();
    closeModal('modalAddBW');
    showToast(`${weight} kg kaydedildi ✓`);
  } catch (err) {
    showToast('Kayıt hatası: ' + err.message, true);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'KAYDET'; }
  }
}

// Delete
export async function deleteBWLog(state, id, onUpdate) {
  if (!confirm('Bu kaydı silmek istiyor musun?')) return;
  try {
    await deleteBodyWeightLog(id);
    if (onUpdate) await onUpdate();
    showToast('Kayıt silindi.');
  } catch (err) {
    showToast('Silme hatası: ' + err.message, true);
  }
}
