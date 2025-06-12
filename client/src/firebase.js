import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAqPpszhjnqZbLXw3Jt-3dmXCHrDj_3mMk",
  authDomain: "cliniqless-ai.firebaseapp.com",
  projectId: "cliniqless-ai",
  storageBucket: "cliniqless-ai.firebasestorage.app", // Using original storage bucket from settings
  messagingSenderId: "969543919009",
  appId: "1:969543919009:web:49459603d6a95244b557e0",
  measurementId: "G-F3J4LHBZ9Q"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
