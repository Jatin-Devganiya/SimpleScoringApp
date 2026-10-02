import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Matches from './pages/Matches';
import Teams from './pages/Teams';
import LiveMatch from './pages/LiveMatch';
import ScorecardPage from './pages/ScorecardPage';
import Settings from './pages/Settings';
import { appConfig } from './config/appConfig';
import { validateFirebaseConfig } from './config/firebaseConfig';
import { teamService } from './services/TeamService';
import { AlertCircle, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('matches');
  const [activeMatchId, setActiveMatchId] = useState(() => {
    // Restore active match id from session if available
    return sessionStorage.getItem('active_live_match_id') || null;
  });
  const [firebaseError, setFirebaseError] = useState(null);

  // Check Firebase configuration on startup if Firebase mode is active
  useEffect(() => {
    if (!appConfig.USE_LOCAL_STORAGE) {
      const { isValid, missing } = validateFirebaseConfig();
      if (!isValid) {
        setFirebaseError(
          `Firebase mode is active (USE_LOCAL_STORAGE=false), but required configuration is missing: ${missing.join(', ')}. Please update your .env file or switch back to LocalStorage.`
        );
      }
    }
  }, []);

  // Save active live match to session storage to persist across refreshes
  const handleSelectMatch = (matchId) => {
    setActiveMatchId(matchId);
    sessionStorage.setItem('active_live_match_id', matchId);
    setActiveTab('live');
  };

  const handleViewScorecard = (matchId) => {
    setActiveMatchId(matchId);
    setActiveTab('scorecard');
  };

  const handleResumeLive = (matchId) => {
    setActiveMatchId(matchId);
    sessionStorage.setItem('active_live_match_id', matchId);
    setActiveTab('live');
  };

  const handleBackToMatches = () => {
    setActiveTab('matches');
  };

  // Seed sample teams helper for quick testing
  const handleSeedDemoData = async () => {
    try {
      await teamService.createTeam('India', [
        'Rohit Sharma',
        'Virat Kohli',
        'Shubman Gill',
        'Hardik Pandya',
        'Jasprit Bumrah'
      ]);
      await teamService.createTeam('Australia', [
        'Travis Head',
        'David Warner',
        'Steve Smith',
        'Glenn Maxwell',
        'Pat Cummins'
      ]);
      window.location.reload();
    } catch (err) {
      alert(`Could not load demo teams: ${err.message}`);
    }
  };

  return (
    <>
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="app-container">
        {/* Startup Firebase Warning if unconfigured */}
        {firebaseError && (
          <div className="alert-box alert-error" style={{ marginTop: '20px' }}>
            <AlertCircle size={22} style={{ flexShrink: 0 }} />
            <div>
              <strong>Configuration Warning:</strong> {firebaseError}
            </div>
          </div>
        )}

        {/* Tab content rendering */}
        {activeTab === 'matches' && (
          <Matches
            onSelectMatch={handleSelectMatch}
            onViewScorecard={handleViewScorecard}
          />
        )}

        {activeTab === 'teams' && <Teams />}

        {activeTab === 'settings' && <Settings />}

        {activeTab === 'live' && activeMatchId && (
          <LiveMatch
            matchId={activeMatchId}
            onBack={handleBackToMatches}
            onViewScorecard={handleViewScorecard}
          />
        )}

        {activeTab === 'scorecard' && activeMatchId && (
          <ScorecardPage
            matchId={activeMatchId}
            onBack={handleBackToMatches}
            onResumeLive={handleResumeLive}
          />
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '24px 16px', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        <p>Simple Live Cricket Scoring Web App • LocalStorage & Firebase Interchangeable Providers</p>
        <button
          onClick={handleSeedDemoData}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent-green)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            marginTop: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Sparkles size={12} /> Seed Sample Teams (India vs Australia)
        </button>
      </footer>
    </>
  );
}
