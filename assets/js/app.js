/* ============================================================
   MAIN APP — v2
   ============================================================ */

import { auth } from './firebase/config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { signIn, signUp, logOut, resetPassword } from './firebase/auth.js';
import { loadAllData, saveDay, loadBodyWeightLogs } from './firebase/firestore.js';
import { showToast, setSyncing, initModals, openModal as _openModal, closeModal as _closeModal } from './utils/ui.js';
import { BUILT_IN_TEMPLATES, WEEKLY_TEMPLATE, DAYS } from './utils/constants.js';

import { renderHome } from './views/home.js';
import * as ProgramView from './views/program.js';
import * as WorkoutView from './views/workout.js';
import * as ProgressView from './views/progress.js';
import * as CompareView from './views/compare.js';
import * as BodyWeightView from './views/bodyweight.js';

let appState = { program: [], logs: [], bodyWeightLogs: [] };
let authMode = 'login';

/* ============================================================
   INITIALIZATION
   ============================================================ */

async function initApp(user) {
  const loadingEl = document.getElementById('loadingOverlay');
  const authScreen = document.getElementById('authScreen');
  const appShell = document.getElementById('appShell');
  if (!user) return;

  loadingEl.style.display = 'flex';
  authScreen.style.display = 'none';
  appShell.style.display = 'none';

  const userBadge = document.getElementById('userBadge');
  if (userBadge) userBadge.textContent = user.email.split('@')[0].toUpperCase();

  const todayBadge = document.getElementById('todayBadge');
  if (todayBadge) {
    todayBadge.textContent = new Date().toLocaleDateString('tr-TR', {
      weekday: 'long', day: '2-digit', month: 'long'
    });
  }

  setSyncing(true);
  try {
    const [data, bwLogs] = await Promise.all([
      loadAllData(),
      loadBodyWeightLogs()
    ]);
    appState.program = data.program;
    appState.logs = data.logs;
    appState.bodyWeightLogs = bwLogs;
  } catch (error) {
    showToast('Veri yüklenemedi: ' + error.message, true);
  }
  setSyncing(false);

  loadingEl.style.display = 'none';
  appShell.style.display = 'block';

  renderHome(appState);
  initModals();
}

/* ============================================================
   AUTH STATE OBSERVER
   ============================================================ */

onAuthStateChanged(auth, async (user) => {
  const loadingEl = document.getElementById('loadingOverlay');
  const authScreen = document.getElementById('authScreen');
  const appShell = document.getElementById('appShell');

  if (user) {
    await initApp(user);
  } else {
    loadingEl.style.display = 'none';
    appShell.style.display = 'none';
    authScreen.style.display = 'flex';
  }
});

/* ============================================================
   AUTH FUNCTIONS
   ============================================================ */

window.switchAuthTab = function(mode) {
  authMode = mode;
  document.querySelectorAll('.auth-tab').forEach((tab, index) => {
    const isActive = (index === 0 && mode === 'login') || (index === 1 && mode === 'register');
    tab.classList.toggle('active', isActive);
  });
  const btn = document.getElementById('authBtn');
  if (btn) btn.textContent = mode === 'login' ? 'GİRİŞ YAP' : 'KAYIT OL';
  document.getElementById('authError').style.display = 'none';
  document.getElementById('authSuccess').style.display = 'none';
};

window.authSubmit = async function() {
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const btn = document.getElementById('authBtn');
  const errorEl = document.getElementById('authError');
  const successEl = document.getElementById('authSuccess');

  errorEl.style.display = 'none';
  successEl.style.display = 'none';
  if (!email || !password) { errorEl.textContent = 'Email ve şifre gerekli.'; errorEl.style.display = 'block'; return; }

  btn.disabled = true; btn.textContent = '...';

  try {
    if (authMode === 'login') {
      await signIn(email, password);
    } else {
      await signUp(email, password);
      successEl.textContent = 'Kayıt başarılı! Giriş yapılıyor...';
      successEl.style.display = 'block';
    }
  } catch (error) {
    const msgs = {
      'auth/user-not-found': 'Kullanıcı bulunamadı.',
      'auth/wrong-password': 'Şifre yanlış.',
      'auth/email-already-in-use': 'Bu email zaten kayıtlı.',
      'auth/weak-password': 'Şifre en az 6 karakter olmalı.',
      'auth/invalid-email': 'Geçersiz email adresi.',
      'auth/invalid-credential': 'Email veya şifre hatalı.'
    };
    errorEl.textContent = msgs[error.code] || error.message;
    errorEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = authMode === 'login' ? 'GİRİŞ YAP' : 'KAYIT OL';
  }
};

window.forgotPassword = async function() {
  const email = document.getElementById('authEmail').value.trim();
  const errorEl = document.getElementById('authError');
  const successEl = document.getElementById('authSuccess');
  if (!email) { errorEl.textContent = 'Email adresini gir.'; errorEl.style.display = 'block'; return; }
  try {
    await resetPassword(email);
    successEl.textContent = 'Şifre sıfırlama emaili gönderildi.';
    successEl.style.display = 'block';
  } catch (error) {
    errorEl.textContent = error.message;
    errorEl.style.display = 'block';
  }
};

window.doSignOut = async function() {
  await logOut();
  appState = { program: [], logs: [], bodyWeightLogs: [] };
};

/* ============================================================
   NAVIGATION
   ============================================================ */

window.showView = function(viewName, btnElement) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const viewEl = document.getElementById('view-' + viewName);
  if (viewEl) viewEl.classList.add('active');

  const targetBtn = btnElement || document.querySelector(`.nav-btn[onclick*="'${viewName}'"]`);
  if (targetBtn) targetBtn.classList.add('active');

  if (viewName === 'home') renderHome(appState);
  if (viewName === 'program') ProgramView.renderProgram(appState);
  if (viewName === 'progress') ProgressView.renderProgress(appState);
  if (viewName === 'compare') CompareView.renderCompare(appState);
  if (viewName === 'bodyweight') BodyWeightView.renderBodyWeight(appState);
};

/* ============================================================
   PROGRAM VIEW EXPORTS
   ============================================================ */

window.openAddDay = () => ProgramView.openAddDay();
window.editDayModal = (id) => ProgramView.editDay(appState, id);
window.deleteDayModal = (id) => ProgramView.deleteProgram(appState, id, reloadData);
window.removeTempExercise = (idx) => ProgramView.removeTempExercise(idx);
window.addExerciseToDay = () => ProgramView.addExerciseToDay();
window.confirmAddExToDay = () => ProgramView.confirmAddExToDay();
window.saveDayModal = () => ProgramView.saveProgramDay(appState, reloadData);

// Template loading
window.loadTemplate = function(templateId, dayIndex) {
  const tpl = BUILT_IN_TEMPLATES.find(t => t.id === templateId);
  if (!tpl) return;
  ProgramView.openAddDay();
  ProgramView.loadTemplate(templateId, dayIndex);
};

window.loadFullWeekTemplate = async function() {
  if (!confirm('Tüm haftalık PPL programını yüklemek istiyor musun? Mevcut program korunur, sadece yeni günler eklenir.')) return;
  setSyncing(true);
  try {
    for (const entry of WEEKLY_TEMPLATE) {
      const existingDay = appState.program.find(d => d.day === entry.day);
      if (existingDay) continue; // skip existing

      let dayObj;
      if (entry.type === 'rest') {
        dayObj = { day: entry.day, name: 'OFF', type: 'rest', exercises: [] };
      } else {
        const tpl = BUILT_IN_TEMPLATES.find(t => t.id === entry.templateId);
        dayObj = {
          day: entry.day,
          name: tpl.name.split('—')[1]?.trim() || tpl.name,
          type: tpl.type,
          exercises: JSON.parse(JSON.stringify(tpl.exercises))
        };
      }
      await saveDay(dayObj, null);
    }
    await reloadData();
    showToast('Haftalık PPL programı yüklendi! 💪');
  } catch (err) {
    showToast('Hata: ' + err.message, true);
  }
  setSyncing(false);
};

/* ============================================================
   WORKOUT VIEW EXPORTS
   ============================================================ */

window.openNewWorkout = () => WorkoutView.openNewWorkout(appState);
window.openDayWorkout = (idx) => WorkoutView.openDayWorkout(appState, idx);
window.startWorkout = () => WorkoutView.startWorkout(appState, showView);
window.toggleExercise = (idx) => WorkoutView.toggleExercise(idx);
window.updateWorkoutSet = (ei, si, f, v) => WorkoutView.updateSet(appState, ei, si, f, v);
window.toggleWorkoutSetDone = (ei, si, c) => WorkoutView.toggleSetDone(appState, ei, si, c);
window.addSetToWorkout = (idx) => WorkoutView.addSet(appState, idx);
window.removeSetFromWorkout = (idx) => WorkoutView.removeSet(appState, idx);
window.openAddExercise = () => WorkoutView.openAddExercise();
window.confirmAddExWorkout = () => WorkoutView.confirmAddExercise(appState);
window.finishWorkout = () => WorkoutView.finishWorkout(appState, reloadData, showView);
window.showExerciseHistory = (name) => WorkoutView.showExerciseHistory(appState, name);
window.applySuggestedWeight = (ei, kg) => WorkoutView.applySuggestedWeight(appState, ei, kg);

/* ============================================================
   PROGRESS VIEW EXPORTS
   ============================================================ */

window.selectExercise = (name) => ProgressView.selectExercise(appState, name);

/* ============================================================
   COMPARE VIEW EXPORTS
   ============================================================ */

window.renderComparison = () => CompareView.renderComparison(appState);

/* ============================================================
   BODY WEIGHT VIEW EXPORTS
   ============================================================ */

window.openAddBWLog = () => BodyWeightView.openAddBWLog();
window.confirmAddBWLog = () => BodyWeightView.confirmAddBWLog(appState, reloadData);
window.deleteBWLog = (id) => BodyWeightView.deleteBWLog(appState, id, reloadData);

/* ============================================================
   DATA RELOAD
   ============================================================ */

async function reloadData() {
  setSyncing(true);
  try {
    const [data, bwLogs] = await Promise.all([
      loadAllData(),
      loadBodyWeightLogs()
    ]);
    appState.program = data.program;
    appState.logs = data.logs;
    appState.bodyWeightLogs = bwLogs;

    const activeView = document.querySelector('.view.active');
    if (activeView) {
      const viewId = activeView.id.replace('view-', '');
      if (viewId === 'home') renderHome(appState);
      if (viewId === 'program') ProgramView.renderProgram(appState);
      if (viewId === 'progress') ProgressView.renderProgress(appState);
      if (viewId === 'compare') CompareView.renderCompare(appState);
      if (viewId === 'bodyweight') BodyWeightView.renderBodyWeight(appState);
    }
  } catch (error) {
    showToast('Veri yüklenemedi: ' + error.message, true);
  }
  setSyncing(false);
}

// Make modal helpers globally accessible (called from HTML)
window.closeModal = _closeModal;
window.openModal = _openModal;
