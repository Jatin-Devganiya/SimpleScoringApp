import React, { useState, useEffect } from 'react';
import { playerService } from '../services/PlayerService';
import { Check, Plus, UserPlus, AlertCircle } from 'lucide-react';

export default function TeamForm({ initialTeam = null, onSave, onCancel, onNavigateToPlayers }) {
  const [name, setName] = useState(initialTeam?.name || '');
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(
    initialTeam?.playerIds || initialTeam?.players?.map(p => p.id) || []
  );
  const [selectedPlayerToAdd, setSelectedPlayerToAdd] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        setLoading(true);
        const list = await playerService.getPlayers();
        setAllPlayers(list);
      } catch (err) {
        console.error('Failed to load registered players:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlayers();
  }, []);

  const handleTogglePlayer = (id) => {
    if (selectedPlayerIds.includes(id)) {
      setSelectedPlayerIds(selectedPlayerIds.filter(pId => pId !== id));
    } else {
      setSelectedPlayerIds([...selectedPlayerIds, id]);
    }
  };

  const handleAddSelectedFromDropdown = () => {
    if (selectedPlayerToAdd && !selectedPlayerIds.includes(selectedPlayerToAdd)) {
      setSelectedPlayerIds([...selectedPlayerIds, selectedPlayerToAdd]);
      setSelectedPlayerToAdd('');
    }
  };

  const handleRemovePlayer = (id) => {
    setSelectedPlayerIds(selectedPlayerIds.filter(pId => pId !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a team name.');
      return;
    }
    if (selectedPlayerIds.length < 2) {
      setError('A team must have at least 2 selected players to participate in a match.');
      return;
    }
    setError('');
    onSave({
      id: initialTeam?.id,
      name: name.trim(),
      playerIds: selectedPlayerIds
    });
  };

  const availableUnselectedPlayers = allPlayers.filter(
    p => !selectedPlayerIds.includes(p.id)
  );

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>
        {initialTeam ? 'Edit Team' : 'Create New Team'}
      </h3>

      {error && (
        <div className="alert-box alert-error">
          <AlertCircle size={18} />
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>
            Select Players ({selectedPlayerIds.length} Selected)
          </label>
          {onNavigateToPlayers && (
            <button
              type="button"
              onClick={onNavigateToPlayers}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-green)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <UserPlus size={13} /> Manage Master Players List
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading players...</p>
        ) : allPlayers.length === 0 ? (
          <div className="alert-box alert-error" style={{ marginBottom: '12px' }}>
            <span>No players exist in the Players list. Please add players in the Players menu first.</span>
          </div>
        ) : (
          <>
            {/* Quick dropdown select */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <select
                className="form-select"
                value={selectedPlayerToAdd}
                onChange={(e) => setSelectedPlayerToAdd(e.target.value)}
              >
                <option value="">-- Choose registered player to add --</option>
                {availableUnselectedPlayers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!selectedPlayerToAdd}
                onClick={handleAddSelectedFromDropdown}
              >
                <Plus size={16} /> Add
              </button>
            </div>

            {/* Selected squad chips */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Current Team Squad:
              </div>
              <div className="chip-container">
                {selectedPlayerIds.length === 0 ? (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    No players selected yet. Select at least 2 players above.
                  </span>
                ) : (
                  selectedPlayerIds.map(pId => {
                    const playerObj = allPlayers.find(p => p.id === pId);
                    return (
                      <div key={pId} className="player-chip">
                        <span>{playerObj?.name || pId}</span>
                        <button
                          type="button"
                          className="chip-remove"
                          onClick={() => handleRemovePlayer(pId)}
                          title="Remove from team"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
        <button type="submit" className="btn btn-primary" disabled={allPlayers.length < 2}>
          {initialTeam ? 'Update Team' : 'Save Team'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
