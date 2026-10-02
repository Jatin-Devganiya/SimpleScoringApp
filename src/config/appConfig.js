/**
 * Centralized Application Configuration
 * 
 * Controls storage mode via the USE_LOCAL_STORAGE feature flag.
 * - true: Browser LocalStorage (zero Firebase calls)
 * - false: Firebase Cloud Firestore
 */

// Reads Vite environment variable, defaults to true if unset or not strictly 'false'
const envStorageFlag = import.meta.env.VITE_USE_LOCAL_STORAGE;
const isLocalStorage = envStorageFlag === undefined ? true : envStorageFlag !== 'false';

export const appConfig = {
  USE_LOCAL_STORAGE: isLocalStorage,
  APP_VERSION: 1,
  STORAGE_KEY: 'cricket_app_data'
};
