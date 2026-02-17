/* ============================================================
   WORKOUT VIEW
   ============================================================ */

import { DAYS } from '../utils/constants.js';
import { showToast, openModal, closeModal } from '../utils/ui.js';
import { saveWorkoutLog } from '../firebase/firestore.js';
import { getVolume } from '../utils/helpers.js';

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

// Render workout view
export function renderWorkout(state) {
  if (!activeWorkout) return;

  const titleEl = document.getElementById('workoutViewTitle');
  const container = document.getElementById('workoutExercises');
  
  if (titleEl) titleEl.textContent = activeWorkout.name.toUpperCase();
  if (!container) return;

  container.innerHTML = activeWorkout.exercises.map((ex, exIdx) => {
    const lastLog = getLastExerciseLog(state, ex.name);
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
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            ${allDone ? '<span class="tag tag-legs" style="font-size:9px">✓ TAMAM</span>' : ''}
            <span style="color:var(--text3);font-size:18px" id="chevron-${exIdx}">▾</span>
          </div>
        </div>
        <div class="exercise-body" id="exbody-${exIdx}">
          ${renderSetsTable(exIdx, ex, lastLog)}
          <div style="display:flex;gap:8px;margin-top:10px">
            <button class="btn btn-sm btn-ghost" onclick="window.addSetToWorkout(${exIdx})">+ SET</button>
            ${ex.sets.length > 1 ? `<button class="btn btn-sm btn-ghost" onclick="window.removeSetFromWorkout(${exIdx})">− SET</button>` : ''}
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
  const prevSet = lastLog?.sets[setIdx];
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

function getLastExerciseLog(state, exerciseName) {
  for (const log of state.logs) {
    const ex = log.exercises.find(e => 
      e.name.toLowerCase() === exerciseName.toLowerCase()
    );
    if (ex) return ex;
  }
  return null;
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