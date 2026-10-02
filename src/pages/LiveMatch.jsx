import React, { useState, useEffect, useCallback } from 'react';
import { scoringService } from '../services/ScoringService';
import { matchService } from '../services/MatchService';
import { storageProvider } from '../storage/storageFactory';
import LiveScore from '../components/LiveScore';
import BattingScore from '../components/BattingScore';
import BowlingScore from '../components/BowlingScore';
import CurrentOver from '../components/CurrentOver';
import ScoreButtons from '../components/ScoreButtons';
import { ArrowLeft, RotateCcw, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

export default function LiveMatch({ matchId, onBack, onViewScorecard }) {
  const [matchState, setMatchState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [showSecondInningsModal, setShowSecondInningsModal] = useState(false);

  // Form states for modals
  const [newBatsmanId, setNewBatsmanId] = useState('');
  const [newBowlerId, setNewBowlerId] = useState('');
  const [secondInningsStriker, setSecondInningsStriker] = useState('');
  const [secondInningsNonStriker, setSecondInningsNonStriker] = useState('');
  const [secondInningsBowler, setSecondInningsBowler] = useState('');

  const loadMatchState = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const state = await scoringService.getCompleteMatchState(matchId);
      if (!state || !state.match) {
        throw new Error('Match could not be found.');
      }
      setMatchState(state);

      // Auto-save completion if match finished
      if (state.isMatchCompleted && state.match.status !== 'COMPLETED') {
        await matchService.completeMatch(matchId, state.matchResult);
      }
    } catch (err) {
      console.error('Error loading match state:', err);
      setError(err.message || 'Failed to load match.');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    loadMatchState();

    // Subscribe to match changes
    const unsub = storageProvider.subscribeToMatch(matchId, () => {
      loadMatchState();
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [matchId, loadMatchState]);

  if (loading && !matchState) {
    return (
      <div className="card empty-state">
        <p>Loading live match score...</p>
      </div>
    );
  }

  if (error || !matchState) {
    return (
      <div className="card">
        <div className="alert-box alert-error">
          <AlertTriangle size={20} />
          <span>{error || 'Match not found.'}</span>
        </div>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Matches
        </button>
      </div>
    );
  }

  const {
    match,
    team1,
    team2,
    events,
    innings1,
    innings2,
    targetRuns,
    isMatchCompleted,
    matchResult,
    firstBattingTeam,
    secondBattingTeam
  } = matchState;

  const currentInningsIndex = match.currentInningsIndex || 0;
  const currentInningsData = currentInningsIndex === 0 ? innings1 : innings2;
  const activeBattingTeam = currentInningsIndex === 0 ? firstBattingTeam : secondBattingTeam;
  const activeBowlingTeam = currentInningsIndex === 0 ? secondBattingTeam : firstBattingTeam;

  const strikerStats = currentInningsData?.batsmanStats?.[currentInningsData?.strikerId];
  const nonStrikerStats = currentInningsData?.batsmanStats?.[currentInningsData?.nonStrikerId];
  const bowlerStats = currentInningsData?.bowlerStats?.[currentInningsData?.currentBowlerId];

  // Candidates for replacement batsman
  const availableBatsmen = (activeBattingTeam?.players || []).filter(p => {
    const stat = currentInningsData?.batsmanStats?.[p.id];
    const isOut = stat?.isOut;
    const isCurrentStriker = p.id === currentInningsData?.strikerId;
    const isCurrentNonStriker = p.id === currentInningsData?.nonStrikerId;
    return !isOut && !isCurrentStriker && !isCurrentNonStriker;
  });

  // Candidates for bowling change
  const eligibleBowlers = (activeBowlingTeam?.players || []).filter(p => {
    // If team has more than 1 player, bowler cannot bowl 2 consecutive overs
    if ((activeBowlingTeam?.players?.length || 0) > 1) {
      return p.id !== currentInningsData?.currentBowlerId;
    }
    return true;
  });

  // Check if first innings just completed
  const isFirstInningsFinished = currentInningsIndex === 0 && currentInningsData?.isInningsCompleted;

  // Actions
  const handleRun = async (runs) => {
    try {
      await scoringService.recordRun(matchId, {
        runs,
        strikerId: currentInningsData.strikerId,
        nonStrikerId: currentInningsData.nonStrikerId,
        bowlerId: currentInningsData.currentBowlerId,
        inningsIndex: currentInningsIndex
      });
      await loadMatchState();
    } catch (err) {
      alert(`Scoring error: ${err.message}`);
    }
  };

  const handleWide = async () => {
    try {
      await scoringService.recordWide(matchId, {
        extraRuns: 1,
        batRuns: 0,
        strikerId: currentInningsData.strikerId,
        nonStrikerId: currentInningsData.nonStrikerId,
        bowlerId: currentInningsData.currentBowlerId,
        inningsIndex: currentInningsIndex
      });
      await loadMatchState();
    } catch (err) {
      alert(`Scoring error: ${err.message}`);
    }
  };

  const handleNoBall = async (batRuns) => {
    try {
      await scoringService.recordNoBall(matchId, {
        extraRuns: 1,
        batRuns: batRuns || 0,
        strikerId: currentInningsData.strikerId,
        nonStrikerId: currentInningsData.nonStrikerId,
        bowlerId: currentInningsData.currentBowlerId,
        inningsIndex: currentInningsIndex
      });
      await loadMatchState();
    } catch (err) {
      alert(`Scoring error: ${err.message}`);
    }
  };

  const handleConfirmWicket = async () => {
    if (availableBatsmen.length > 0 && !newBatsmanId) {
      alert('Please select the incoming batsman.');
      return;
    }

    try {
      await scoringService.recordWicket(matchId, {
        dismissedPlayerId: currentInningsData.strikerId,
        newBatsmanId: newBatsmanId || null,
        strikerId: currentInningsData.strikerId,
        nonStrikerId: currentInningsData.nonStrikerId,
        bowlerId: currentInningsData.currentBowlerId,
        inningsIndex: currentInningsIndex,
        runs: 0
      });
      setShowWicketModal(false);
      setNewBatsmanId('');
      await loadMatchState();
    } catch (err) {
      alert(`Wicket error: ${err.message}`);
    }
  };

  const handleConfirmNewBowler = async () => {
    if (!newBowlerId) {
      alert('Please select a bowler.');
      return;
    }

    try {
      // Over change persists with event or direct match bowler state
      const currentInnings = match.innings[currentInningsIndex];
      const updatedInningsList = [...match.innings];
      updatedInningsList[currentInningsIndex] = {
        ...currentInnings,
        bowlerId: newBowlerId
      };
      await matchService.updateMatch({
        ...match,
        innings: updatedInningsList
      });

      setShowBowlerModal(false);
      setNewBowlerId('');
      await loadMatchState();
    } catch (err) {
      alert(`Bowler error: ${err.message}`);
    }
  };

  const handleStartSecondInnings = async () => {
    if (!secondInningsStriker || !secondInningsNonStriker || !secondInningsBowler) {
      alert('Please select both opening batsmen and the opening bowler for the 2nd innings.');
      return;
    }
    if (secondInningsStriker === secondInningsNonStriker) {
      alert('Striker and non-striker cannot be the same batsman.');
      return;
    }

    try {
      await matchService.startSecondInnings(matchId, {
        strikerId: secondInningsStriker,
        nonStrikerId: secondInningsNonStriker,
        bowlerId: secondInningsBowler
      });
      setShowSecondInningsModal(false);
      await loadMatchState();
    } catch (err) {
      alert(`Failed to start 2nd innings: ${err.message}`);
    }
  };

  const handleUndo = async () => {
    try {
      await scoringService.undoLastEvent(matchId);
      await loadMatchState();
    } catch (err) {
      alert(`Undo error: ${err.message}`);
    }
  };

  const canUndo = events.length > 0;

  return (
    <div>
      {/* Top action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <button className="btn btn-secondary" onClick={onBack} style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Back to Matches
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => onViewScorecard(matchId)}
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          >
            <FileText size={16} /> View Scorecard
          </button>
        </div>
      </div>

      {/* Main Scoreboard Display */}
      <LiveScore
        battingTeamName={activeBattingTeam?.name || 'Batting Team'}
        bowlingTeamName={activeBowlingTeam?.name || 'Bowling Team'}
        score={currentInningsData?.score || 0}
        wickets={currentInningsData?.wickets || 0}
        overs={currentInningsData?.overs || '0.0'}
        maxOvers={match.totalOvers || 20}
        extras={currentInningsData?.extras}
        currentRunRate={currentInningsData?.currentRunRate}
        inningsIndex={currentInningsIndex}
        targetRuns={targetRuns}
        remainingRuns={currentInningsData?.remainingRuns}
        remainingBalls={currentInningsData?.remainingBalls}
        requiredRunRate={currentInningsData?.requiredRunRate}
        matchResult={matchResult}
        isMatchCompleted={isMatchCompleted}
      />

      {/* 1st Innings Complete Banner */}
      {isFirstInningsFinished && (
        <div className="card" style={{ textAlign: 'center', border: '1px solid var(--accent-gold)', background: 'rgba(245, 158, 11, 0.08)' }}>
          <h3 style={{ color: 'var(--accent-gold)', fontSize: '1.25rem', marginBottom: '8px' }}>
            First Innings Complete!
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {firstBattingTeam?.name} scored <strong>{innings1?.score}/{innings1?.wickets}</strong> in {innings1?.overs} overs.
            Target for {secondBattingTeam?.name} is <strong>{(innings1?.score || 0) + 1}</strong> runs.
          </p>
          <button
            className="btn btn-primary"
            style={{ margin: '0 auto' }}
            onClick={() => {
              if (secondBattingTeam?.players?.length >= 2) {
                setSecondInningsStriker(secondBattingTeam.players[0].id);
                setSecondInningsNonStriker(secondBattingTeam.players[1].id);
              }
              if (firstBattingTeam?.players?.length >= 1) {
                setSecondInningsBowler(firstBattingTeam.players[0].id);
              }
              setShowSecondInningsModal(true);
            }}
          >
            Start Second Innings
          </button>
        </div>
      )}

      {/* Match Completed Banner */}
      {isMatchCompleted && (
        <div className="card" style={{ textAlign: 'center', border: '1px solid var(--accent-green)', background: 'rgba(16, 185, 129, 0.08)' }}>
          <CheckCircle size={36} color="var(--accent-green)" style={{ margin: '0 auto 8px' }} />
          <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '6px' }}>Match Completed</h2>
          <p style={{ color: 'var(--accent-green)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
            {matchResult}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => onViewScorecard(matchId)}>
              View Full Scorecard
            </button>
            <button className="btn btn-secondary" onClick={onBack}>
              Match List
            </button>
          </div>
        </div>
      )}

      {/* Active Batting and Bowling Figures */}
      {!isFirstInningsFinished && !isMatchCompleted && (
        <>
          <div className="active-players-grid">
            <BattingScore
              strikerStats={strikerStats}
              nonStrikerStats={nonStrikerStats}
            />
            <BowlingScore
              bowlerStats={bowlerStats}
              onSwitchBowlerClick={() => setShowBowlerModal(true)}
            />
          </div>

          {/* Current Over Balls */}
          <CurrentOver
            currentOverBalls={currentInningsData?.currentOverBalls || []}
            overNumber={Math.floor((currentInningsData?.legalBalls || 0) / 6)}
          />

          {/* Prompt bowler change if over is complete */}
          {currentInningsData?.pendingNewBowler && (
            <div className="alert-box alert-success" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Over complete! Please select the bowler for the next over.</span>
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => setShowBowlerModal(true)}
              >
                Select Bowler
              </button>
            </div>
          )}

          {/* Large Scoring Buttons */}
          <ScoreButtons
            onRun={handleRun}
            onWide={handleWide}
            onNoBall={handleNoBall}
            onWicketClick={() => {
              if (availableBatsmen.length > 0) {
                setNewBatsmanId(availableBatsmen[0].id);
              }
              setShowWicketModal(true);
            }}
            onUndo={handleUndo}
            canUndo={canUndo}
            disabled={currentInningsData?.isInningsCompleted || isMatchCompleted}
          />
        </>
      )}

      {/* Wicket Modal */}
      {showWicketModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title" style={{ color: 'var(--accent-red)' }}>Wicket Fallen!</h3>
            <p className="modal-desc">
              Dismissed Batsman: <strong>{strikerStats?.name || 'Striker'}</strong>
            </p>

            {availableBatsmen.length > 0 ? (
              <div className="form-group">
                <label className="form-label">Incoming Batsman</label>
                <select
                  className="form-select"
                  value={newBatsmanId}
                  onChange={(e) => setNewBatsmanId(e.target.value)}
                  required
                >
                  {availableBatsmen.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="alert-box alert-error">
                <span>All available batsmen have been dismissed (All Out)!</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={handleConfirmWicket}
              >
                Confirm Wicket
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowWicketModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Bowler Modal */}
      {showBowlerModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">Select Bowler</h3>
            <p className="modal-desc">Choose who will bowl the next delivery:</p>

            <div className="form-group">
              <label className="form-label">Eligible Bowlers ({activeBowlingTeam?.name})</label>
              <select
                className="form-select"
                value={newBowlerId}
                onChange={(e) => setNewBowlerId(e.target.value)}
              >
                <option value="">-- Choose bowler --</option>
                {eligibleBowlers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleConfirmNewBowler}
                disabled={!newBowlerId}
              >
                Set Bowler
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowBowlerModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start 2nd Innings Modal */}
      {showSecondInningsModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">Setup 2nd Innings</h3>
            <p className="modal-desc">
              {secondBattingTeam?.name} batting to chase target of <strong>{(innings1?.score || 0) + 1}</strong>
            </p>

            <div className="form-group">
              <label className="form-label">Opening Striker (★)</label>
              <select
                className="form-select"
                value={secondInningsStriker}
                onChange={(e) => setSecondInningsStriker(e.target.value)}
                required
              >
                {secondBattingTeam?.players?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Opening Non-Striker</label>
              <select
                className="form-select"
                value={secondInningsNonStriker}
                onChange={(e) => setSecondInningsNonStriker(e.target.value)}
                required
              >
                {secondBattingTeam?.players?.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === secondInningsStriker}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Opening Bowler ({firstBattingTeam?.name})</label>
              <select
                className="form-select"
                value={secondInningsBowler}
                onChange={(e) => setSecondInningsBowler(e.target.value)}
                required
              >
                {firstBattingTeam?.players?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleStartSecondInnings}
              >
                Begin 2nd Innings
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowSecondInningsModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
