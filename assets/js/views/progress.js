/* ============================================================
   PROGRESS VIEW
   ============================================================ */

import { formatDate, calc1RM, getVolume, getMaxKg } from '../utils/helpers.js';

let selectedExercise = null;
let chartWeight = null;
let chartVolume = null;

// Render progress view
export function renderProgress(state) {
  const exerciseNames = [
    ...new Set(state.logs.flatMap(log => log.exercises.map(ex => ex.name)))
  ];

  const chipsContainer = document.getElementById('exerciseChips');
  if (!chipsContainer) return;

  if (exerciseNames.length === 0) {
    chipsContainer.innerHTML = `
      <span style="color:var(--text3);font-family:'DM Mono',monospace;font-size:11px">
        Henüz kayıt yok.
      </span>
    `;
    return;
  }

  if (!selectedExercise || !exerciseNames.includes(selectedExercise)) {
    selectedExercise = exerciseNames[0];
  }

  chipsContainer.innerHTML = exerciseNames.map(name =>
    `<span class="chip ${name === selectedExercise ? 'selected' : ''}" 
      onclick="window.selectExercise('${name}')">
      ${name}
    </span>`
  ).join('');

  renderCharts(state, selectedExercise);
}

// Select exercise
export function selectExercise(state, name) {
  selectedExercise = name;
  renderProgress(state);
}

// Render charts for selected exercise
function renderCharts(state, exerciseName) {
  const points = [];
  
  state.logs.forEach(log => {
    const exercise = log.exercises.find(ex => 
      ex.name.toLowerCase() === exerciseName.toLowerCase()
    );
    
    if (exercise) {
      points.push({
        date: new Date(log.date),
        maxKg: getMaxKg(exercise.sets),
        volume: getVolume(exercise.sets),
        sets: exercise.sets
      });
    }
  });

  points.sort((a, b) => a.date - b.date);

  const labels = points.map(p => 
    p.date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
  );

  // PR Badge
  const prBadge = document.getElementById('prBadge');
  if (prBadge && points.length > 0) {
    const maxAllTime = Math.max(...points.map(p => p.maxKg));
    const lastMax = points[points.length - 1].maxKg;
    const isPR = points.length > 1 && lastMax === maxAllTime;
    prBadge.style.display = isPR ? 'inline-block' : 'none';
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { color: '#555', font: { family: 'DM Mono', size: 10 } },
        grid: { color: '#1a1a1a' },
        border: { color: '#2a2a2a' }
      },
      y: {
        ticks: { color: '#555', font: { family: 'DM Mono', size: 10 } },
        grid: { color: '#1a1a1a' },
        border: { color: '#2a2a2a' }
      }
    }
  };

  // Weight Chart
  if (chartWeight) chartWeight.destroy();
  
  const weightCanvas = document.getElementById('weightChart');
  if (weightCanvas) {
    chartWeight = new Chart(weightCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: points.map(p => p.maxKg),
          borderColor: '#e8ff47',
          backgroundColor: 'rgba(232, 255, 71, 0.08)',
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#e8ff47',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: chartOptions
    });
  }

  // Volume Chart
  if (chartVolume) chartVolume.destroy();
  
  const volumeCanvas = document.getElementById('volumeChart');
  if (volumeCanvas) {
    chartVolume = new Chart(volumeCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: points.map(p => p.volume),
          backgroundColor: 'rgba(79, 255, 176, 0.2)',
          borderColor: '#4fffb0',
          borderWidth: 1,
          borderRadius: 3
        }]
      },
      options: chartOptions
    });
  }

  // 1RM Info
  const oneRMContainer = document.getElementById('oneRMInfo');
  if (!oneRMContainer) return;

  if (points.length === 0) {
    oneRMContainer.innerHTML = `
      <div class="empty-state" style="padding:20px">
        <p>Bu egzersiz için kayıt yok</p>
      </div>
    `;
    return;
  }

  const lastPoint = points[points.length - 1];
  const bestSet = lastPoint.sets.reduce((best, set) => {
    const rm = calc1RM(parseFloat(set.kg) || 0, parseInt(set.reps) || 0);
    return rm > best.rm ? { rm, kg: set.kg, reps: set.reps } : best;
  }, { rm: 0, kg: 0, reps: 0 });

  oneRMContainer.innerHTML = `
    <div class="info-row">
      <div class="info-row-label">SON ANTRENMAN MAX KG</div>
      <div class="info-row-value" style="color:var(--accent)">${lastPoint.maxKg} kg</div>
    </div>
    <div class="info-row">
      <div class="info-row-label">TAHMİNİ 1RM (Epley)</div>
      <div class="info-row-value" style="color:var(--accent2)">${bestSet.rm} kg</div>
    </div>
    <div class="info-row">
      <div class="info-row-label">BAZ (${bestSet.kg}kg × ${bestSet.reps} tek)</div>
      <div class="info-row-value" style="color:var(--text2)">kg × (1 + tekrar/30)</div>
    </div>
    <div class="info-row">
      <div class="info-row-label">TOPLAM KAYIT</div>
      <div class="info-row-value">${points.length} kez</div>
    </div>
  `;
}

// Get selected exercise (for external use)
export function getSelectedExercise() {
  return selectedExercise;
}