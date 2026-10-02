import React, { useState, useEffect } from 'react';

export default function MatchForm({ teams = [], onStartMatch, onCancel }) {
  const [team1Id, setTeam1Id] = useState(teams[0]?.id || '');
  const [team2Id, setTeam2Id] = useState(teams[1]?.id || '');
  const [totalOvers, setTotalOvers] = useState(20);
  const [battingFirstTeamId, setBattingFirstTeamId] = useState('');

  const [openingStrikerId, setOpeningStrikerId] = useState('');
  const [openingNonStrikerId, setOpeningNonStrikerId] = useState('');
  const [openingBowlerId, setOpeningBowlerId] = useState('');

  const [error, setError] = useState('');

  // Selected team objects
  const team1 = teams.find(t => t.id === team1Id);
  const team2 = teams.find(t => t.id === team2Id);

  // Set default batting team when teams change
  useEffect(() => {
    if (!battingFirstTeamId && team1Id) {
      setBattingFirstTeamId(team1Id);
    }
  }, [team1Id, battingFirstTeamId]);

  const battingTeam = battingFirstTeamId === team1Id ? team1 : team2;
  const bowlingTeam = battingFirstTeamId === team1Id ? team2 : team1;

  // Auto-populate opening players when batting/bowling teams are resolved
  useEffect(() => {
    if (battingTeam?.players?.length >= 2) {
      setOpeningStrikerId(battingTeam.players[0].id);
      setOpeningNonStrikerId(battingTeam.players[1].id);
    }
    if (bowlingTeam?.players?.length >= 1) {
      setOpeningBowlerId(bowlingTeam.players[0].id);
    }
  }, [battingTeam, bowlingTeam]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!team1Id || !team2Id) {
      setError('Please select both teams.');
      return;
    }
    if (team1Id === team2Id) {
      setError('Please select two distinct teams.');
      return;
    }
    if (!battingTeam || (battingTeam.players || []).length < 2) {
      setError(`${battingTeam?.name || 'Batting team'} needs at least 2 players.`);
      return;
    }
    if (!bowlingTeam || (bowlingTeam.players || []).length < 1) {
      setError(`${bowlingTeam?.name || 'Bowling team'} needs at least 1 player.`);
      return;
    }
    if (openingStrikerId === openingNonStrikerId) {
      setError('Opening striker and non-striker must be different players.');
      return;
    }
    if (!openingBowlerId) {
      setError('Please select an opening bowler.');
      return;
    }

    setError('');
    onStartMatch({
      team1Id,
      team2Id,
      totalOvers: parseInt(totalOvers, 10),
      battingFirstTeamId,
      openingStrikerId,
      openingNonStrikerId,
      openingBowlerId
    });
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>
        Create & Start New Match
      </h3>

      {error && (
        <div className="alert-box alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Team Selection */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div className="form-group">
          <label className="form-label">Team 1</label>
          <select
            className="form-select"
            value={team1Id}
            onChange={(e) => setTeam1Id(e.target.value)}
            required
          >
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.players?.length || 0} players)</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Team 2</label>
          <select
            className="form-select"
            value={team2Id}
            onChange={(e) => setTeam2Id(e.target.value)}
            required
          >
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.players?.length || 0} players)</option>
            ))}
          </select>
        </div>
      </div>

      {/* Match Configuration */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div className="form-group">
          <label className="form-label">Total Overs</label>
          <select
            className="form-select"
            value={totalOvers}
            onChange={(e) => setTotalOvers(Number(e.target.value))}
          >
            <option value={5}>5 Overs</option>
            <option value={10}>10 Overs</option>
            <option value={15}>15 Overs</option>
            <option value={20}>20 Overs (T20)</option>
            <option value={50}>50 Overs (ODI)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Batting First</label>
          <select
            className="form-select"
            value={battingFirstTeamId}
            onChange={(e) => setBattingFirstTeamId(e.target.value)}
          >
            <option value={team1Id}>{team1?.name || 'Team 1'}</option>
            <option value={team2Id}>{team2?.name || 'Team 2'}</option>
          </select>
        </div>
      </div>

      <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '14px' }}>
          Opening Lineup ({battingTeam?.name} batting vs {bowlingTeam?.name} bowling)
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Opening Striker (★)</label>
            <select
              className="form-select"
              value={openingStrikerId}
              onChange={(e) => setOpeningStrikerId(e.target.value)}
              required
            >
              {battingTeam?.players?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Opening Non-Striker</label>
            <select
              className="form-select"
              value={openingNonStrikerId}
              onChange={(e) => setOpeningNonStrikerId(e.target.value)}
              required
            >
              {battingTeam?.players?.map(p => (
                <option key={p.id} value={p.id} disabled={p.id === openingStrikerId}>
                  {p.name} {p.id === openingStrikerId ? '(Selected as Striker)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Opening Bowler</label>
            <select
              className="form-select"
              value={openingBowlerId}
              onChange={(e) => setOpeningBowlerId(e.target.value)}
              required
            >
              {bowlingTeam?.players?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
          Start Live Match
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
