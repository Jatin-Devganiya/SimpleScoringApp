/**
 * Centralized Application Configuration
 * 
 * Controls storage mode via the USE_LOCAL_STORAGE feature flag.
 * - true: Browser LocalStorage (zero Firebase calls)
 * - false: Firebase Cloud Firestore
 */

// Reads Vite environment variable: false enables Firebase mode, defaults to process.env if in Node
const envStorageFlag = (typeof import.meta !== 'undefined' && import.meta.env)
  ? import.meta.env.VITE_USE_LOCAL_STORAGE
  : (typeof process !== 'undefined' && process.env ? process.env.VITE_USE_LOCAL_STORAGE : 'true');

const isLocalStorage = envStorageFlag === 'true';


export const appConfig = {
  USE_LOCAL_STORAGE: isLocalStorage,
  APP_VERSION: 1,
  STORAGE_KEY: 'cricket_app_data'
};
