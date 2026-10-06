import { storageProvider } from '../storage/storageFactory.js';
import { generateId } from '../utils/ids.js';
import { EVENT_TYPES, evaluateMatchState } from '../engines/scoringEngine.js';
import { teamService, TeamService } from './TeamService.js';
import { authService } from './AuthService.js';

export class ScoringService {
  constructor(provider = storageProvider, teamSvc = null) {
    this.provider = provider;
    this.teamService = teamSvc || (provider === storageProvider ? teamService : new TeamService(provider));
  }

  async getEvents(matchId) {
    return await this.provider.getMatchEvents(matchId);
  }

  async _verifyScorerOwnership(matchId) {
    const match = await this.provider.getMatch(matchId);
    if (!match) throw new Error('Match not found.');
    authService.requireOwnership(match, 'score this match');
    return match;
  }

  async recordRun(matchId, { runs, strikerId, nonStrikerId, bowlerId, inningsIndex = 0 }) {
    await this._verifyScorerOwnership(matchId);

    const events = await this.provider.getMatchEvents(matchId);
    const event = {
      id: generateId('event'),
      matchId,
      inningsIndex,
      sequence: events.length + 1,
      type: EVENT_TYPES.RUN,
      runs: parseInt(runs, 10),
      batRuns: parseInt(runs, 10),
      extraRuns: 0,
      legalBall: true,
      strikerId,
      nonStrikerId,
      bowlerId,
      timestamp: new Date().toISOString()
    };

    return await this.provider.saveMatchEvent(matchId, event);
  }

  async recordWide(matchId, { extraRuns = 1, batRuns = 0, strikerId, nonStrikerId, bowlerId, inningsIndex = 0 }) {
    await this._verifyScorerOwnership(matchId);


    const events = await this.provider.getMatchEvents(matchId);
    const totalRuns = extraRuns + batRuns;
    const event = {
      id: generateId('event'),
      matchId,
      inningsIndex,
      sequence: events.length + 1,
      type: EVENT_TYPES.WIDE,
      runs: totalRuns,
      batRuns,
      extraRuns,
      legalBall: false,
      strikerId,
      nonStrikerId,
      bowlerId,
      timestamp: new Date().toISOString()
    };

    return await this.provider.saveMatchEvent(matchId, event);
  }

  async recordNoBall(matchId, { batRuns = 0, extraRuns = 1, strikerId, nonStrikerId, bowlerId, inningsIndex = 0 }) {
    await this._verifyScorerOwnership(matchId);

    const events = await this.provider.getMatchEvents(matchId);
    const totalRuns = extraRuns + batRuns;
    const event = {
      id: generateId('event'),
      matchId,
      inningsIndex,
      sequence: events.length + 1,
      type: EVENT_TYPES.NO_BALL,
      runs: totalRuns,
      batRuns,
      extraRuns,
      legalBall: false,
      strikerId,
      nonStrikerId,
      bowlerId,
      timestamp: new Date().toISOString()
    };

    return await this.provider.saveMatchEvent(matchId, event);
  }

  async recordWicket(matchId, {
    dismissedPlayerId,
    newBatsmanId,
    strikerId,
    nonStrikerId,
    bowlerId,
    inningsIndex = 0,
    runs = 0,
    dismissalType = 'Bowled',
    isBowlerWicket = true
  }) {
    await this._verifyScorerOwnership(matchId);

    const parsedRuns = Number(runs) || 0;
    const events = await this.provider.getMatchEvents(matchId);
    const event = {
      id: generateId('event'),
      matchId,
      inningsIndex,
      sequence: events.length + 1,
      type: EVENT_TYPES.WICKET,
      runs: parsedRuns,
      batRuns: parsedRuns,
      extraRuns: 0,
      legalBall: true,
      strikerId,
      nonStrikerId,
      bowlerId,
      dismissedPlayerId,
      newBatsmanId,
      dismissalType,
      isBowlerWicket: dismissalType === 'Run Out' ? false : isBowlerWicket,
      timestamp: new Date().toISOString()
    };

    return await this.provider.saveMatchEvent(matchId, event);
  }

  async declareBatsman(matchId, { declaredPlayerId, replacementPlayerId, inningsIndex = 0 }) {
    await this._verifyScorerOwnership(matchId);

    if (!declaredPlayerId) {
      throw new Error('Please select which batsman to declare.');
    }
    if (!replacementPlayerId) {
      throw new Error('Please select a replacement batsman.');
    }
    if (declaredPlayerId === replacementPlayerId) {
      throw new Error('Replacement batsman must be different from the declared batsman.');
    }

    const state = await this.getCompleteMatchState(matchId);
    const inningsData = inningsIndex === 0 ? state?.innings1 : state?.innings2;
    if (!inningsData) {
      throw new Error('Innings data could not be found.');
    }

    const currentStrikerId = inningsData.strikerId;
    const currentNonStrikerId = inningsData.nonStrikerId;

    if (declaredPlayerId !== currentStrikerId && declaredPlayerId !== currentNonStrikerId) {
      throw new Error('Declared batsman must be currently batting on strike or non-strike.');
    }

    const nextStrikerId = declaredPlayerId === currentStrikerId ? replacementPlayerId : currentStrikerId;
    const nextNonStrikerId = declaredPlayerId === currentNonStrikerId ? replacementPlayerId : currentNonStrikerId;

    const events = await this.provider.getMatchEvents(matchId);
    const event = {
      id: generateId('event'),
      matchId,
      inningsIndex,
      sequence: events.length + 1,
      type: EVENT_TYPES.DECLARE,
      declaredPlayerId,
      newBatsmanId: replacementPlayerId,
      strikerId: nextStrikerId,
      nonStrikerId: nextNonStrikerId,
      bowlerId: inningsData.currentBowlerId,
      runs: 0,
      legalBall: false,
      timestamp: new Date().toISOString()
    };

    return await this.provider.saveMatchEvent(matchId, event);
  }

  async setBatsmen(matchId, { strikerId, nonStrikerId, inningsIndex = 0 }) {
    const match = await this._verifyScorerOwnership(matchId);

    if (!strikerId || !nonStrikerId) {
      throw new Error('Both striker and non-striker must be selected.');
    }
    if (strikerId === nonStrikerId) {
      throw new Error('Striker and Non-Striker must be different players.');
    }

    const currentInnings = match.innings?.[inningsIndex] || {};
    const updatedInningsList = [...(match.innings || [])];
    updatedInningsList[inningsIndex] = {
      ...currentInnings,
      strikerId,
      nonStrikerId
    };

    await this.provider.updateMatch({
      ...match,
      innings: updatedInningsList
    });

    const events = await this.provider.getMatchEvents(matchId);
    const event = {
      id: generateId('event'),
      matchId,
      inningsIndex,
      sequence: events.length + 1,
      type: EVENT_TYPES.BATSMAN_CHANGE,
      strikerId,
      nonStrikerId,
      runs: 0,
      legalBall: false,
      timestamp: new Date().toISOString()
    };

    return await this.provider.saveMatchEvent(matchId, event);
  }

  async swapStrike(matchId, { inningsIndex = 0 }) {
    await this._verifyScorerOwnership(matchId);
    const state = await this.getCompleteMatchState(matchId);
    const inningsData = inningsIndex === 0 ? state?.innings1 : state?.innings2;
    if (!inningsData?.strikerId || !inningsData?.nonStrikerId) {
      throw new Error('Active batsmen not found.');
    }
    return await this.setBatsmen(matchId, {
      strikerId: inningsData.nonStrikerId,
      nonStrikerId: inningsData.strikerId,
      inningsIndex
    });
  }

  async declareBatsmen(matchId, options) {
    return await this.setBatsmen(matchId, options);
  }

  async setNextBowler(matchId, { bowlerId, inningsIndex = 0 }) {
    const match = await this._verifyScorerOwnership(matchId);

    if (!bowlerId) {
      throw new Error('Please select a valid bowler.');
    }

    const currentInnings = match.innings?.[inningsIndex] || {};
    const updatedInningsList = [...(match.innings || [])];
    updatedInningsList[inningsIndex] = {
      ...currentInnings,
      currentBowlerId: bowlerId,
      bowlerId: currentInnings.bowlerId || bowlerId
    };

    await this.provider.updateMatch({
      ...match,
      innings: updatedInningsList
    });

    const events = await this.provider.getMatchEvents(matchId);
    const event = {
      id: generateId('event'),
      matchId,
      inningsIndex,
      sequence: events.length + 1,
      type: EVENT_TYPES.BOWLER_CHANGE,
      bowlerId,
      runs: 0,
      legalBall: false,
      timestamp: new Date().toISOString()
    };

    return await this.provider.saveMatchEvent(matchId, event);
  }

  async undoLastEvent(matchId) {
    await this._verifyScorerOwnership(matchId);
    return await this.provider.deleteMatchEvent(matchId);
  }


  async getCompleteMatchState(matchId) {
    const match = await this.provider.getMatch(matchId);
    if (!match) return null;

    const [team1, team2, events] = await Promise.all([
      this.teamService.getTeam(match.team1Id),
      this.teamService.getTeam(match.team2Id),
      this.provider.getMatchEvents(matchId)
    ]);

    const state = evaluateMatchState(match, events, team1, team2);

    return {
      match,
      team1,
      team2,
      events,
      ...state
    };
  }
}

export const scoringService = new ScoringService();
