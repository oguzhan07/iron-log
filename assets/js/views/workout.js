/* ============================================================
   WORKOUT VIEW - ENHANCED
   ============================================================ */

import { DAYS } from '../utils/constants.js';
import { showToast, openModal, closeModal } from '../utils/ui.js';
import { saveWorkoutLog } from '../firebase/firestore.js';
import { getVolume, formatDate } from '../utils/helpers.js';

let activeWorkout = null;

// Open new workout modal
export function openNewWorkout(state) {
  const select = document.getElementById('workoutProgramSelect');
  if (!select) return;

  const trainDays = state.program.filter(d => d.type !== 'rest');
  select.innerHTML = trainDays.map(d =>
    `<option value="${d.day}">${DAYS[d.day]} — ${d.name}</option>`
  ).join('');

  openModal('modalNewWorkout');
}

// Open workout for specific day
export function openDayWorkout(state, dayIndex) {
  const select = document.getElementById('workoutProgramSelect');
  if (!select) return;

  const trainDays = state.program.filter(d => d.type !== 'rest');
  select.innerHTML = trainDays.map(d =>
    `<option value="${d.day}" ${d.day === dayIndex ? 'selected' : ''}>
      ${DAYS[d.day]} — ${d.name}
    </option>`
  ).join('');

  openModal('modalNewWorkout');
}

// Start workout
export function startWorkout(state, onNavigate) {
  const dayIndex = parseInt(document.getElementById('workoutProgramSelect').value);
  const program = state.program.find(d => d.day === dayIndex);
  if (!program) return;

  activeWorkout = {
    dayIndex,
    name: program.name,
    date: new Date().toISOString(),
    exercises: program.exercises.map(ex => ({
      name: ex.name,
      note: ex.note || '',
      targetReps: ex.reps,
      sets: Array.from({ length: ex.sets }, () => ({
        reps: '',
        kg: '',
        done: false
      }))
    }))
  };

  closeModal('modalNewWorkout');
  renderWorkout(state);
  if (onNavigate) onNavigate('workout');
}

// NEW: Get exercise history from logs
function getExerciseHistory(state, exerciseName) {
  const history = [];
  
  for (const log of state.logs) {
    const ex = log.exercises.find(e => 
      e.name.toLowerCase() === exerciseName.toLowerCase()
    );
    
    if (ex) {
      history.push({
        date: log.date,
        sets: ex.sets,
        maxKg: Math.max(...ex.sets.map(s => parseFloat(s.kg) || 0)),
        totalVolume: ex.sets.reduce((sum, s) => 
          sum + (parseFloat(s.kg) || 0) * (parseInt(s.reps) || 0), 0
        )
      });
    }
  }
  
  return history.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// NEW: Calculate suggested weight (progressive overload)
function getSuggestedWeight(state, exerciseName) {
  const history = getExerciseHistory(state, exerciseName);
  if (history.length === 0) return null;
  
  const lastWorkout = history[0];
  const avgKg = lastWorkout.sets.reduce((sum, s) => sum + (parseFloat(s.kg) || 0), 0) / lastWorkout.sets.length;
  
  // Progressive overload: +2.5kg for upper body, +5kg for lower body
  const lowerBodyExercises = ['squat', 'deadlift', 'leg press', 'romanian deadlift'];
  const isLowerBody = lowerBodyExercises.some(ex => 
    exerciseName.toLowerCase().includes(ex)
  );
  
  const increment = isLowerBody ? 5 : 2.5;
  const suggested = Math.round((avgKg + increment) * 2) / 2; // Round to nearest 0.5
  
  return {
    suggested,
    lastAvg: Math.round(avgKg * 2) / 2,
    increment
  };
}

// NEW: Show exercise history modal
export function showExerciseHistory(state, exerciseName) {
  const history = getExerciseHistory(state, exerciseName);
  const titleEl = document.getElementById('exerciseHistoryTitle');
  const contentEl = document.getElementById('exerciseHistoryContent');
  
  if (!titleEl || !contentEl) return;
  
  titleEl.textContent = `${exerciseName.toUpperCase()} - GEÇMİŞ`;
  
  if (history.length === 0) {
    contentEl.innerHTML = `
      <div class="empty-state" style="padding:40px 20px">
        <div class="icon">📊</div>
        <p>Bu egzersiz için kayıt bulunamadı</p>
      </div>
    `;
  } else {
    contentEl.innerHTML = history.map((entry, idx) => `
      <div style="margin-bottom:${idx === history.length - 1 ? '0' : '20px'}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--text2)">
            ${formatDate(entry.date)}
          </div>
          <div style="display:flex;gap:12px">
            <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--text3)">
              Max: <span style="color:var(--accent)">${entry.maxKg}kg</span>
            </span>
            <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--text3)">
              Vol: <span style="color:var(--accent2)">${Math.round(entry.totalVolume)}kg</span>
            </span>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:6px">
          ${entry.sets.map((set, setIdx) => `
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:6px 8px;text-align:center">
              <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--text3);margin-bottom:2px">
                Set ${setIdx + 1}
              </div>
              <div style="font-family:'DM Mono',monospace;font-size:13px;font-weight:500">
                ${set.kg}kg × ${set.reps}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ${idx < history.length - 1 ? '<div class="divider"></div>' : ''}
    `).join('');
  }
  
  openModal('modalExerciseHistory');
}

function getLastExerciseLog(state, exName) {
  for (const log of state.logs) {
    const ex = log.exercises.find(e => e.name.toLowerCase() === exName.toLowerCase());
    if (ex) return ex;
  }
  return null;
}

// Render workout view
export function renderWorkout(state) {
  if (!activeWorkout) return;

  const titleEl = document.getElementById('workoutViewTitle');
  const container = document.getElementById('workoutExercises');
  
  if (titleEl) titleEl.textContent = activeWorkout.name.toUpperCase();
  if (!container) return;

  container.innerHTML = activeWorkout.exercises.map((ex, exIdx) => {
    const lastLog = getLastExerciseLog(state, ex.name);
    const suggested = getSuggestedWeight(state, ex.name);
    const allDone = ex.sets.every(s => s.done);

    return `
      <div class="exercise-item" id="ex-${exIdx}">
        <div class="exercise-header" onclick="window.toggleExercise(${exIdx})">
          <div>
            <div class="exercise-name">${ex.name}</div>
            <div class="exercise-meta">
              ${ex.sets.length} set · ${ex.targetReps} tekrar hedefi
              ${ex.note ? ' · ' + ex.note : ''}
            </div>
            ${suggested ? `
              <div style="margin-top:4px;font-family:'DM Mono',monospace;font-size:10px;color:var(--accent3)">
                💡 Önerilen: ${suggested.suggested}kg (önceki ort: ${suggested.lastAvg}kg, +${suggested.increment}kg)
              </div>
            ` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            ${allDone ? '<span class="tag tag-legs" style="font-size:9px">✓ TAMAM</span>' : ''}
            <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation(); window.showExerciseHistory('${ex.name.replace(/'/g, "\\'")}')">
              📊 GEÇMİŞ
            </button>
            <span style="color:var(--text3);font-size:18px" id="chevron-${exIdx}">▾</span>
          </div>
        </div>
        <div class="exercise-body" id="exbody-${exIdx}">
          ${renderSetsTable(exIdx, ex, lastLog)}
          <div style="display:flex;gap:8px;margin-top:10px">
            <button class="btn btn-sm btn-ghost" onclick="window.addSetToWorkout(${exIdx})">+ SET</button>
            ${ex.sets.length > 1 ? `<button class="btn btn-sm btn-ghost" onclick="window.removeSetFromWorkout(${exIdx})">− SET</button>` : ''}
            ${suggested ? `
              <button class="btn btn-sm" onclick="window.applySuggestedWeight(${exIdx}, ${suggested.suggested})">
                ✨ ${suggested.suggested}kg Uygula
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderSetsTable(exIdx, exercise, lastLog) {
  return `
    <table class="sets-table">
      <thead>
        <tr>
          <th>SET</th>
          <th>KG</th>
          <th>TEKRAR</th>
          <th>ÖNCEKİ</th>
          <th>FARK</th>
          <th>✓</th>
        </tr>
      </thead>
      <tbody>
        ${exercise.sets.map((set, setIdx) => renderSetRow(exIdx, setIdx, set, lastLog)).join('')}
      </tbody>
    </table>
  `;
}

function renderSetRow(exIdx, setIdx, set, lastLog) {
  const prevSet = lastLog ? (lastLog.sets[setIdx] || null) : null;
  const prevStr = prevSet ? `${prevSet.kg}kg × ${prevSet.reps}` : '—';
  
  let delta = '';
  if (prevSet && set.kg && set.reps) {
    const curVol = (parseFloat(set.kg) || 0) * (parseFloat(set.reps) || 0);
    const prevVol = (parseFloat(prevSet.kg) || 0) * (parseInt(prevSet.reps) || 0);
    const diff = curVol - prevVol;
    
    if (diff > 0) delta = `<span class="delta-badge delta-up">+${Math.round(diff)}</span>`;
    else if (diff < 0) delta = `<span class="delta-badge delta-down">${Math.round(diff)}</span>`;
    else delta = `<span class="delta-badge delta-same">=</span>`;
  }

  return `
    <tr class="${set.done ? 'set-done' : ''}" id="setrow-${exIdx}-${setIdx}">
      <td>
        <span style="font-family:'DM Mono',monospace;font-size:12px;color:${set.done ? 'var(--green)' : 'var(--text3)'}">
          ${setIdx + 1}
        </span>
      </td>
      <td>
        <input type="number" class="set-input" placeholder="—" value="${set.kg}" 
          onchange="window.updateWorkoutSet(${exIdx}, ${setIdx}, 'kg', this.value)" 
          step="0.5" min="0">
      </td>
      <td>
        <input type="number" class="set-input" placeholder="—" value="${set.reps}" 
          onchange="window.updateWorkoutSet(${exIdx}, ${setIdx}, 'reps', this.value)" 
          min="0">
      </td>
      <td><span class="prev-value">${prevStr}</span></td>
      <td id="delta-${exIdx}-${setIdx}">${delta}</td>
      <td>
        <input type="checkbox" class="checkbox-done" ${set.done ? 'checked' : ''} 
          onchange="window.toggleWorkoutSetDone(${exIdx}, ${setIdx}, this.checked)">
      </td>
    </tr>
  `;
}

// NEW: Apply suggested weight to all sets
export function applySuggestedWeight(state, exIdx, suggestedKg) {
  if (!activeWorkout) return;
  
  activeWorkout.exercises[exIdx].sets.forEach((set, idx) => {
    set.kg = suggestedKg;
  });
  
  renderWorkout(state);
  showToast(`${suggestedKg}kg tüm setlere uygulandı`);
}

// Toggle exercise collapse
export function toggleExercise(exIdx) {
  const body = document.getElementById(`exbody-${exIdx}`);
  const chevron = document.getElementById(`chevron-${exIdx}`);
  
  if (body && chevron) {
    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : '';
    chevron.textContent = isOpen ? '▸' : '▾';
  }
}

// Update set value
export function updateSet(state, exIdx, setIdx, field, value) {
  if (!activeWorkout) return;
  activeWorkout.exercises[exIdx].sets[setIdx][field] = value;
  
  // Update delta
  const ex = activeWorkout.exercises[exIdx];
  const lastLog = getLastExerciseLog(state, ex.name);
  const set = ex.sets[setIdx];
  const prevSet = lastLog?.sets[setIdx];
  const deltaCell = document.getElementById(`delta-${exIdx}-${setIdx}`);
  
  if (deltaCell && prevSet && set.kg && set.reps) {
    const diff = (parseFloat(set.kg) || 0) * (parseFloat(set.reps) || 0) - 
                 (parseFloat(prevSet.kg) || 0) * (parseInt(prevSet.reps) || 0);
    
    deltaCell.innerHTML = diff > 0 ? `<span class="delta-badge delta-up">+${Math.round(diff)}</span>` :
                         diff < 0 ? `<span class="delta-badge delta-down">${Math.round(diff)}</span>` :
                                   `<span class="delta-badge delta-same">=</span>`;
  }
}

// Toggle set done
export function toggleSetDone(state, exIdx, setIdx, checked) {
  if (!activeWorkout) return;
  activeWorkout.exercises[exIdx].sets[setIdx].done = checked;
  renderWorkout(state);
}

// Add set to exercise
export function addSet(state, exIdx) {
  if (!activeWorkout) return;
  activeWorkout.exercises[exIdx].sets.push({ reps: '', kg: '', done: false });
  renderWorkout(state);
}

// Remove set from exercise
export function removeSet(state, exIdx) {
  if (!activeWorkout) return;
  if (activeWorkout.exercises[exIdx].sets.length > 1) {
    activeWorkout.exercises[exIdx].sets.pop();
    renderWorkout(state);
  }
}

// Open add exercise modal
export function openAddExercise() {
  document.getElementById('exWorkoutName').value = '';
  document.getElementById('exWorkoutSets').value = '4';
  document.getElementById('exWorkoutReps').value = '8-10';
  openModal('modalAddExWorkout');
}

// Confirm add exercise
export function confirmAddExercise(state) {
  const name = document.getElementById('exWorkoutName').value.trim();
  const sets = parseInt(document.getElementById('exWorkoutSets').value) || 3;
  const reps = document.getElementById('exWorkoutReps').value.trim() || '10';

  if (!name) {
    showToast('Egzersiz adı gir!', true);
    return;
  }

  if (activeWorkout) {
    activeWorkout.exercises.push({
      name,
      note: '',
      targetReps: reps,
      sets: Array.from({ length: sets }, () => ({ reps: '', kg: '', done: false }))
    });
    closeModal('modalAddExWorkout');
    renderWorkout(state);
  }
}

// Finish workout
export async function finishWorkout(state, onUpdate, onNavigate) {
  if (!activeWorkout) return;

  const btn = document.getElementById('finishBtn');
  btn.disabled = true;
  btn.textContent = '...';

  try {
    const logId = await saveWorkoutLog(activeWorkout);
    
    if (logId && onUpdate) {
      await onUpdate();
      activeWorkout = null;
      showToast('Antrenman kaydedildi! 💪');
      if (onNavigate) onNavigate('home');
    }
  } catch (error) {
    showToast('Kayıt hatası: ' + error.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'KAYDET ✓';
  }
}

// Get active workout (for external use)
export function getActiveWorkout() {
  return activeWorkout;
}
