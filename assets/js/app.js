/* ============================================================
   MAIN APP
   ============================================================ */

import { auth } from './firebase/config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { signIn, signUp, logOut, resetPassword } from './firebase/auth.js';
import { loadAllData } from './firebase/firestore.js';
import { showToast, setSyncing, initModals } from './utils/ui.js';

// Import views
import { renderHome } from './views/home.js';
import * as ProgramView from './views/program.js';
import * as WorkoutView from './views/workout.js';
import * as ProgressView from './views/progress.js';
import * as CompareView from './views/compare.js';

// Global state
let appState = {
  program: [],
  logs: []
};

let authMode = 'login';

/* ============================================================
   INITIALIZATION
   ============================================================ */

// Initialize app
async function initApp(user) {
  const loadingEl = document.getElementById('loadingOverlay');
  const authScreen = document.getElementById('authScreen');
  const appShell = document.getElementById('appShell');
  
  if (!user) return;

  // Show loading
  loadingEl.style.display = 'flex';
  authScreen.style.display = 'none';
  appShell.style.display = 'none';

  // Set user info
  const userBadge = document.getElementById('userBadge');
  if (userBadge) {
    userBadge.textContent = user.email.split('@')[0].toUpperCase();
  }

  // Set today's date
  const todayBadge = document.getElementById('todayBadge');
  if (todayBadge) {
    todayBadge.textContent = new Date().toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });
  }

  // Load data
  setSyncing(true);
  try {
    const data = await loadAllData();
    appState.program = data.program;
    appState.logs = data.logs;
  } catch (error) {
    showToast('Veri yüklenemedi: ' + error.message, true);
  }
  setSyncing(false);

  // Hide loading, show app
  loadingEl.style.display = 'none';
  appShell.style.display = 'block';

  // Render home view
  renderHome(appState);

  // Initialize modals
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

  if (!email || !password) {
    errorEl.textContent = 'Email ve şifre gerekli.';
    errorEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = '...';

  try {
    if (authMode === 'login') {
      await signIn(email, password);
    } else {
      await signUp(email, password);
      successEl.textContent = 'Kayıt başarılı! Giriş yapılıyor...';
      successEl.style.display = 'block';
    }
  } catch (error) {
    const errorMessages = {
      'auth/user-not-found': 'Kullanıcı bulunamadı.',
      'auth/wrong-password': 'Şifre yanlış.',
      'auth/email-already-in-use': 'Bu email zaten kayıtlı.',
      'auth/weak-password': 'Şifre en az 6 karakter olmalı.',
      'auth/invalid-email': 'Geçersiz email adresi.',
      'auth/invalid-credential': 'Email veya şifre hatalı.'
    };
    
    errorEl.textContent = errorMessages[error.code] || error.message;
    errorEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = authMode === 'login' ? 'GİRİŞ YAP' : 'KAYIT OL';
  }
};

window.forgotPassword = async function() {
  const email = document.getElementById('authEmail').value.trim();
  const errorEl = document.getElementById('authError');
  const successEl = document.getElementById('authSuccess');

  if (!email) {
    errorEl.textContent = 'Email adresini gir.';
    errorEl.style.display = 'block';
    return;
  }

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
  appState = { program: [], logs: [] };
};

/* ============================================================
   NAVIGATION
   ============================================================ */

window.showView = function(viewName, btnElement) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  
  document.getElementById('view-' + viewName).classList.add('active');
  
  const targetBtn = btnElement || document.querySelector(`.nav-btn[onclick*="'${viewName}'"]`);
  if (targetBtn) targetBtn.classList.add('active');

  // Render view
  if (viewName === 'home') renderHome(appState);
  if (viewName === 'program') ProgramView.renderProgram(appState);
  if (viewName === 'progress') ProgressView.renderProgress(appState);
  if (viewName === 'compare') CompareView.renderCompare(appState);
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

/* ============================================================
   PROGRESS VIEW EXPORTS
   ============================================================ */

window.selectExercise = (name) => ProgressView.selectExercise(appState, name);

/* ============================================================
   COMPARE VIEW EXPORTS
   ============================================================ */

window.renderComparison = () => CompareView.renderComparison(appState);

/* ============================================================
   DATA RELOAD
   ============================================================ */

async function reloadData() {
  setSyncing(true);
  try {
    const data = await loadAllData();
    appState.program = data.program;
    appState.logs = data.logs;
    
    // Re-render current view
    const activeView = document.querySelector('.view.active');
    if (activeView) {
      const viewId = activeView.id.replace('view-', '');
      if (viewId === 'home') renderHome(appState);
      if (viewId === 'program') ProgramView.renderProgram(appState);
      if (viewId === 'progress') ProgressView.renderProgress(appState);
      if (viewId === 'compare') CompareView.renderCompare(appState);
    }
  } catch (error) {
    showToast('Veri yüklenemedi: ' + error.message, true);
  }
  setSyncing(false);
}