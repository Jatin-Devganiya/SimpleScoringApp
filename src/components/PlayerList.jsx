import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

export default function PlayerList({ players = [], onAddPlayer, onRemovePlayer }) {
  const [playerName, setPlayerName] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      onAddPlayer(playerName.trim());
      setPlayerName('');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Enter player name..."
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAdd(e);
            }
          }}
        />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleAdd}
          disabled={!playerName.trim()}
        >
          <Plus size={16} /> Add
        </button>
      </div>

      <div className="chip-container">
        {players.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
            No players added yet. Add at least 2 players.
          </p>
        ) : (
          players.map((player, idx) => (
            <div key={player.id || idx} className="player-chip">
              <span>{player.name}</span>
              <button
                type="button"
                className="chip-remove"
                onClick={() => onRemovePlayer(player.id || idx)}
                title="Remove player"
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
