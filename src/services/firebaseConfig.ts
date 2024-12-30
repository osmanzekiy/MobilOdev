// src/services/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfisSumyAIuw0zjDrb2s9NAhYBrRWqUD8",
  authDomain: "mobilodev-fdcee.firebaseapp.com",
  projectId: "mobilodev-fdcee",
  storageBucket: "mobilodev-fdcee.firebasestorage.app",
  messagingSenderId: "998725064899",
  appId: "1:998725064899:web:3d91103427352d4afe2a76",
  measurementId: "G-Z1S8JKWQG6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistent storage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});


// Initialize Firestore with settings to prevent the warning
const firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true // This should fix the connectivity issues
});

export { app, auth, firestore };