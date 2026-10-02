import React from 'react';

export default function LiveScore({
  battingTeamName,
  bowlingTeamName,
  score = 0,
  wickets = 0,
  overs = '0.0',
  maxOvers = 20,
  extras = { total: 0, wides: 0, noBalls: 0 },
  currentRunRate = '0.00',
  inningsIndex = 0,
  targetRuns = null,
  remainingRuns = null,
  remainingBalls = null,
  requiredRunRate = null,
  matchResult = null,
  isMatchCompleted = false
}) {
  return (
    <div className="scoreboard-hero">
      <div className="match-status-banner">
        <span style={{ fontWeight: 600 }}>
          {battingTeamName} vs {bowlingTeamName}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>
          {inningsIndex === 0 ? '1st Innings' : '2nd Innings'} ({maxOvers} Ov)
        </span>
      </div>

      {isMatchCompleted && matchResult && (
        <div className="match-result-badge">
          🏆 {matchResult}
        </div>
      )}

      <div className="hero-main-score">
        <div>
          <div className="team-batting-title">{battingTeamName}</div>
          <div className="big-score-display">
            <span className="big-runs-wickets">
              {score}/{wickets}
            </span>
            <span className="big-overs">
              ({overs} / {maxOvers} ov)
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Current Run Rate
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-green)' }}>
            {currentRunRate}
          </div>
        </div>
      </div>

      {/* Target & Equation if 2nd Innings */}
      {targetRuns !== null && (
        <div className="target-banner">
          <div>
            Target: <strong>{targetRuns}</strong> | Current: <strong>{score}/{wickets}</strong>
          </div>
          <div>
            Need <strong>{remainingRuns}</strong> runs in <strong>{remainingBalls}</strong> balls
            {requiredRunRate && requiredRunRate !== 'N/A' && (
              <span> (RRR: <strong>{requiredRunRate}</strong>)</span>
            )}
          </div>
        </div>
      )}

      {/* Extras breakdown */}
      <div className="score-meta-bar">
        <div className="score-meta-item">
          Extras: <strong>{extras.total || 0}</strong>{' '}
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            (wd {extras.wides || 0}, nb {extras.noBalls || 0})
          </span>
        </div>
      </div>
    </div>
  );
}
