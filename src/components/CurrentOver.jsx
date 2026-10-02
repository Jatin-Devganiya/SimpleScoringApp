import React from 'react';

export default function CurrentOver({ currentOverBalls = [], overNumber = 0 }) {
  const getBallClass = (ball) => {
    if (ball === '4') return 'four';
    if (ball === '6') return 'six';
    if (ball === 'W') return 'wicket';
    if (ball.includes('Wd') || ball.includes('Nb')) return 'extra';
    return '';
  };

  return (
    <div className="current-over-box">
      <div className="current-over-header">
        <span>Current Over (Over {overNumber + 1})</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {currentOverBalls.length} deliver{currentOverBalls.length === 1 ? 'y' : 'ies'}
        </span>
      </div>

      <div className="balls-pill-container">
        {currentOverBalls.length === 0 ? (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
            Yet to start this over
          </span>
        ) : (
          currentOverBalls.map((ball, idx) => (
            <div key={idx} className={`ball-pill ${getBallClass(ball)}`}>
              {ball}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
