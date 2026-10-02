import React from 'react';
import { Play, Eye, Trash2, Calendar, Radio } from 'lucide-react';
import { formatDateTime } from '../utils/formatters';
import { authService } from '../services/AuthService';

export default function MatchList({
  matches = [],
  teamsMap = {},
  onSelectMatch,
  onViewScorecard,
  onDeleteMatch
}) {
  const isUmpire = authService.isUmpire();

  if (matches.length === 0) {
    return (
      <div className="card empty-state">
        <Radio size={48} className="empty-state-icon" />
        <h3 style={{ marginBottom: '6px' }}>No matches recorded</h3>
        <p style={{ fontSize: '0.9rem' }}>
          {isUmpire ? 'Click "New Match" to setup and score a match.' : 'No matches available to view.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {matches.map((match) => {
        const team1 = teamsMap[match.team1Id];
        const team2 = teamsMap[match.team2Id];
        const isCompleted = match.status === 'COMPLETED';

        return (
          <div key={match.id} className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`storage-badge ${isCompleted ? '' : 'local'}`} style={{ fontSize: '0.7rem' }}>
                  {isCompleted ? 'COMPLETED' : 'LIVE'}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {match.totalOvers} Overs
                </span>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} />
                {formatDateTime(match.createdAt)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  {team1?.name || 'Team 1'} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>vs</span> {team2?.name || 'Team 2'}
                </h3>
                {match.createdBy && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Scored by {authService.canModify(match) ? 'you' : match.createdBy}
                  </div>
                )}
              </div>

              {match.result && (
                <div style={{ color: 'var(--accent-green)', fontWeight: 600, fontSize: '0.9rem' }}>
                  🏆 {match.result}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {!isCompleted && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                  onClick={() => onSelectMatch(match.id)}
                >
                  <Play size={14} /> {authService.canModify(match) ? 'Resume Scoring' : 'Watch Live Score'}
                </button>
              )}

              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                onClick={() => onViewScorecard(match.id)}
              >
                <Eye size={14} /> Scorecard
              </button>

              {/* Delete button only visible to creator Umpire */}
              {authService.canModify(match) && (
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ padding: '8px 14px', fontSize: '0.85rem', marginLeft: 'auto' }}
                  onClick={() => onDeleteMatch(match.id)}
                  title="Delete Match"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

        );
      })}
    </div>
  );
}
