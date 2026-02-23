/* ============================================================
   FIRESTORE OPERATIONS
   ============================================================ */

import { db } from './config.js';
import { getCurrentUser } from './auth.js';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Helper to get user ID
function uid() {
  const user = getCurrentUser();
  return user ? user.uid : null;
}

// Helper to get user document reference
function userRef(...pathSegments) {
  return doc(db, 'users', uid(), ...pathSegments);
}

// Helper to get user collection reference
function userCol(...pathSegments) {
  return collection(db, 'users', uid(), ...pathSegments);
}

/* ============================================================
   PROGRAM OPERATIONS
   ============================================================ */

// Load all program days with exercises
export async function loadProgram() {
  const programDays = [];
  const daysSnap = await getDocs(query(userCol('program'), orderBy('day')));
  
  for (const dayDoc of daysSnap.docs) {
    const dayData = dayDoc.data();
    
    // Load exercises for this day
    const exercisesSnap = await getDocs(
      query(collection(db, 'users', uid(), 'program', dayDoc.id, 'exercises'), orderBy('order'))
    );
    
    dayData.exercises = exercisesSnap.docs.map(exDoc => ({
      id: exDoc.id,
      ...exDoc.data()
    }));
    
    programDays.push({
      id: dayDoc.id,
      ...dayData
    });
  }
  
  return programDays;
}

// Save or update a program day
export async function saveDay(dayObj, editingDayId = null) {
  const batch = writeBatch(db);
  let dayRef;
  
  if (editingDayId) {
    dayRef = userRef('program', editingDayId);
  } else {
    dayRef = doc(userCol('program'));
  }
  
  // Set day data
  batch.set(dayRef, {
    day: dayObj.day,
    name: dayObj.name,
    type: dayObj.type
  });
  
  // Delete old exercises if editing
  if (editingDayId) {
    const oldExercises = await getDocs(
      collection(db, 'users', uid(), 'program', dayRef.id, 'exercises')
    );
    oldExercises.forEach(exDoc => batch.delete(exDoc.ref));
  }
  
  // Add new exercises
  dayObj.exercises.forEach((exercise, index) => {
    const exRef = doc(collection(db, 'users', uid(), 'program', dayRef.id, 'exercises'));
    batch.set(exRef, {
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      note: exercise.note || '',
      order: index
    });
  });
  
  await batch.commit();
  return dayRef.id;
}

// Delete a program day
export async function deleteDay(dayId) {
  const batch = writeBatch(db);
  
  // Delete all exercises first
  const exercisesSnap = await getDocs(
    collection(db, 'users', uid(), 'program', dayId, 'exercises')
  );
  exercisesSnap.forEach(exDoc => batch.delete(exDoc.ref));
  
  // Delete the day
  batch.delete(userRef('program', dayId));
  
  await batch.commit();
}

/* ============================================================
   WORKOUT LOG OPERATIONS
   ============================================================ */

// Load workout logs
export async function loadLogs() {
  const logs = [];
  const logsSnap = await getDocs(
    query(userCol('logs'), orderBy('date', 'desc'), limit(100))
  );
  
  for (const logDoc of logsSnap.docs) {
    const logData = logDoc.data();
    
    // Load exercises for this log
    const exercisesSnap = await getDocs(
      query(collection(db, 'users', uid(), 'logs', logDoc.id, 'exercises'), orderBy('order'))
    );
    
    const exercises = [];
    for (const exDoc of exercisesSnap.docs) {
      const exData = exDoc.data();
      
      // Load sets for this exercise
      const setsSnap = await getDocs(
        query(collection(db, 'users', uid(), 'logs', logDoc.id, 'exercises', exDoc.id, 'sets'), orderBy('index'))
      );
      
      exData.sets = setsSnap.docs.map(setDoc => setDoc.data());
      
      exercises.push({
        id: exDoc.id,
        ...exData
      });
    }
    
    logs.push({
      id: logDoc.id,
      ...logData,
      date: logData.date?.toDate?.() || new Date(logData.date),
      exercises
    });
  }
  
  return logs;
}

// Save workout log
export async function saveWorkoutLog(workout) {
  const batch = writeBatch(db);
  const logRef = doc(userCol('logs'));
  
  // Set log data
  batch.set(logRef, {
    dayIndex: workout.dayIndex,
    name: workout.name,
    date: serverTimestamp(),
    exerciseCount: workout.exercises.length
  });
  
  // Add exercises and sets
  for (let i = 0; i < workout.exercises.length; i++) {
    const exercise = workout.exercises[i];
    const exRef = doc(collection(db, 'users', uid(), 'logs', logRef.id, 'exercises'));
    
    batch.set(exRef, {
      name: exercise.name,
      note: exercise.note || '',
      order: i
    });
    
    // Add sets
    for (let j = 0; j < exercise.sets.length; j++) {
      const setData = exercise.sets[j];
      const setRef = doc(collection(db, 'users', uid(), 'logs', logRef.id, 'exercises', exRef.id, 'sets'));
      
      batch.set(setRef, {
        index: j,
        kg: parseFloat(setData.kg) || 0,
        reps: parseInt(setData.reps) || 0,
        done: setData.done || false
      });
    }
  }
  
  await batch.commit();
  return logRef.id;
}

/* ============================================================
   LOAD ALL DATA
   ============================================================ */

export async function loadAllData() {
  const [program, logs] = await Promise.all([
    loadProgram(),
    loadLogs()
  ]);
  
  return { program, logs };
}
/* ============================================================
   BODY WEIGHT LOG OPERATIONS
   ============================================================ */

// Load body weight logs
export async function loadBodyWeightLogs() {
  const logs = [];
  const snap = await getDocs(
    query(userCol('bodyWeightLogs'), orderBy('date', 'desc'), limit(365))
  );
  snap.forEach(d => {
    const data = d.data();
    logs.push({
      id: d.id,
      weight: data.weight,
      date: data.date?.toDate?.() || new Date(data.date),
      note: data.note || ''
    });
  });
  return logs;
}

// Save body weight log
export async function saveBodyWeightLog(weight, note = '') {
  const ref = doc(userCol('bodyWeightLogs'));
  await setDoc(ref, {
    weight: parseFloat(weight),
    note,
    date: serverTimestamp()
  });
  return ref.id;
}

// Delete body weight log
export async function deleteBodyWeightLog(id) {
  await deleteDoc(userRef('bodyWeightLogs', id));
}
