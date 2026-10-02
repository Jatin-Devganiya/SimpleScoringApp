import React, { useState } from 'react';
import PlayerList from './PlayerList';
import { generateId } from '../utils/ids';

export default function TeamForm({ initialTeam = null, onSave, onCancel }) {
  const [name, setName] = useState(initialTeam?.name || '');
  const [players, setPlayers] = useState(initialTeam?.players || []);
  const [error, setError] = useState('');

  const handleAddPlayer = (pName) => {
    setPlayers([...players, { id: generateId('player'), name: pName }]);
  };

  const handleRemovePlayer = (pId) => {
    setPlayers(players.filter(p => p.id !== pId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a team name.');
      return;
    }
    if (players.length < 2) {
      setError('A team must have at least 2 players to start a match.');
      return;
    }
    setError('');
    onSave({
      id: initialTeam?.id,
      name: name.trim(),
      players
    });
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
        {initialTeam ? 'Edit Team' : 'Create New Team'}
      </h3>

      {error && (
        <div className="alert-box alert-error">
          <span>{error}</span>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Team Name</label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g. India, Australia, Mumbai Warriors"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Players ({players.length})</label>
        <PlayerList
          players={players}
          onAddPlayer={handleAddPlayer}
          onRemovePlayer={handleRemovePlayer}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
        <button type="submit" className="btn btn-primary">
          {initialTeam ? 'Update Team' : 'Save Team'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
