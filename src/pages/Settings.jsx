import React, { useState } from 'react';
import { appConfig } from '../config/appConfig';
import { backupService } from '../services/BackupService';
import { teamService } from '../services/TeamService';
import { playerService } from '../services/PlayerService';
import { authService } from '../services/AuthService';
import StorageStatus from '../components/StorageStatus';
import { Download, Upload, Trash2, Check, AlertTriangle, ShieldCheck, Database, Sparkles, ShieldAlert } from 'lucide-react';

export default function Settings() {
  const [feedback, setFeedback] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const isUmpire = authService.isUmpire();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setFeedback(null);
      const res = await backupService.exportBackup();
      setFeedback({ type: 'success', message: `Data exported successfully as ${res.fileName}` });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Export failed.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsImporting(true);
        setFeedback(null);
        const jsonContent = event.target?.result;
        const res = await backupService.importBackup(jsonContent);
        setFeedback({
          type: 'success',
          message: `Backup imported successfully! Restored ${res.count} match(es).`
        });
      } catch (err) {
        setFeedback({ type: 'error', message: err.message || 'Import failed.' });
      } finally {
        setIsImporting(false);
        e.target.value = ''; // Reset input
      }
    };
    reader.readAsText(file);
  };

  const handleSeedDemoData = async () => {
    try {
      setIsSeeding(true);
      setFeedback(null);
      const indNames = ['Rohit Sharma', 'Virat Kohli', 'Shubman Gill', 'Hardik Pandya', 'Jasprit Bumrah'];
      const ausNames = ['Travis Head', 'David Warner', 'Steve Smith', 'Glenn Maxwell', 'Pat Cummins'];

      const getOrCreatePlayerId = async (name) => {
        const existing = (await playerService.getPlayers()).find(
          p => p.name.trim().toLowerCase() === name.trim().toLowerCase()
        );
        if (existing) return existing.id;
        const created = await playerService.createPlayer(name);
        return created.id;
      };

      const indPlayerIds = [];
      for (const name of indNames) {
        indPlayerIds.push(await getOrCreatePlayerId(name));
      }

      const ausPlayerIds = [];
      for (const name of ausNames) {
        ausPlayerIds.push(await getOrCreatePlayerId(name));
      }

      await teamService.createTeam('India', indPlayerIds);
      await teamService.createTeam('Australia', ausPlayerIds);
      setFeedback({
        type: 'success',
        message: 'Sample teams (India vs Australia) and 10 players created successfully!'
      });
    } catch (err) {
      setFeedback({ type: 'error', message: `Could not seed sample data: ${err.message}` });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearData = async () => {
    try {
      setFeedback(null);
      await backupService.clearAllData();
      setShowClearModal(false);
      setFeedback({ type: 'success', message: 'All application data has been wiped successfully.' });
      // Reload page state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to clear data.' });
    }
  };

  if (!isUmpire) {
    return (
      <div className="alert-box alert-error" style={{ margin: '30px 0' }}>
        <ShieldAlert size={20} />
        <span>Settings and data management are restricted to Umpires only.</span>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings & Storage</h1>
      </div>

      {feedback && (
        <div className={`alert-box alert-${feedback.type}`}>
          {feedback.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Storage Mode Card */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={18} color="var(--accent-green)" /> Storage Mode
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
          The active persistence engine is controlled via the <code>USE_LOCAL_STORAGE</code> feature flag in your configuration or <code>.env</code> file.
        </p>

        <div style={{ marginBottom: '14px' }}>
          <StorageStatus showDetails={true} />
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
          <div style={{ marginBottom: '6px' }}>
            <strong>Current Flag:</strong> <code>VITE_USE_LOCAL_STORAGE={String(appConfig.USE_LOCAL_STORAGE)}</code>
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            To switch between LocalStorage and Firebase Cloud Firestore, modify <code>.env</code> or <code>src/config/appConfig.js</code>. The UI and scoring engine automatically adapt without requiring any code changes.
          </div>
        </div>
      </div>

      {/* Cross-Storage Backup & Restore */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="var(--accent-blue)" /> Backup & Cross-Storage Migration
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
          Backup files use a standardized JSON schema (Version 1). Backups exported from LocalStorage can be directly imported into Firebase, and vice-versa.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download size={16} /> {isExporting ? 'Exporting...' : 'Export Backup (JSON)'}
          </button>

          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            <Upload size={16} /> {isImporting ? 'Importing...' : 'Import Backup (JSON)'}
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={isImporting}
            />
          </label>
        </div>
      </div>

      {/* Quick Setup: Seed Sample Teams & Players */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--accent-gold)" /> Quick Match Setup
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
          Instantly generate sample teams (<strong>India</strong> and <strong>Australia</strong>) with 10 real players to quickly test scoring, overs, and match workflows.
        </p>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleSeedDemoData}
          disabled={isSeeding}
        >
          <Sparkles size={16} /> {isSeeding ? 'Generating Sample Squads...' : 'Seed Sample Teams & Players (India vs Australia)'}
        </button>
      </div>

      {/* Clear Application Data */}
      <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.25)' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f87171', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trash2 size={18} /> Danger Zone
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
          Clear all application data from the current storage provider (
          {appConfig.USE_LOCAL_STORAGE ? 'browser LocalStorage' : 'Firebase Firestore'}).
        </p>

        <button
          type="button"
          className="btn btn-danger"
          onClick={() => setShowClearModal(true)}
        >
          Clear All Application Data
        </button>
      </div>

      {/* Confirmation Modal */}
      {showClearModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title" style={{ color: 'var(--accent-red)' }}>
              Confirm Data Wipe
            </h3>
            <p className="modal-desc">
              Are you sure you want to permanently clear all teams, matches, and scoring history from{' '}
              <strong>{appConfig.USE_LOCAL_STORAGE ? 'LocalStorage' : 'Firebase'}</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={handleClearData}
              >
                Yes, Clear All Data
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowClearModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
