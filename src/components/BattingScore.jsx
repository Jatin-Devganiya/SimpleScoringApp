import React from 'react';

export default function BattingScore({
  strikerStats,
  nonStrikerStats,
  onSwapStrikeClick,
  onChangeBatsmenClick
}) {
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
      <div className="player-row" style={{ cursor: onSwapStrikeClick ? 'pointer' : 'default' }} onClick={onSwapStrikeClick} title={onSwapStrikeClick ? 'Click to swap strike' : undefined}>
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
      <div className="player-row" style={{ cursor: onSwapStrikeClick ? 'pointer' : 'default' }} onClick={onSwapStrikeClick} title={onSwapStrikeClick ? 'Click to swap strike' : undefined}>
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

      {(onSwapStrikeClick || onChangeBatsmenClick) && (
        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
          {onSwapStrikeClick && (
            <button
              type="button"
              onClick={onSwapStrikeClick}
              title="Swap who is facing delivery"
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--accent-yellow)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '3px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              ⇄ Swap Strike
            </button>
          )}
          {onChangeBatsmenClick && (
            <button
              type="button"
              onClick={onChangeBatsmenClick}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-green)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '3px 2px'
              }}
            >
              Change Batsmen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
