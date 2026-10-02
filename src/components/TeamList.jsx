import React from 'react';
import { Users, Edit2, Trash2 } from 'lucide-react';
import { authService } from '../services/AuthService';

export default function TeamList({ teams = [], onEdit, onDelete }) {
  const isUmpire = authService.isUmpire();

  if (teams.length === 0) {
    return (
      <div className="card empty-state">
        <Users size={48} className="empty-state-icon" />
        <h3 style={{ marginBottom: '6px' }}>No teams created yet</h3>
        <p style={{ fontSize: '0.9rem' }}>
          {isUmpire ? 'Create teams and select players from the Players menu.' : 'No teams available.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
      {teams.map((team) => (
        <div key={team.id} className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{team.name}</h3>
            {/* Actions visible only to Umpire */}
            {isUmpire && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                  onClick={() => onEdit(team)}
                  title="Edit Team"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                  onClick={() => onDelete(team.id)}
                  title="Delete Team"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {team.players?.length || 0} Player{(team.players?.length || 0) === 1 ? '' : 's'}
          </div>

          <div className="chip-container" style={{ maxHeight: '100px', overflowY: 'auto' }}>
            {(team.players || []).map((p) => (
              <span key={p.id} className="player-chip" style={{ fontSize: '0.8rem', padding: '2px 8px' }}>
                {p.name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
