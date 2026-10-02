import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { appConfig } from './appConfig';

const firebaseEnvVars = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export function validateFirebaseConfig() {
  const missing = [];
  if (!firebaseEnvVars.apiKey) missing.push('VITE_FIREBASE_API_KEY');
  if (!firebaseEnvVars.projectId) missing.push('VITE_FIREBASE_PROJECT_ID');
  if (!firebaseEnvVars.appId) missing.push('VITE_FIREBASE_APP_ID');
  return {
    isValid: missing.length === 0,
    missing
  };
}

let dbInstance = null;
let appInstance = null;

export function getFirebaseDb() {
  if (appConfig.USE_LOCAL_STORAGE) {
    return null;
  }

  const { isValid, missing } = validateFirebaseConfig();
  if (!isValid) {
    const errorMsg = `Firebase mode is active (USE_LOCAL_STORAGE=false), but required environment variables are missing: ${missing.join(', ')}. Please check your .env file or switch back to LocalStorage.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (!dbInstance) {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseEnvVars);
    dbInstance = getFirestore(appInstance);
  }

  return dbInstance;
}

export { firebaseEnvVars };
