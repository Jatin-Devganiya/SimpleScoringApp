import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Matches from './pages/Matches';
import Teams from './pages/Teams';
import Players from './pages/Players';
import LiveMatch from './pages/LiveMatch';
import ScorecardPage from './pages/ScorecardPage';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { appConfig } from './config/appConfig';
import { validateFirebaseConfig } from './config/firebaseConfig';
import { teamService } from './services/TeamService';
import { playerService } from './services/PlayerService';
import { authService } from './services/AuthService';
import { AlertCircle, Sparkles } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentSession());
  const [activeTab, setActiveTab] = useState('matches');
  const [activeMatchId, setActiveMatchId] = useState(() => {
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

  const isUmpire = currentUser?.role === 'UMPIRE';

  // Automatically redirect regular users away from settings tab
  useEffect(() => {
    if (activeTab === 'settings' && !isUmpire) {
      setActiveTab('matches');
    }
  }, [activeTab, isUmpire]);

  const handleLoginSuccess = (session) => {
    setCurrentUser(session);
    setActiveTab('matches');
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setActiveTab('matches');
  };

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

  // Seed sample teams and players helper for quick testing (Umpire only)
  const handleSeedDemoData = async () => {
    try {
      if (!authService.isUmpire()) {
        alert('Please login as UMPIRE to seed demo teams and players.');
        return;
      }

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
      alert('Sample players & teams (India vs Australia) created successfully!');
      window.location.reload();
    } catch (err) {
      alert(`Could not load demo teams: ${err.message}`);
    }
  };

  // If user is not authenticated, show Login page
  if (!currentUser) {
    return (
      <main className="app-container">
        {firebaseError && (
          <div className="alert-box alert-error" style={{ marginTop: '20px' }}>
            <AlertCircle size={22} style={{ flexShrink: 0 }} />
            <div>
              <strong>Configuration Warning:</strong> {firebaseError}
            </div>
          </div>
        )}
        <Login onLoginSuccess={handleLoginSuccess} />
      </main>
    );
  }

  return (
    <>
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

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

        {activeTab === 'teams' && (
          <Teams onNavigateToPlayers={() => setActiveTab('players')} />
        )}

        {activeTab === 'players' && <Players />}

        {activeTab === 'settings' && isUmpire && <Settings />}

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
        {authService.isUmpire() && (
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
            <Sparkles size={12} /> Seed Sample Players & Teams (India vs Australia)
          </button>
        )}
      </footer>
    </>
  );
}

