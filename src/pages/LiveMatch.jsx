import React, { useState, useEffect, useCallback } from 'react';
import { scoringService } from '../services/ScoringService';
import { matchService } from '../services/MatchService';
import { authService } from '../services/AuthService';
import { storageProvider } from '../storage/storageFactory';
import LiveScore from '../components/LiveScore';
import BattingScore from '../components/BattingScore';
import BowlingScore from '../components/BowlingScore';
import CurrentOver from '../components/CurrentOver';
import ScoreButtons from '../components/ScoreButtons';
import { ArrowLeft, CheckCircle, FileText, UserCheck, ShieldAlert, AlertTriangle, Eye, UserX, AlertCircle, Users } from 'lucide-react';

export default function LiveMatch({ matchId, onBack, onViewScorecard }) {
  const [matchState, setMatchState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [showDeclareModal, setShowDeclareModal] = useState(false);
  const [showChangeBatsmenModal, setShowChangeBatsmenModal] = useState(false);
  const [showSecondInningsModal, setShowSecondInningsModal] = useState(false);

  // Modal form states
  const [promptedOver, setPromptedOver] = useState(null);
  const [newBatsmanId, setNewBatsmanId] = useState('');
  const [newBowlerId, setNewBowlerId] = useState('');
  const [manualStrikerId, setManualStrikerId] = useState('');
  const [manualNonStrikerId, setManualNonStrikerId] = useState('');
  const [declareTarget, setDeclareTarget] = useState('striker');
  const [declareReplacementId, setDeclareReplacementId] = useState('');
  const [dismissalType, setDismissalType] = useState('Wicket');
  const [dismissedTarget, setDismissedTarget] = useState('striker');
  const [wicketRuns, setWicketRuns] = useState(0);

  const [secondInningsStriker, setSecondInningsStriker] = useState('');
  const [secondInningsNonStriker, setSecondInningsNonStriker] = useState('');
  const [secondInningsBowler, setSecondInningsBowler] = useState('');

  const isUmpire = authService.isUmpire();
  const canScore = isUmpire && authService.canModify(matchState?.match);

  const loadMatchState = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const state = await scoringService.getCompleteMatchState(matchId);
      if (!state || !state.match) {
        throw new Error('Match could not be found.');
      }
      setMatchState(state);

      // Auto-save completion if match finished (only if creator umpire)
      if (state.isMatchCompleted && state.match.status !== 'COMPLETED' && authService.canModify(state.match)) {
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

    const unsub = storageProvider.subscribeToMatch(matchId, () => {
      loadMatchState();
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [matchId, loadMatchState]);

  // Check if an over just completed to automatically open Next Bowler modal for the creator Umpire
  useEffect(() => {
    if (!matchState || !canScore) return;
    const currentInningsIndex = matchState.match.currentInningsIndex || 0;
    const inningsData = currentInningsIndex === 0 ? matchState.innings1 : matchState.innings2;

    const overIdentifier = `${currentInningsIndex}_${inningsData?.overs}`;
    if (inningsData?.pendingNewBowler && !inningsData?.isInningsCompleted && !matchState.isMatchCompleted) {
      if (promptedOver !== overIdentifier) {
        setPromptedOver(overIdentifier);
        const bowlingSquad = (currentInningsIndex === 0 ? matchState.secondBattingTeam : matchState.firstBattingTeam)?.players || [];
        const eligible = bowlingSquad.filter(p => {
          if (bowlingSquad.length <= 1) return true;
          return p.id !== inningsData?.currentBowlerId;
        });
        if (eligible.length > 0) {
          setNewBowlerId(eligible[0].id);
        }
        setShowBowlerModal(true);
      }
    }
  }, [matchState, canScore, promptedOver]);


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

  // Eligible replacement batsmen (batting team members not out and not currently batting)
  const availableBatsmen = (activeBattingTeam?.players || []).filter(p => {
    const stat = currentInningsData?.batsmanStats?.[p.id];
    const isOut = stat?.isOut;
    const isCurrentStriker = p.id === currentInningsData?.strikerId;
    const isCurrentNonStriker = p.id === currentInningsData?.nonStrikerId;
    return !isOut && !isCurrentStriker && !isCurrentNonStriker;
  });

  // Eligible next bowlers (consecutive over restriction: current bowler / bowler of previous over cannot bowl consecutively if >1 bowler in squad)
  const eligibleNextBowlers = (activeBowlingTeam?.players || []).filter(p => {
    if ((activeBowlingTeam?.players?.length || 0) <= 1) return true;
    if (p.id === currentInningsData?.currentBowlerId) return false;
    const prevBowlerId = currentInningsData?.pendingNewBowler
      ? currentInningsData?.currentBowlerId
      : currentInningsData?.lastCompletedOverBowlerId;
    if (prevBowlerId && p.id === prevBowlerId) return false;
    return true;
  });

  const handleOpenBowlerModal = () => {
    if (eligibleNextBowlers.length > 0 && (!newBowlerId || !eligibleNextBowlers.some(p => p.id === newBowlerId))) {
      setNewBowlerId(eligibleNextBowlers[0].id);
    }
    setShowBowlerModal(true);
  };

  const handleOpenDeclareModal = () => {
    setDeclareTarget('striker');
    if (availableBatsmen.length > 0) {
      setDeclareReplacementId(availableBatsmen[0].id);
    } else {
      setDeclareReplacementId('');
    }
    setShowDeclareModal(true);
  };

  const handleQuickSwapStrike = async () => {
    if (!canScore) return;
    try {
      await scoringService.swapStrike(matchId, {
        inningsIndex: currentInningsIndex
      });
      await loadMatchState();
    } catch (err) {
      alert(`Swap strike error: ${err.message}`);
    }
  };

  const handleOpenChangeBatsmenModal = () => {
    setManualStrikerId(currentInningsData?.strikerId || '');
    setManualNonStrikerId(currentInningsData?.nonStrikerId || '');
    setShowChangeBatsmenModal(true);
  };

  const handleConfirmChangeBatsmen = async () => {
    if (!manualStrikerId || !manualNonStrikerId) {
      alert('Please select both striker and non-striker.');
      return;
    }
    if (manualStrikerId === manualNonStrikerId) {
      alert('Striker and Non-Striker must be different players.');
      return;
    }

    try {
      setShowChangeBatsmenModal(false);
      await scoringService.setBatsmen(matchId, {
        strikerId: manualStrikerId,
        nonStrikerId: manualNonStrikerId,
        inningsIndex: currentInningsIndex
      });
      await loadMatchState();
    } catch (err) {
      alert(`Change batsmen error: ${err.message}`);
    }
  };

  // Eligible batsmen for manual change / declaration (all non-out batting team players)
  const nonOutBattingSquad = (activeBattingTeam?.players || []).filter(p => {
    const stat = currentInningsData?.batsmanStats?.[p.id];
    return !stat?.isOut;
  });

  const isFirstInningsFinished = currentInningsIndex === 0 && currentInningsData?.isInningsCompleted;

  // --- Scoring Event Handlers (Umpire only) ---
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

    const isRunOut = dismissalType === 'Run Out';
    const dismissedPlayerId = isRunOut && dismissedTarget === 'nonStriker'
      ? currentInningsData.nonStrikerId
      : currentInningsData.strikerId;

    try {
      await scoringService.recordWicket(matchId, {
        dismissedPlayerId,
        newBatsmanId: newBatsmanId || null,
        strikerId: currentInningsData.strikerId,
        nonStrikerId: currentInningsData.nonStrikerId,
        bowlerId: currentInningsData.currentBowlerId,
        inningsIndex: currentInningsIndex,
        runs: isRunOut ? (Number(wicketRuns) || 0) : 0,
        dismissalType,
        isBowlerWicket: !isRunOut
      });
      setShowWicketModal(false);
      setNewBatsmanId('');
      setWicketRuns(0);
      setDismissalType('Wicket');
      setDismissedTarget('striker');
      await loadMatchState();
    } catch (err) {
      alert(`Wicket error: ${err.message}`);
    }
  };

  const handleConfirmNewBowler = async () => {
    if (!newBowlerId) {
      alert('Please select the next bowler.');
      return;
    }

    try {
      setShowBowlerModal(false);
      const chosenBowler = newBowlerId;
      setNewBowlerId('');
      const overIdentifier = `${currentInningsIndex}_${currentInningsData?.overs}`;
      setPromptedOver(overIdentifier);

      await scoringService.setNextBowler(matchId, {
        bowlerId: chosenBowler,
        inningsIndex: currentInningsIndex
      });

      await loadMatchState();
    } catch (err) {
      alert(`Bowler error: ${err.message}`);
    }
  };

  const handleConfirmDeclareBatsman = async () => {
    const declaredPlayerId = declareTarget === 'striker' ? currentInningsData?.strikerId : currentInningsData?.nonStrikerId;
    if (!declaredPlayerId) {
      alert('Could not identify active batsman.');
      return;
    }
    if (!declareReplacementId) {
      alert('Please select an incoming replacement batsman.');
      return;
    }

    try {
      setShowDeclareModal(false);
      const replacementId = declareReplacementId;
      setDeclareReplacementId('');
      await scoringService.declareBatsman(matchId, {
        declaredPlayerId,
        replacementPlayerId: replacementId,
        inningsIndex: currentInningsIndex
      });
      await loadMatchState();
    } catch (err) {
      alert(`Declare batsman error: ${err.message}`);
    }
  };

  const handleStartSecondInnings = async () => {
    if (!secondInningsStriker || !secondInningsNonStriker || !secondInningsBowler) {
      alert('Please select opening batsmen and the opening bowler for the 2nd innings.');
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
      <div className="live-header-bar">
        <button className="btn btn-secondary live-back-btn" onClick={onBack}>
          <ArrowLeft size={16} /> <span>Back to Matches</span>
        </button>

        <div className="live-header-actions">
          {canScore && !isFirstInningsFinished && !isMatchCompleted && (
            <>
              <button
                className="btn btn-secondary live-action-btn"
                onClick={handleQuickSwapStrike}
                title="Swap who is on strike"
              >
                ⇄ <span>Swap Strike</span>
              </button>
              <button
                className="btn btn-secondary live-action-btn"
                onClick={handleOpenChangeBatsmenModal}
                title="Manually change striker and non-striker batsman"
              >
                <Users size={15} /> <span>Change Batsmen</span>
              </button>
              <button
                className="btn btn-secondary live-action-btn"
                onClick={handleOpenDeclareModal}
                title="Declare an active batsman and replace with a new batsman"
              >
                <UserX size={15} /> <span>Declare Batsman</span>
              </button>
            </>
          )}

          <button
            className="btn btn-secondary live-action-btn"
            onClick={() => onViewScorecard(matchId)}
          >
            <FileText size={15} /> <span>View Scorecard</span>
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
          {canScore ? (
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
          ) : (
            <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Waiting for the Umpire to start 2nd Innings...</p>
          )}
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
              onSwapStrikeClick={canScore ? handleQuickSwapStrike : null}
              onChangeBatsmenClick={canScore ? handleOpenChangeBatsmenModal : null}
            />
            <BowlingScore
              bowlerStats={bowlerStats}
              onSwitchBowlerClick={canScore ? handleOpenBowlerModal : null}
            />
          </div>

          {/* Current Over Balls */}
          <CurrentOver
            currentOverBalls={currentInningsData?.currentOverBalls || []}
            overNumber={Math.floor((currentInningsData?.legalBalls || 0) / 6)}
          />

          {/* Over complete alert prompt for Umpire */}
          {currentInningsData?.pendingNewBowler && canScore && (
            <div className="alert-box alert-success" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Over complete (6 legal balls)! Please select the bowler for the next over.</span>
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={handleOpenBowlerModal}
              >
                Select Next Bowler
              </button>
            </div>
          )}

          {/* Large Scoring Buttons (VISIBLE ONLY TO CREATOR UMPIRE) */}
          {canScore ? (
            <ScoreButtons
              onRun={handleRun}
              onWide={handleWide}
              onNoBall={handleNoBall}
              onWicketClick={() => {
                setDismissalType('Wicket');
                setDismissedTarget('striker');
                setWicketRuns(0);
                if (availableBatsmen.length > 0) {
                  setNewBatsmanId(availableBatsmen[0].id);
                } else {
                  setNewBatsmanId('');
                }
                setShowWicketModal(true);
              }}
              onUndo={handleUndo}
              canUndo={canUndo}
              disabled={currentInningsData?.isInningsCompleted || isMatchCompleted || currentInningsData?.pendingNewBowler}
            />
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Scoring controls are disabled in spectator mode. Only the creator umpire can score this match.
            </div>
          )}
        </>
      )}


      {/* Wicket Modal */}
      {showWicketModal && canScore && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title" style={{ color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} /> Wicket Fallen!
            </h3>

            {/* Dismissal Type Selector: Just Wicket or Run Out */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Dismissal Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setDismissalType('Wicket')}
                  style={{
                    padding: '10px 8px',
                    fontSize: '0.85rem',
                    fontWeight: dismissalType !== 'Run Out' ? 700 : 500,
                    borderRadius: 'var(--radius-sm)',
                    border: `1.5px solid ${dismissalType !== 'Run Out' ? 'var(--accent-red)' : 'var(--border-color)'}`,
                    background: dismissalType !== 'Run Out' ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-surface-elevated)',
                    color: dismissalType !== 'Run Out' ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Wicket
                </button>
                <button
                  type="button"
                  onClick={() => setDismissalType('Run Out')}
                  style={{
                    padding: '10px 8px',
                    fontSize: '0.85rem',
                    fontWeight: dismissalType === 'Run Out' ? 700 : 500,
                    borderRadius: 'var(--radius-sm)',
                    border: `1.5px solid ${dismissalType === 'Run Out' ? 'var(--accent-red)' : 'var(--border-color)'}`,
                    background: dismissalType === 'Run Out' ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-surface-elevated)',
                    color: dismissalType === 'Run Out' ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Run Out
                </button>
              </div>
            </div>

            {/* Run Out Specific Options: Who was run out and how many runs completed */}
            {dismissalType === 'Run Out' ? (
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ color: '#fca5a5' }}>Who was Run Out?</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div
                      onClick={() => setDismissedTarget('striker')}
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        border: `2px solid ${dismissedTarget === 'striker' ? 'var(--accent-red)' : 'var(--border-color)'}`,
                        background: dismissedTarget === 'striker' ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-surface)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', color: 'var(--accent-yellow)', fontWeight: 700 }}>★ STRIKER</div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', marginTop: '2px' }}>
                        {strikerStats?.name || 'Striker'}
                      </div>
                    </div>

                    <div
                      onClick={() => setDismissedTarget('nonStriker')}
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        border: `2px solid ${dismissedTarget === 'nonStriker' ? 'var(--accent-red)' : 'var(--border-color)'}`,
                        background: dismissedTarget === 'nonStriker' ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-surface)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>NON-STRIKER</div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', marginTop: '2px' }}>
                        {nonStrikerStats?.name || 'Non-Striker'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: '#fca5a5' }}>
                    Runs Completed on this delivery ({wicketRuns} {wicketRuns === 1 ? 'run' : 'runs'})
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {[0, 1, 2, 3].map((r) => {
                      const isSel = wicketRuns === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setWicketRuns(r)}
                          style={{
                            padding: '6px 0',
                            fontSize: '0.85rem',
                            fontWeight: isSel ? 700 : 500,
                            borderRadius: 'var(--radius-sm)',
                            border: `1px solid ${isSel ? 'var(--accent-green)' : 'var(--border-color)'}`,
                            background: isSel ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-surface)',
                            color: isSel ? 'var(--accent-green)' : 'var(--text-primary)',
                            cursor: 'pointer'
                          }}
                        >
                          {r} {r === 1 ? 'Run' : 'Runs'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '14px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Dismissed Batsman: <strong style={{ color: '#fff' }}>{strikerStats?.name || 'Striker'}</strong>
              </div>
            )}

            {/* Incoming Batsman */}
            {availableBatsmen.length > 0 ? (
              <div className="form-group">
                <label className="form-label">Incoming Replacement Batsman</label>
                <select
                  className="form-select"
                  value={newBatsmanId}
                  onChange={(e) => setNewBatsmanId(e.target.value)}
                  required
                >
                  <option value="">-- Choose incoming batsman --</option>
                  {availableBatsmen.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="alert-box alert-error">
                <span>All available batsmen in the team have been dismissed (All Out)!</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={handleConfirmWicket}
                disabled={availableBatsmen.length > 0 && !newBatsmanId}
              >
                {dismissalType === 'Run Out' && wicketRuns > 0
                  ? `Confirm Run Out (+${wicketRuns} Runs)`
                  : 'Confirm Wicket'}
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

      {/* Next Bowler Modal (Automatic after 6 legal deliveries) */}
      {showBowlerModal && canScore && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">
              {currentInningsData?.pendingNewBowler ? 'Over Completed - Select Next Bowler' : 'Change Bowler'}
            </h3>
            <p className="modal-desc">
              {bowlerStats?.name && (
                <span>Previous over bowled by <strong>{bowlerStats.name}</strong>. </span>
              )}
              Select the bowler for the next over:
            </p>

            <div className="form-group">
              <label className="form-label">Eligible Bowlers ({activeBowlingTeam?.name})</label>
              <select
                className="form-select"
                value={newBowlerId}
                onChange={(e) => setNewBowlerId(e.target.value)}
              >
                <option value="">-- Select next bowler --</option>
                {eligibleNextBowlers.map((p) => (
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
                Continue Over
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

      {/* Declare Batsman Modal */}
      {showDeclareModal && canScore && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">Declare Batsman (Retired)</h3>
            <p className="modal-desc">
              Choose which currently batting player to declare out, and select their replacement from remaining team members:
            </p>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">1. Choose Active Batsman to Declare</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div
                  onClick={() => setDeclareTarget('striker')}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${declareTarget === 'striker' ? 'var(--accent-red)' : 'var(--border-color)'}`,
                    background: declareTarget === 'striker' ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-surface-elevated)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-yellow)' }}>
                      ★ STRIKER
                    </span>
                    {declareTarget === 'striker' && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-red)', fontWeight: 700 }}>
                        DECLARE
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                    {strikerStats?.name || 'Striker'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {strikerStats?.runs || 0} ({strikerStats?.balls || 0} balls)
                  </div>
                </div>

                <div
                  onClick={() => setDeclareTarget('nonStriker')}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${declareTarget === 'nonStriker' ? 'var(--accent-red)' : 'var(--border-color)'}`,
                    background: declareTarget === 'nonStriker' ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-surface-elevated)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      NON-STRIKER
                    </span>
                    {declareTarget === 'nonStriker' && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-red)', fontWeight: 700 }}>
                        DECLARE
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                    {nonStrikerStats?.name || 'Non-Striker'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {nonStrikerStats?.runs || 0} ({nonStrikerStats?.balls || 0} balls)
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">2. Select Replacement Batsman</label>
              {availableBatsmen.length === 0 ? (
                <div className="alert-box alert-error" style={{ marginBottom: 0 }}>
                  <AlertCircle size={16} />
                  <span>No remaining players left in the batting team squad to replace this batsman.</span>
                </div>
              ) : (
                <select
                  className="form-select"
                  value={declareReplacementId}
                  onChange={(e) => setDeclareReplacementId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Incoming Batsman --</option>
                  {availableBatsmen.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, background: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}
                onClick={handleConfirmDeclareBatsman}
                disabled={!declareReplacementId || availableBatsmen.length === 0}
              >
                Confirm Batsman Declaration
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeclareModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Batsmen (Striker & Non-Striker) Modal */}
      {showChangeBatsmenModal && canScore && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="var(--accent-cyan)" />
              Change Active Batsmen
            </h3>
            <p className="modal-desc">
              Manually set or swap who is on strike (★ Striker) and at the non-striker end. Select from any non-dismissed batsman in {activeBattingTeam?.name}.
            </p>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">
                <span style={{ color: 'var(--accent-yellow)', fontWeight: 700 }}>★ Striker</span> (Facing delivery)
              </label>
              <select
                className="form-select"
                value={manualStrikerId}
                onChange={(e) => setManualStrikerId(e.target.value)}
                required
              >
                <option value="">-- Choose Striker --</option>
                {nonOutBattingSquad.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === manualNonStrikerId}>
                    {p.name} {p.id === currentInningsData?.strikerId ? '(Current Striker)' : p.id === currentInningsData?.nonStrikerId ? '(Current Non-Striker)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Non-Striker (Running end)</label>
              <select
                className="form-select"
                value={manualNonStrikerId}
                onChange={(e) => setManualNonStrikerId(e.target.value)}
                required
              >
                <option value="">-- Choose Non-Striker --</option>
                {nonOutBattingSquad.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === manualStrikerId}>
                    {p.name} {p.id === currentInningsData?.nonStrikerId ? '(Current Non-Striker)' : p.id === currentInningsData?.strikerId ? '(Current Striker)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  const s = manualStrikerId;
                  const ns = manualNonStrikerId;
                  setManualStrikerId(ns);
                  setManualNonStrikerId(s);
                }}
              >
                ⇄ Swap Ends
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1.5 }}
                onClick={handleConfirmChangeBatsmen}
                disabled={!manualStrikerId || !manualNonStrikerId || manualStrikerId === manualNonStrikerId}
              >
                Confirm Batsmen
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowChangeBatsmenModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start 2nd Innings Modal */}
      {showSecondInningsModal && canScore && (
        <div className="modal-overlay">

          <div className="modal-card">
            <h3 className="modal-title">Setup 2nd Innings</h3>
            <p className="modal-desc">
              {secondBattingTeam?.name} chasing target of <strong>{(innings1?.score || 0) + 1}</strong>
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
