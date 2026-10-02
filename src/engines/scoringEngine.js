import { formatOvers, calculateStrikeRate, calculateEconomy, calculateRunRate, calculateRequiredRunRate } from '../utils/formatters.js';

/**
 * Pure Cricket Scoring Engine
 * 
 * Reconstructs accurate cricket state from events.
 * Fully decoupled from storage and UI.
 */

export const EVENT_TYPES = {
  RUN: 'RUN',
  WIDE: 'WIDE',
  NO_BALL: 'NO_BALL',
  WICKET: 'WICKET'
};

/**
 * Reconstructs innings state from list of scoring events
 * 
 * @param {Object} options
 * @param {Array} options.events - Chronological array of match events
 * @param {Array} options.battingPlayers - Array of player objects for batting team
 * @param {Array} options.bowlingPlayers - Array of player objects for bowling team
 * @param {number} options.totalOvers - Scheduled overs for the match
 * @param {string} options.openingStrikerId - Initial striker ID
 * @param {string} options.openingNonStrikerId - Initial non-striker ID
 * @param {string} options.openingBowlerId - Initial bowler ID
 * @param {number|null} options.targetRuns - Target runs if 2nd innings
 * @returns {Object} Full reconstructed innings state
 */
export function reconstructInnings({
  events = [],
  battingPlayers = [],
  bowlingPlayers = [],
  totalOvers = 20,
  openingStrikerId,
  openingNonStrikerId,
  openingBowlerId,
  targetRuns = null
}) {
  const maxLegalBalls = totalOvers * 6;
  const battingPlayerMap = new Map(battingPlayers.map(p => [p.id, p]));
  const bowlingPlayerMap = new Map(bowlingPlayers.map(p => [p.id, p]));

  // Initialize batsmen stats
  const batsmanStats = {};
  battingPlayers.forEach(p => {
    batsmanStats[p.id] = {
      id: p.id,
      name: p.name,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      dismissalText: 'not out',
      strikeRate: '0.00'
    };
  });

  // Initialize bowler stats
  const bowlerStats = {};
  bowlingPlayers.forEach(p => {
    bowlerStats[p.id] = {
      id: p.id,
      name: p.name,
      legalBalls: 0,
      overs: '0.0',
      runs: 0,
      wickets: 0,
      economy: '0.00'
    };
  });

  let totalRuns = 0;
  let wickets = 0;
  let legalBalls = 0;
  let extras = {
    total: 0,
    wides: 0,
    noBalls: 0
  };

  let strikerId = openingStrikerId || (battingPlayers[0] ? battingPlayers[0].id : null);
  let nonStrikerId = openingNonStrikerId || (battingPlayers[1] ? battingPlayers[1].id : null);
  let currentBowlerId = openingBowlerId || (bowlingPlayers[0] ? bowlingPlayers[0].id : null);

  let currentOverBalls = [];
  const completedOversList = [];
  let isOverComplete = false;
  let pendingNewBowler = false;

  // Process all events sequentially
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];

    // If an event specifies bowler changes or striker selections, update them
    if (ev.bowlerId) currentBowlerId = ev.bowlerId;
    if (ev.strikerId) strikerId = ev.strikerId;
    if (ev.nonStrikerId) nonStrikerId = ev.nonStrikerId;

    const bStats = batsmanStats[strikerId];
    let bowlStats = bowlerStats[currentBowlerId];
    if (!bowlStats && currentBowlerId) {
      bowlStats = {
        id: currentBowlerId,
        name: bowlingPlayerMap.get(currentBowlerId)?.name || 'Bowler',
        legalBalls: 0,
        overs: '0.0',
        runs: 0,
        wickets: 0,
        economy: '0.00'
      };
      bowlerStats[currentBowlerId] = bowlStats;
    }

    if (ev.type === EVENT_TYPES.RUN) {
      const batRuns = ev.runs || 0;
      totalRuns += batRuns;

      if (bStats) {
        bStats.runs += batRuns;
        bStats.balls += 1;
        if (batRuns === 4) bStats.fours += 1;
        if (batRuns === 6) bStats.sixes += 1;
      }

      if (bowlStats) {
        bowlStats.runs += batRuns;
        bowlStats.legalBalls += 1;
      }

      legalBalls += 1;
      currentOverBalls.push(batRuns.toString());

      // Strike rotation on odd runs
      if (batRuns % 2 === 1) {
        const temp = strikerId;
        strikerId = nonStrikerId;
        nonStrikerId = temp;
      }
    } else if (ev.type === EVENT_TYPES.WIDE) {
      const wideRuns = (ev.extraRuns !== undefined ? ev.extraRuns : 1) + (ev.batRuns || 0);
      totalRuns += wideRuns;
      extras.wides += wideRuns;
      extras.total += wideRuns;

      if (bowlStats) {
        bowlStats.runs += wideRuns;
      }

      currentOverBalls.push(wideRuns > 1 ? `${wideRuns}Wd` : 'Wd');

      // If additional runs were run on wide and odd, swap ends
      if ((ev.batRuns || 0) % 2 === 1) {
        const temp = strikerId;
        strikerId = nonStrikerId;
        nonStrikerId = temp;
      }
    } else if (ev.type === EVENT_TYPES.NO_BALL) {
      const nbExtra = ev.extraRuns !== undefined ? ev.extraRuns : 1;
      const batRuns = ev.batRuns || 0;
      const eventTotal = nbExtra + batRuns;

      totalRuns += eventTotal;
      extras.noBalls += nbExtra;
      extras.total += nbExtra;

      if (bStats) {
        bStats.runs += batRuns;
        bStats.balls += 1;
        if (batRuns === 4) bStats.fours += 1;
        if (batRuns === 6) bStats.sixes += 1;
      }

      if (bowlStats) {
        bowlStats.runs += eventTotal;
      }

      currentOverBalls.push(batRuns > 0 ? `${nbExtra + batRuns}Nb` : 'Nb');

      // Strike rotation if bat runs on no-ball was odd
      if (batRuns % 2 === 1) {
        const temp = strikerId;
        strikerId = nonStrikerId;
        nonStrikerId = temp;
      }
    } else if (ev.type === EVENT_TYPES.WICKET) {
      const dismissedId = ev.dismissedPlayerId || strikerId;
      totalRuns += (ev.runs || 0);
      wickets += 1;
      legalBalls += 1;

      const outBatsmanStats = batsmanStats[dismissedId];
      if (outBatsmanStats) {
        outBatsmanStats.isOut = true;
        outBatsmanStats.balls += 1;
        outBatsmanStats.dismissalText = `b ${bowlStats?.name || 'Bowler'}`;
      }

      if (bowlStats) {
        bowlStats.legalBalls += 1;
        bowlStats.wickets += 1;
        bowlStats.runs += (ev.runs || 0);
      }

      currentOverBalls.push('W');

      // Set new batsman
      if (ev.newBatsmanId) {
        if (dismissedId === strikerId) {
          strikerId = ev.newBatsmanId;
        } else if (dismissedId === nonStrikerId) {
          nonStrikerId = ev.newBatsmanId;
        }
      }
    }

    // End of over check
    if (ev.legalBall) {
      if (legalBalls % 6 === 0) {
        completedOversList.push([...currentOverBalls]);
        currentOverBalls = [];

        // Strike swap at end of over
        const temp = strikerId;
        strikerId = nonStrikerId;
        nonStrikerId = temp;

        isOverComplete = true;
        pendingNewBowler = true;
      } else {
        isOverComplete = false;
        pendingNewBowler = false;
      }
    }
  }

  // Recalculate strike rates and economies
  Object.values(batsmanStats).forEach(b => {
    b.strikeRate = calculateStrikeRate(b.runs, b.balls);
  });

  Object.values(bowlerStats).forEach(bowler => {
    bowler.overs = formatOvers(bowler.legalBalls);
    bowler.economy = calculateEconomy(bowler.runs, bowler.legalBalls);
  });

  // Calculate run rate
  const currentRunRate = calculateRunRate(totalRuns, legalBalls);

  // Check completion conditions
  const maxWickets = Math.max(1, battingPlayers.length - 1);
  const isAllOut = wickets >= maxWickets;
  const isOversFinished = legalBalls >= maxLegalBalls;
  const isTargetAchieved = targetRuns !== null && totalRuns >= targetRuns;

  const isInningsCompleted = isAllOut || isOversFinished || isTargetAchieved;

  let rrr = null;
  let remainingRuns = null;
  let remainingBalls = null;
  if (targetRuns !== null) {
    remainingRuns = Math.max(0, targetRuns - totalRuns);
    remainingBalls = Math.max(0, maxLegalBalls - legalBalls);
    rrr = calculateRequiredRunRate(targetRuns, totalRuns, totalOvers, legalBalls);
  }

  return {
    score: totalRuns,
    wickets,
    legalBalls,
    overs: formatOvers(legalBalls),
    maxOvers: totalOvers,
    extras,
    batsmanStats,
    bowlerStats,
    strikerId,
    nonStrikerId,
    currentBowlerId,
    currentOverBalls,
    completedOversList,
    isOverComplete: isOverComplete && !isInningsCompleted,
    pendingNewBowler: pendingNewBowler && !isInningsCompleted,
    currentRunRate,
    targetRuns,
    remainingRuns,
    remainingBalls,
    requiredRunRate: rrr,
    isAllOut,
    isOversFinished,
    isTargetAchieved,
    isInningsCompleted
  };
}

/**
 * Evaluates entire match status across both innings
 * 
 * @param {Object} match
 * @param {Array} events
 * @param {Object} team1
 * @param {Object} team2
 * @returns {Object}
 */
export function evaluateMatchState(match, events = [], team1, team2) {
  if (!match) return null;

  const team1BattingFirst = match.battingFirstTeamId === match.team1Id;
  const firstBattingTeam = team1BattingFirst ? team1 : team2;
  const secondBattingTeam = team1BattingFirst ? team2 : team1;

  const innings1Events = events.filter(e => e.inningsIndex === 0 || !e.inningsIndex);
  const innings2Events = events.filter(e => e.inningsIndex === 1);

  const innings1 = reconstructInnings({
    events: innings1Events,
    battingPlayers: firstBattingTeam?.players || [],
    bowlingPlayers: secondBattingTeam?.players || [],
    totalOvers: match.totalOvers || 20,
    openingStrikerId: match.innings?.[0]?.strikerId,
    openingNonStrikerId: match.innings?.[0]?.nonStrikerId,
    openingBowlerId: match.innings?.[0]?.bowlerId,
    targetRuns: null
  });

  const targetRuns = innings1.isInningsCompleted ? innings1.score + 1 : null;

  let innings2 = null;
  if (match.currentInningsIndex === 1 || match.innings?.length > 1) {
    innings2 = reconstructInnings({
      events: innings2Events,
      battingPlayers: secondBattingTeam?.players || [],
      bowlingPlayers: firstBattingTeam?.players || [],
      totalOvers: match.totalOvers || 20,
      openingStrikerId: match.innings?.[1]?.strikerId,
      openingNonStrikerId: match.innings?.[1]?.nonStrikerId,
      openingBowlerId: match.innings?.[1]?.bowlerId,
      targetRuns: targetRuns
    });
  }

  let matchResult = null;
  let isMatchCompleted = false;

  if (innings2 && innings2.isInningsCompleted) {
    isMatchCompleted = true;
    if (innings2.score >= (targetRuns || 0)) {
      const wicketsRemaining = Math.max(0, (secondBattingTeam?.players?.length || 11) - 1 - innings2.wickets);
      matchResult = `${secondBattingTeam?.name} won by ${wicketsRemaining} wicket${wicketsRemaining === 1 ? '' : 's'}`;
    } else if (innings2.score === innings1.score) {
      matchResult = 'Match Tied';
    } else {
      const runsMargin = innings1.score - innings2.score;
      matchResult = `${firstBattingTeam?.name} won by ${runsMargin} run${runsMargin === 1 ? '' : 's'}`;
    }
  }

  return {
    innings1,
    innings2,
    targetRuns,
    isMatchCompleted,
    matchResult,
    firstBattingTeam,
    secondBattingTeam
  };
}
