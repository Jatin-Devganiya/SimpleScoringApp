import React, { useState, useEffect } from 'react';
import { scoringService } from '../services/ScoringService';
import Scorecard from '../components/Scorecard';
import { ArrowLeft, Play, Trophy } from 'lucide-react';

export default function ScorecardPage({ matchId, onBack, onResumeLive }) {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchState() {
      try {
        setLoading(true);
        const data = await scoringService.getCompleteMatchState(matchId);
        setMatchData(data);
      } catch (err) {
        console.error('Failed to load scorecard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchState();
  }, [matchId]);

  if (loading || !matchData) {
    return (
      <div className="card empty-state">
        <p>Loading match scorecard...</p>
      </div>
    );
  }

  const {
    match,
    innings1,
    innings2,
    matchResult,
    isMatchCompleted,
    firstBattingTeam,
    secondBattingTeam
  } = matchData;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button className="btn btn-secondary" onClick={onBack} style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Back to Matches
        </button>

        {!isMatchCompleted && onResumeLive && (
          <button className="btn btn-primary" onClick={() => onResumeLive(matchId)} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            <Play size={14} /> Resume Live Scoring
          </button>
        )}
      </div>

      <div className="card" style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
          {match.totalOvers} Overs Match
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
          {firstBattingTeam?.name} vs {secondBattingTeam?.name}
        </h2>

        {matchResult ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent-green)', fontWeight: 700, fontSize: '1.1rem', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 16px', borderRadius: 'var(--radius-full)' }}>
            <Trophy size={18} /> {matchResult}
          </div>
        ) : (
          <div style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
            Match In Progress
          </div>
        )}
      </div>

      {/* 1st Innings */}
      <Scorecard
        inningsData={innings1}
        battingTeamName={firstBattingTeam?.name || '1st Batting Team'}
        bowlingTeamName={secondBattingTeam?.name || '1st Bowling Team'}
        inningsTitle="1st Innings"
      />

      {/* 2nd Innings (if started) */}
      {innings2 ? (
        <Scorecard
          inningsData={innings2}
          battingTeamName={secondBattingTeam?.name || '2nd Batting Team'}
          bowlingTeamName={firstBattingTeam?.name || '2nd Bowling Team'}
          inningsTitle="2nd Innings"
        />
      ) : (
        <div className="card empty-state" style={{ padding: '24px' }}>
          <p style={{ color: 'var(--text-muted)' }}>Second innings has not commenced yet.</p>
        </div>
      )}
    </div>
  );
}
