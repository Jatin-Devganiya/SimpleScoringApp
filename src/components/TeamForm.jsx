import React, { useState, useEffect, useRef } from 'react';
import { playerService } from '../services/PlayerService';
import { Check, Plus, UserPlus, AlertCircle, ChevronDown, ChevronUp, Search, X, CheckSquare, Square } from 'lucide-react';

export default function TeamForm({ initialTeam = null, onSave, onCancel, onNavigateToPlayers }) {
  const [name, setName] = useState(initialTeam?.name || '');
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(
    initialTeam?.playerIds || initialTeam?.players?.map(p => p.id) || []
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [playerFilter, setPlayerFilter] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const dropdownRef = useRef(null);

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

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTogglePlayer = (id) => {
    if (selectedPlayerIds.includes(id)) {
      setSelectedPlayerIds(selectedPlayerIds.filter(pId => pId !== id));
    } else {
      setSelectedPlayerIds([...selectedPlayerIds, id]);
    }
  };

  const handleSelectAllFiltered = (filteredList) => {
    const idsToAdd = filteredList.map(p => p.id);
    const combined = Array.from(new Set([...selectedPlayerIds, ...idsToAdd]));
    setSelectedPlayerIds(combined);
  };

  const handleClearAll = () => {
    setSelectedPlayerIds([]);
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

  const filteredPlayers = allPlayers.filter(p =>
    p.name.toLowerCase().includes(playerFilter.trim().toLowerCase())
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
            Select Team Players ({selectedPlayerIds.length} Selected)
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
          <div ref={dropdownRef} style={{ position: 'relative', marginBottom: '16px' }}>
            {/* Multi-Select Dropdown Trigger */}
            <div
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="form-input"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                userSelect: 'none',
                minHeight: '44px',
                borderColor: dropdownOpen ? 'var(--accent-green)' : 'var(--border-color)',
                background: 'var(--bg-surface-elevated)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {selectedPlayerIds.length === 0 ? (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    -- Click to select players from list --
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                    {selectedPlayerIds.length} player{selectedPlayerIds.length === 1 ? '' : 's'} selected
                  </span>
                )}
              </div>
              <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                {dropdownOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>

            {/* Multi-Select Dropdown Popover */}
            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  marginTop: '6px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.5)',
                  padding: '12px',
                  maxHeight: '340px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                {/* Search Filter Inside Dropdown */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search player name..."
                    value={playerFilter}
                    onChange={(e) => setPlayerFilter(e.target.value)}
                    style={{ paddingLeft: '32px', height: '36px', fontSize: '0.85rem' }}
                    autoFocus
                  />
                  <Search
                    size={15}
                    style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }}
                  />
                </div>

                {/* Toolbar: Select All / Clear All */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', fontSize: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => handleSelectAllFiltered(filteredPlayers)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-green)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Select All ({filteredPlayers.length})
                  </button>
                  {selectedPlayerIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Scrollable Checkbox List */}
                <div
                  style={{
                    overflowY: 'auto',
                    maxHeight: '180px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    paddingRight: '4px'
                  }}
                >
                  {filteredPlayers.length === 0 ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No players match "{playerFilter}"
                    </div>
                  ) : (
                    filteredPlayers.map(p => {
                      const isSelected = selectedPlayerIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleTogglePlayer(p.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface-elevated)',
                            cursor: 'pointer',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by parent div onClick
                              style={{ cursor: 'pointer', accentColor: 'var(--accent-green)' }}
                            />
                            <span style={{ fontSize: '0.9rem', color: isSelected ? '#fff' : 'var(--text-primary)', fontWeight: isSelected ? 600 : 400 }}>
                              {p.name}
                            </span>
                          </div>
                          {isSelected && (
                            <Check size={14} style={{ color: 'var(--accent-green)' }} />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Dropdown Close Button */}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setDropdownOpen(false)}
                  style={{ height: '34px', fontSize: '0.85rem', marginTop: '4px' }}
                >
                  Done ({selectedPlayerIds.length} Selected)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Selected squad chips */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
            Current Team Squad ({selectedPlayerIds.length}):
          </div>
          <div className="chip-container">
            {selectedPlayerIds.length === 0 ? (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                No players selected yet. Use the dropdown above to pick players.
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
