import React, { useState, useEffect } from 'react';
import { matchService } from '../services/MatchService';
import { teamService } from '../services/TeamService';
import MatchList from '../components/MatchList';
import MatchForm from '../components/MatchForm';
import { Plus } from 'lucide-react';

export default function Matches({ onSelectMatch, onViewScorecard }) {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamsMap, setTeamsMap] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [matchesData, teamsData] = await Promise.all([
        matchService.getMatches(),
        teamService.getTeams()
      ]);
      setMatches(matchesData);
      setTeams(teamsData);

      const map = {};
      teamsData.forEach(t => { map[t.id] = t; });
      setTeamsMap(map);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load matches.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartMatch = async (config) => {
    try {
      const newMatch = await matchService.createMatch(config);
      onSelectMatch(newMatch.id);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create match.' });
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (window.confirm('Are you sure you want to delete this match and all its scoring events?')) {
      try {
        await matchService.deleteMatch(matchId);
        setFeedback({ type: 'success', message: 'Match deleted.' });
        await loadData();
      } catch (err) {
        setFeedback({ type: 'error', message: err.message || 'Error deleting match.' });
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Matches</h1>
        {!showCreateForm && (
          <button
            className="btn btn-primary"
            onClick={() => {
              if (teams.length < 2) {
                alert('Please create at least 2 teams before starting a match.');
                return;
              }
              setShowCreateForm(true);
            }}
          >
            <Plus size={16} /> New Match
          </button>
        )}
      </div>

      {feedback && (
        <div className={`alert-box alert-${feedback.type}`}>
          <span>{feedback.message}</span>
        </div>
      )}

      {showCreateForm ? (
        <MatchForm
          teams={teams}
          onStartMatch={handleStartMatch}
          onCancel={() => setShowCreateForm(false)}
        />
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading matches...
        </div>
      ) : (
        <MatchList
          matches={matches}
          teamsMap={teamsMap}
          onSelectMatch={onSelectMatch}
          onViewScorecard={onViewScorecard}
          onDeleteMatch={handleDeleteMatch}
        />
      )}
    </div>
  );
}
