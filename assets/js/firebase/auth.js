/* ============================================================
   FIREBASE AUTH
   ============================================================ */

import { auth } from './config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// Sign up new user
export async function signUp(email, password) {
  return await createUserWithEmailAndPassword(auth, email, password);
}

// Sign in existing user
export async function signIn(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

// Sign out current user
export async function logOut() {
  return await signOut(auth);
}

// Send password reset email
export async function resetPassword(email) {
  return await sendPasswordResetEmail(auth, email);
}

// Get current user
export function getCurrentUser() {
  return auth.currentUser;
}