import React from 'react';

export default function BattingScore({ strikerStats, nonStrikerStats }) {
  return (
    <div className="player-score-card is-striker">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Batting
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          R (B) 4s 6s SR
        </span>
      </div>

      {/* Striker Row */}
      <div className="player-row">
        <div className="player-name-col">
          <span className="striker-star" title="On Strike">★</span>
          <span>{strikerStats?.name || 'Striker'}</span>
        </div>
        <div className="player-stat-col">
          <strong>{strikerStats?.runs || 0}</strong>{' '}
          <span style={{ color: 'var(--text-muted)' }}>({strikerStats?.balls || 0})</span>{' '}
          <span style={{ color: 'var(--accent-blue)', fontSize: '0.8rem' }}>{strikerStats?.fours || 0}</span>{' '}
          <span style={{ color: 'var(--accent-green)', fontSize: '0.8rem' }}>{strikerStats?.sixes || 0}</span>{' '}
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{strikerStats?.strikeRate || '0.00'}</span>
        </div>
      </div>

      {/* Non-Striker Row */}
      <div className="player-row">
        <div className="player-name-col">
          <span style={{ width: '14px', display: 'inline-block' }}></span>
          <span style={{ color: 'var(--text-secondary)' }}>{nonStrikerStats?.name || 'Non-Striker'}</span>
        </div>
        <div className="player-stat-col">
          <strong>{nonStrikerStats?.runs || 0}</strong>{' '}
          <span style={{ color: 'var(--text-muted)' }}>({nonStrikerStats?.balls || 0})</span>{' '}
          <span style={{ color: 'var(--accent-blue)', fontSize: '0.8rem' }}>{nonStrikerStats?.fours || 0}</span>{' '}
          <span style={{ color: 'var(--accent-green)', fontSize: '0.8rem' }}>{nonStrikerStats?.sixes || 0}</span>{' '}
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{nonStrikerStats?.strikeRate || '0.00'}</span>
        </div>
      </div>
    </div>
  );
}
