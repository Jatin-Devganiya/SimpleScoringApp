import { storageProvider } from '../storage/storageFactory.js';
import { generateId } from '../utils/ids.js';
import { EVENT_TYPES, evaluateMatchState } from '../engines/scoringEngine.js';
import { teamService } from './TeamService.js';
import { authService } from './AuthService.js';

export class ScoringService {
  constructor(provider = storageProvider) {
    this.provider = provider;
  }

  async getEvents(matchId) {
    return await this.provider.getMatchEvents(matchId);
  }

  async recordRun(matchId, { runs, strikerId, nonStrikerId, bowlerId, inningsIndex = 0 }) {
    authService.requireUmpire('record runs');

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
    authService.requireUmpire('record wides');

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
    authService.requireUmpire('record no balls');

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
    runs = 0
  }) {
    authService.requireUmpire('record wickets');

    const events = await this.provider.getMatchEvents(matchId);
    const event = {
      id: generateId('event'),
      matchId,
      inningsIndex,
      sequence: events.length + 1,
      type: EVENT_TYPES.WICKET,
      runs,
      batRuns: 0,
      extraRuns: 0,
      legalBall: true,
      strikerId,
      nonStrikerId,
      bowlerId,
      dismissedPlayerId,
      newBatsmanId,
      timestamp: new Date().toISOString()
    };

    return await this.provider.saveMatchEvent(matchId, event);
  }

  async declareBatsmen(matchId, { strikerId, nonStrikerId, inningsIndex = 0 }) {
    authService.requireUmpire('declare batsmen');

    if (!strikerId || !nonStrikerId) {
      throw new Error('Both striker and non-striker must be selected.');
    }
    if (strikerId === nonStrikerId) {
      throw new Error('Striker and Non-Striker must be different players.');
    }

    const match = await this.provider.getMatch(matchId);
    if (!match) throw new Error('Match not found');

    const currentInnings = match.innings[inningsIndex];
    const updatedInningsList = [...match.innings];
    updatedInningsList[inningsIndex] = {
      ...currentInnings,
      strikerId,
      nonStrikerId
    };

    return await this.provider.updateMatch({
      ...match,
      innings: updatedInningsList
    });
  }

  async setNextBowler(matchId, { bowlerId, inningsIndex = 0 }) {
    authService.requireUmpire('change bowler');

    if (!bowlerId) {
      throw new Error('Please select a valid bowler.');
    }

    const match = await this.provider.getMatch(matchId);
    if (!match) throw new Error('Match not found');

    const currentInnings = match.innings[inningsIndex];
    const updatedInningsList = [...match.innings];
    updatedInningsList[inningsIndex] = {
      ...currentInnings,
      bowlerId
    };

    return await this.provider.updateMatch({
      ...match,
      innings: updatedInningsList
    });
  }

  async undoLastEvent(matchId) {
    authService.requireUmpire('undo deliveries');
    return await this.provider.deleteMatchEvent(matchId);
  }

  async getCompleteMatchState(matchId) {
    const match = await this.provider.getMatch(matchId);
    if (!match) return null;

    const [team1, team2, events] = await Promise.all([
      teamService.getTeam(match.team1Id),
      teamService.getTeam(match.team2Id),
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
