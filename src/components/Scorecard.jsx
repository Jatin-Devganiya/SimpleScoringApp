import React from 'react';

export default function Scorecard({
  inningsData,
  battingTeamName,
  bowlingTeamName,
  inningsTitle = '1st Innings'
}) {
  if (!inningsData) return null;

  const batsmenList = Object.values(inningsData.batsmanStats || []);
  const bowlersList = Object.values(inningsData.bowlerStats || []).filter(b => b.legalBalls > 0 || b.runs > 0);

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
          {battingTeamName} ({inningsTitle})
        </h3>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-green)' }}>
          {inningsData.score}/{inningsData.wickets} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>({inningsData.overs} Ov)</span>
        </div>
      </div>

      {/* Batting Table */}
      <div className="table-responsive">
        <table className="scorecard-table">
          <thead>
            <tr>
              <th>Batter</th>
              <th>Dismissal</th>
              <th className="num">R</th>
              <th className="num">B</th>
              <th className="num">4s</th>
              <th className="num">6s</th>
              <th className="num">SR</th>
            </tr>
          </thead>
          <tbody>
            {batsmenList.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No batting data</td>
              </tr>
            ) : (
              batsmenList.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600, color: b.isOut ? 'var(--text-secondary)' : '#fff' }}>
                    {b.name} {!b.isOut && <span style={{ color: 'var(--accent-gold)' }}>*</span>}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {b.dismissalText || (b.isOut ? 'out' : 'not out')}
                  </td>
                  <td className="num" style={{ fontWeight: 700, color: '#fff' }}>{b.runs}</td>
                  <td className="num">{b.balls}</td>
                  <td className="num" style={{ color: 'var(--accent-blue)' }}>{b.fours}</td>
                  <td className="num" style={{ color: 'var(--accent-green)' }}>{b.sixes}</td>
                  <td className="num" style={{ color: 'var(--text-secondary)' }}>{b.strikeRate}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Extras & Total line */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.85rem' }}>
        <span>Extras: <strong>{inningsData.extras?.total || 0}</strong> (wd {inningsData.extras?.wides || 0}, nb {inningsData.extras?.noBalls || 0})</span>
        <span>Run Rate: <strong>{inningsData.currentRunRate || '0.00'}</strong></span>
      </div>

      {/* Bowling Table */}
      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
        Bowling ({bowlingTeamName})
      </h4>
      <div className="table-responsive">
        <table className="scorecard-table">
          <thead>
            <tr>
              <th>Bowler</th>
              <th className="num">O</th>
              <th className="num">R</th>
              <th className="num">W</th>
              <th className="num">Econ</th>
            </tr>
          </thead>
          <tbody>
            {bowlersList.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No bowling data yet</td>
              </tr>
            ) : (
              bowlersList.map((bowl) => (
                <tr key={bowl.id}>
                  <td style={{ fontWeight: 600 }}>{bowl.name}</td>
                  <td className="num">{bowl.overs}</td>
                  <td className="num" style={{ fontWeight: 700 }}>{bowl.runs}</td>
                  <td className="num" style={{ fontWeight: 700, color: 'var(--accent-red)' }}>{bowl.wickets}</td>
                  <td className="num" style={{ color: 'var(--text-secondary)' }}>{bowl.economy}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
