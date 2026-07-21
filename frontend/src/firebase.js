import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';

// Firebase configuration (replace with your own if needed)
const firebaseConfig = {
  apiKey: "AIzaSyAlGCZM8E_h-IxRfDvGuDb2h0em6aKafmc",
  authDomain: "meetsphere-7817d.firebaseapp.com",
  projectId: "meetsphere-7817d",
  storageBucket: "meetsphere-7817d.firebasestorage.app",
  messagingSenderId: "502368064362",
  appId: "1:502368064362:web:2a0771d32deb254ed64b13",
  measurementId: "G-WDJH3NNYBK"
};

// Initialize Firebase app and services
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
