import React from 'react';

export default function BowlingScore({ bowlerStats, onSwitchBowlerClick }) {
  return (
    <div className="player-score-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Bowling
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          O - R - W - Econ
        </span>
      </div>

      <div className="player-row">
        <div className="player-name-col">
          <span style={{ color: 'var(--accent-green)', marginRight: '4px' }}>⚾</span>
          <span>{bowlerStats?.name || 'Bowler'}</span>
        </div>
        <div className="player-stat-col">
          <span>{bowlerStats?.overs || '0.0'}</span> ov •{' '}
          <strong>{bowlerStats?.runs || 0}</strong> r •{' '}
          <strong style={{ color: 'var(--accent-red)' }}>{bowlerStats?.wickets || 0}</strong> w •{' '}
          <span style={{ color: 'var(--text-secondary)' }}>{bowlerStats?.economy || '0.00'}</span>
        </div>
      </div>

      {onSwitchBowlerClick && (
        <div style={{ marginTop: '8px', textAlign: 'right' }}>
          <button
            onClick={onSwitchBowlerClick}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-green)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Change Bowler
          </button>
        </div>
      )}
    </div>
  );
}
