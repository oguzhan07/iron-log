/* ============================================================
   HOME VIEW
   ============================================================ */

import { DAYS, TAG_CLASSES, TAG_LABELS } from '../utils/constants.js';
import { formatDate, getVolume, getTodayIndex } from '../utils/helpers.js';

// Render entire home view
export function renderHome(state) {
  renderStats(state);
  renderWeekGrid(state);
  renderRecentLogs(state);
}

// Render statistics cards
function renderStats(state) {
  const container = document.getElementById('homeStats');
  if (!container) return;

  const totalWorkouts = state.logs.length;
  
  // Week volume
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const weekLogs = state.logs.filter(log => 
    new Date(log.date).getTime() > weekAgo
  );
  const weekVolume = weekLogs.reduce((sum, log) => 
    sum + log.exercises.reduce((s2, ex) => s2 + getVolume(ex.sets), 0), 0
  );
  
  // Streak calculation
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    
    if (state.logs.some(log => new Date(log.date).toDateString() === dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  
  // Month logs
  const monthAgo = Date.now() - 30 * 24 * 3600 * 1000;
  const monthLogs = state.logs.filter(log => 
    new Date(log.date).getTime() > monthAgo
  );

  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">TOPLAM ANTRENMAN</div>
      <div class="stat-value">${totalWorkouts}</div>
      <div class="stat-sub">tüm zamanlar</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">HAFTALIK HACİM</div>
      <div class="stat-value">${Math.round(weekVolume).toLocaleString('tr')}</div>
      <div class="stat-sub">kg × tekrar</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">SERİ</div>
      <div class="stat-value">${streak}</div>
      <div class="stat-sub">gün üst üste</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">BU AY</div>
      <div class="stat-value">${monthLogs.length}</div>
      <div class="stat-sub">antrenman</div>
    </div>
  `;
}

// Render week grid
function renderWeekGrid(state) {
  const container = document.getElementById('weekGrid');
  if (!container) return;

  const todayIndex = getTodayIndex();

  container.innerHTML = DAYS.map((dayName, index) => {
    const prog = state.program.find(d => d.day === index);
    const isToday = index === todayIndex;
    const isRest = !prog || prog.type === 'rest';

    if (isRest) {
      return `
        <div class="week-day rest-day">
          <div class="day-name">${dayName}</div>
          ${prog ? 
            `<span class="tag tag-rest" style="font-size:9px">DİNLENME</span>` : 
            `<span style="color:var(--text3);font-size:11px;font-family:'DM Mono',monospace">—</span>`
          }
        </div>
      `;
    }

    const totalSets = prog.exercises.reduce((sum, ex) => sum + ex.sets, 0);

    return `
      <div class="week-day ${isToday ? 'active-day' : ''}" onclick="window.openDayWorkout(${index})">
        <div class="day-name">
          ${dayName}
          ${isToday ? '<span class="live-dot" style="margin-left:4px"></span>' : ''}
        </div>
        <div class="day-program-name">${prog.name}</div>
        <span class="tag ${TAG_CLASSES[prog.type]}" style="font-size:9px;margin-bottom:6px">
          ${TAG_LABELS[prog.type]}
        </span>
        <div class="day-exercise-count" style="margin-top:8px">
          ${prog.exercises.length} egzersiz · ${totalSets} set
        </div>
      </div>
    `;
  }).join('');
}

// Render recent logs
function renderRecentLogs(state) {
  const container = document.getElementById('recentLogs');
  if (!container) return;

  if (state.logs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🏋️</div>
        <p>Henüz antrenman kaydedilmedi</p>
      </div>
    `;
    return;
  }

  const recentLogs = state.logs.slice(0, 8);

  container.innerHTML = recentLogs.map(log => {
    const volume = log.exercises.reduce((sum, ex) => sum + getVolume(ex.sets), 0);
    const prog = state.program.find(d => d.day === log.dayIndex);
    const tagClass = prog ? TAG_CLASSES[prog.type] : 'tag-full';

    return `
      <div class="log-item">
        <div class="log-date">${formatDate(log.date)}</div>
        <div>
          <div class="log-name">${log.name}</div>
          <span class="tag ${tagClass}" style="font-size:9px;margin-top:3px">
            ${log.exercises.length} egzersiz
          </span>
        </div>
        <div class="log-volume">${Math.round(volume).toLocaleString('tr')} kg vol</div>
      </div>
    `;
  }).join('');
}