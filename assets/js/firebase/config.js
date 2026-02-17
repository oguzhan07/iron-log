/* ============================================================
   FIREBASE CONFIG
   ============================================================ */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ⚠️ Firebase yapılandırması - kendi bilgilerinle değiştir
const firebaseConfig = {
  apiKey: "AIzaSyA_UX_d9FV5ix5VwBEl974jmKRvOHMLqFg",
  authDomain: "iron-log-7559b.firebaseapp.com",
  projectId: "iron-log-7559b",
  storageBucket: "iron-log-7559b.firebasestorage.app",
  messagingSenderId: "241755853492",
  appId: "1:241755853492:web:8ce8e64a3889e5a65d3de1",
  measurementId: "G-68ZYQ8BGRN"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);