import React, { useState, useEffect } from 'react';
import { playerService } from '../services/PlayerService';
import { authService } from '../services/AuthService';
import { Plus, Edit2, Trash2, User, Search, AlertCircle, Check } from 'lucide-react';

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Form modal
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [playerName, setPlayerName] = useState('');

  const isUmpire = authService.isUmpire();

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const list = await playerService.getPlayers();
      setPlayers(list);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load players.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const handleOpenAdd = () => {
    setEditingPlayer(null);
    setPlayerName('');
    setFeedback(null);
    setShowModal(true);
  };

  const handleOpenEdit = (player) => {
    setEditingPlayer(player);
    setPlayerName(player.name);
    setFeedback(null);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingPlayer) {
        await playerService.updatePlayer(editingPlayer.id, playerName);
        setFeedback({ type: 'success', message: 'Player updated successfully.' });
      } else {
        await playerService.createPlayer(playerName);
        setFeedback({ type: 'success', message: 'Player added successfully.' });
      }
      setShowModal(false);
      await loadPlayers();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDelete = async (playerId, name) => {
    if (window.confirm(`Are you sure you want to delete player "${name}"?`)) {
      try {
        await playerService.deletePlayer(playerId);
        setFeedback({ type: 'success', message: `Player "${name}" deleted.` });
        await loadPlayers();
      } catch (err) {
        setFeedback({ type: 'error', message: err.message || 'Error deleting player.' });
      }
    }
  };

  const filteredPlayers = players.filter(p =>
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <User size={24} /> Players
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {players.length} registered player{players.length === 1 ? '' : 's'} across all teams
          </p>
        </div>

        {/* Only Umpire sees Add Player button */}
        {isUmpire && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Add Player
          </button>
        )}
      </div>

      {feedback && (
        <div className={`alert-box alert-${feedback.type}`}>
          {feedback.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Search Input */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative', maxWidth: '360px' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading players...
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="card empty-state">
          <User size={48} className="empty-state-icon" />
          <h3 style={{ marginBottom: '6px' }}>No players found</h3>
          <p style={{ fontSize: '0.9rem' }}>
            {isUmpire ? 'Click "Add Player" to register players.' : 'No players registered yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              className="card"
              style={{
                marginBottom: 0,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: 'var(--bg-surface-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: 'var(--accent-green)',
                    fontSize: '0.85rem'
                  }}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{player.name}</span>
              </div>

              {/* Action buttons visible only to Umpire */}
              {isUmpire && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 8px', fontSize: '0.8rem' }}
                    onClick={() => handleOpenEdit(player)}
                    title="Edit Player"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '6px 8px', fontSize: '0.8rem' }}
                    onClick={() => handleDelete(player.id, player.name)}
                    title="Delete Player"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Player Modal (Umpire only) */}
      {showModal && isUmpire && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">{editingPlayer ? 'Edit Player' : 'Add New Player'}</h3>
            <p className="modal-desc">
              Enter player's name. Player will be selectable in any team lineup.
            </p>

            <form onSubmit={handleSave}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Player Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Virat Kohli"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingPlayer ? 'Save Changes' : 'Add Player'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
