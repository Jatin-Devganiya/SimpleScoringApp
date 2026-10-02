import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

export default function ScoreButtons({
  onRun,
  onWide,
  onNoBall,
  onWicketClick,
  onUndo,
  canUndo = false,
  disabled = false
}) {
  const [showNoBallModal, setShowNoBallModal] = useState(false);

  const handleNoBallSelect = (batRuns) => {
    setShowNoBallModal(false);
    onNoBall(batRuns);
  };

  return (
    <>
      <div className="scoring-pad-container">
        {/* Row 1: 0, 1, 2, 3 */}
        <button
          className="score-btn"
          disabled={disabled}
          onClick={() => onRun(0)}
        >
          0
        </button>
        <button
          className="score-btn"
          disabled={disabled}
          onClick={() => onRun(1)}
        >
          1
        </button>
        <button
          className="score-btn"
          disabled={disabled}
          onClick={() => onRun(2)}
        >
          2
        </button>
        <button
          className="score-btn"
          disabled={disabled}
          onClick={() => onRun(3)}
        >
          3
        </button>

        {/* Row 2: 4, 5, 6, WICKET */}
        <button
          className="score-btn run-4"
          disabled={disabled}
          onClick={() => onRun(4)}
        >
          4
        </button>
        <button
          className="score-btn"
          disabled={disabled}
          onClick={() => onRun(5)}
        >
          5
        </button>
        <button
          className="score-btn run-6"
          disabled={disabled}
          onClick={() => onRun(6)}
        >
          6
        </button>
        <button
          className="score-btn btn-wicket"
          disabled={disabled}
          onClick={onWicketClick}
        >
          WICKET
        </button>

        {/* Row 3: WIDE, NO BALL, and span UNDO */}
        <button
          className="score-btn btn-wide"
          disabled={disabled}
          onClick={onWide}
        >
          WIDE
        </button>
        <button
          className="score-btn btn-noball"
          disabled={disabled}
          onClick={() => setShowNoBallModal(true)}
        >
          NO BALL
        </button>
        <button
          className="score-btn"
          style={{
            gridColumn: 'span 2',
            background: 'var(--bg-surface)',
            fontSize: '0.95rem',
            color: canUndo && !disabled ? '#f87171' : 'var(--text-muted)'
          }}
          disabled={!canUndo || disabled}
          onClick={onUndo}
        >
          <RotateCcw size={16} style={{ marginRight: '6px' }} />
          UNDO LAST BALL
        </button>
      </div>

      {/* No Ball Bat Runs Modal */}
      {showNoBallModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">No Ball Delivery</h3>
            <p className="modal-desc">
              Select batsman runs scored off the No Ball (1 penalty run added automatically):
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {[0, 1, 2, 3, 4, 6].map((runs) => (
                <button
                  key={runs}
                  className="btn btn-secondary"
                  style={{ height: '48px', fontSize: '1.1rem' }}
                  onClick={() => handleNoBallSelect(runs)}
                >
                  +{runs} {runs === 1 ? 'Run' : 'Runs'}
                </button>
              ))}
            </div>
            <button
              className="btn btn-secondary"
              style={{ width: '100%' }}
              onClick={() => setShowNoBallModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
