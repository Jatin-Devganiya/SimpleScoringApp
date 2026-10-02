import React from 'react';
import { appConfig } from '../config/appConfig';
import { Database, HardDrive } from 'lucide-react';

export default function StorageStatus({ showDetails = false }) {
  const isLocalStorage = appConfig.USE_LOCAL_STORAGE;

  return (
    <div className={`storage-badge ${isLocalStorage ? 'local' : 'firebase'}`} title={isLocalStorage ? 'Running entirely on browser LocalStorage' : 'Connected to Cloud Firestore'}>
      <span className="badge-dot"></span>
      {isLocalStorage ? <HardDrive size={13} /> : <Database size={13} />}
      <span>Storage: {isLocalStorage ? 'LocalStorage' : 'Firebase'}</span>
      {showDetails && (
        <span style={{ opacity: 0.8, fontSize: '0.7rem' }}>
          {isLocalStorage ? '(Offline Ready)' : '(Cloud Sync)'}
        </span>
      )}
    </div>
  );
}
