'use client';

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCyhXfIHDClrc66cCWYCI8To6ukWdPQl5Tm4',
  authDomain: 'german-preparacion.firebaseapp.com',
  projectId: 'german-preparacion',
  storageBucket: 'german-preparacion.firebasestorage.app',
  messagingSenderId: '749087138125',
  appId: '1:749087138125:web:0be4b2ba0c67b5b07f9704',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const authPersistence = setPersistence(auth, browserLocalPersistence);
