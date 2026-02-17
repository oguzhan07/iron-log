/* ============================================================
   PROGRAM VIEW
   ============================================================ */

import { DAYS, TAG_CLASSES, TAG_LABELS } from '../utils/constants.js';
import { showToast, openModal, closeModal } from '../utils/ui.js';
import { saveDay, deleteDay } from '../firebase/firestore.js';

let editingDayId = null;
let tempDayExercises = [];

// Render program view
export function renderProgram(state) {
  const container = document.getElementById('programGrid');
  if (!container) return;

  if (state.program.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">📋</div>
        <p>Program boş. Gün ekle!</p>
      </div>
    `;
    return;
  }

  const sortedProgram = [...state.program].sort((a, b) => a.day - b.day);

  container.innerHTML = sortedProgram.map(day => `
    <div class="card" style="margin-bottom:14px">
      <div class="card-header">
        <div>
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--text3);margin-bottom:4px">
            ${DAYS[day.day]}
          </div>
          <div style="font-weight:600;font-size:15px">${day.name}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="tag ${TAG_CLASSES[day.type]}">${TAG_LABELS[day.type]}</span>
          <button class="btn btn-sm" onclick="window.editDayModal('${day.id}')">DÜZENLE</button>
          <button class="btn btn-danger btn-sm" onclick="window.deleteDayModal('${day.id}')">SİL</button>
        </div>
      </div>
      ${day.type === 'rest' ? '' : renderDayExercises(day.exercises)}
    </div>
  `).join('');
}

function renderDayExercises(exercises) {
  return `
    <div style="display:flex;flex-direction:column;gap:6px">
      ${exercises.map(ex => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--surface2);border-radius:4px;border:1px solid var(--border)">
          <div>
            <div style="font-weight:500;font-size:13px">${ex.name}</div>
            ${ex.note ? `<div style="font-size:11px;color:var(--text3);font-family:'DM Mono',monospace;margin-top:1px">${ex.note}</div>` : ''}
          </div>
          <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--text2)">
            ${ex.sets} set × ${ex.reps}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Open add day modal
export function openAddDay() {
  editingDayId = null;
  tempDayExercises = [];
  document.getElementById('daySelect').value = '0';
  document.getElementById('dayProgramName').value = '';
  document.getElementById('dayType').value = 'push';
  renderDayExerciseList();
  openModal('modalAddDay');
}

// Edit existing day
export function editDay(state, dayId) {
  const day = state.program.find(d => d.id === dayId);
  if (!day) return;

  editingDayId = dayId;
  tempDayExercises = JSON.parse(JSON.stringify(day.exercises));
  document.getElementById('daySelect').value = String(day.day);
  document.getElementById('dayProgramName').value = day.name;
  document.getElementById('dayType').value = day.type;
  renderDayExerciseList();
  openModal('modalAddDay');
}

// Delete day
export async function deleteProgram(state, dayId, onUpdate) {
  if (!confirm('Bu günü silmek istiyor musun?')) return;

  try {
    await deleteDay(dayId);
    state.program = state.program.filter(d => d.id !== dayId);
    renderProgram(state);
    showToast('Gün silindi.');
    if (onUpdate) onUpdate();
  } catch (error) {
    showToast('Silme hatası: ' + error.message, true);
  }
}

// Render exercise list in modal
function renderDayExerciseList() {
  const container = document.getElementById('dayExerciseList');
  if (!container) return;

  container.innerHTML = tempDayExercises.map((ex, index) => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:4px;margin-bottom:6px">
      <div style="flex:1">
        <div style="font-weight:500;font-size:13px">${ex.name}</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--text3)">
          ${ex.sets} set × ${ex.reps}
        </div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="window.removeTempExercise(${index})">✕</button>
    </div>
  `).join('');
}

// Remove exercise from temp list
export function removeTempExercise(index) {
  tempDayExercises.splice(index, 1);
  renderDayExerciseList();
}

// Open add exercise to day modal
export function addExerciseToDay() {
  document.getElementById('exName').value = '';
  document.getElementById('exSets').value = '4';
  document.getElementById('exReps').value = '8-10';
  document.getElementById('exNote').value = '';
  openModal('modalAddExToDay');
}

// Confirm add exercise to day
export function confirmAddExToDay() {
  const name = document.getElementById('exName').value.trim();
  const sets = parseInt(document.getElementById('exSets').value) || 3;
  const reps = document.getElementById('exReps').value.trim() || '10';
  const note = document.getElementById('exNote').value.trim();

  if (!name) {
    showToast('Egzersiz adı gir!', true);
    return;
  }

  tempDayExercises.push({ name, sets, reps, note });
  renderDayExerciseList();
  closeModal('modalAddExToDay');
}

// Save day
export async function saveProgramDay(state, onUpdate) {
  const dayIndex = parseInt(document.getElementById('daySelect').value);
  const name = document.getElementById('dayProgramName').value.trim();
  const type = document.getElementById('dayType').value;

  if (!name) {
    showToast('Program adı gir!', true);
    return;
  }

  const btn = document.getElementById('saveDayBtn');
  btn.disabled = true;
  btn.textContent = '...';

  try {
    const dayObj = {
      day: dayIndex,
      name,
      type,
      exercises: tempDayExercises
    };

    const savedId = await saveDay(dayObj, editingDayId);

    if (savedId && onUpdate) {
      await onUpdate();
      closeModal('modalAddDay');
      showToast('Program kaydedildi!');
    }
  } catch (error) {
    showToast('Kayıt hatası: ' + error.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'KAYDET';
  }
}

// Export temp exercises for external use
export function getTempExercises() {
  return tempDayExercises;
}