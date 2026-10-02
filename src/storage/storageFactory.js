import { appConfig } from '../config/appConfig.js';
import { LocalStorageProvider } from './LocalStorageProvider.js';
import { FirebaseStorageProvider } from './FirebaseStorageProvider.js';

let providerInstance = null;

/**
 * Creates and returns the configured StorageProvider instance based on the USE_LOCAL_STORAGE feature flag.
 * @returns {StorageProvider}
 */
export function createStorageProvider() {
  if (!providerInstance) {
    if (appConfig.USE_LOCAL_STORAGE) {
      providerInstance = new LocalStorageProvider();
    } else {
      providerInstance = new FirebaseStorageProvider();
    }
  }
  return providerInstance;
}

export const storageProvider = createStorageProvider();
