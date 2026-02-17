/* ============================================================
   COMPARE VIEW
   ============================================================ */

import { formatDate, getVolume, getMaxKg } from '../utils/helpers.js';

// Render compare view
export function renderCompare(state) {
  const selectA = document.getElementById('compareA');
  const selectB = document.getElementById('compareB');
  
  if (!selectA || !selectB) return;

  const options = state.logs.map(log =>
    `<option value="${log.id}">${formatDate(log.date)} — ${log.name}</option>`
  ).join('');

  selectA.innerHTML = options;
  selectB.innerHTML = options;

  if (state.logs.length > 1) {
    selectB.selectedIndex = 1;
  }

  renderComparison(state);
}

// Render comparison
export function renderComparison(state) {
  const logAId = document.getElementById('compareA')?.value;
  const logBId = document.getElementById('compareB')?.value;
  const container = document.getElementById('comparisonResult');
  
  if (!container) return;

  const logA = state.logs.find(l => l.id == logAId);
  const logB = state.logs.find(l => l.id == logBId);

  if (!logA || !logB) {
    container.innerHTML = `
      <div class="empty-state">
        <p>2 antrenman seç</p>
      </div>
    `;
    return;
  }

  const allExerciseNames = [
    ...new Set([
      ...logA.exercises.map(e => e.name),
      ...logB.exercises.map(e => e.name)
    ])
  ];

  const volumeA = logA.exercises.reduce((sum, ex) => sum + getVolume(ex.sets), 0);
  const volumeB = logB.exercises.reduce((sum, ex) => sum + getVolume(ex.sets), 0);
  const volumeDiff = volumeB - volumeA;

  container.innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <span class="card-title">TOPLAM HACİM KARŞILAŞTIRMA</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div>
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--text3);margin-bottom:4px">
            ${formatDate(logA.date)}
          </div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:36px;color:var(--accent)">
            ${Math.round(volumeA).toLocaleString('tr')}
          </div>
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--text3)">
            kg × tekrar
          </div>
        </div>
        <div>
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--text3);margin-bottom:4px">
            ${formatDate(logB.date)}
          </div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:36px;color:${volumeDiff >= 0 ? 'var(--green)' : 'var(--red)'}">
            ${Math.round(volumeB).toLocaleString('tr')}
          </div>
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--text3)">
            kg × tekrar
            <span class="delta-badge ${volumeDiff >= 0 ? 'delta-up' : 'delta-down'}" style="margin-left:6px">
              ${volumeDiff >= 0 ? '+' : ''}${Math.round(volumeDiff).toLocaleString('tr')}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">EGZERSİZ BAZLI KARŞILAŞTIRMA</span>
      </div>
      <table class="comparison-table">
        <thead>
          <tr>
            <th>EGZERSİZ</th>
            <th>${formatDate(logA.date)}</th>
            <th>${formatDate(logB.date)}</th>
            <th>FARK</th>
          </tr>
        </thead>
        <tbody>
          ${allExerciseNames.map(name => {
            const exA = logA.exercises.find(e => 
              e.name.toLowerCase() === name.toLowerCase()
            );
            const exB = logB.exercises.find(e => 
              e.name.toLowerCase() === name.toLowerCase()
            );
            
            const maxA = exA ? getMaxKg(exA.sets) : null;
            const maxB = exB ? getMaxKg(exB.sets) : null;
            const diff = (maxA !== null && maxB !== null) ? (maxB - maxA) : null;

            return `
              <tr>
                <td style="font-weight:500">${name}</td>
                <td style="font-family:'DM Mono',monospace">
                  ${maxA !== null ? maxA + ' kg' : '<span style="color:var(--text3)">—</span>'}
                </td>
                <td style="font-family:'DM Mono',monospace">
                  ${maxB !== null ? maxB + ' kg' : '<span style="color:var(--text3)">—</span>'}
                </td>
                <td>
                  ${diff !== null ? 
                    `<span class="delta-badge ${diff > 0 ? 'delta-up' : diff < 0 ? 'delta-down' : 'delta-same'}">
                      ${diff > 0 ? '+' : ''}${diff} kg
                    </span>` : 
                    '—'
                  }
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}