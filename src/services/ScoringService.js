import { storageProvider } from '../storage/storageFactory';
import { generateId } from '../utils/ids';
import { EVENT_TYPES, reconstructInnings, evaluateMatchState } from '../engines/scoringEngine';

export class ScoringService {
  constructor(provider = storageProvider) {
    this.provider = provider;
  }

  async getEvents(matchId) {
    return await this.provider.getMatchEvents(matchId);
  }

  async recordRun(matchId, { runs, strikerId, nonStrikerId, bowlerId, inningsIndex = 0 }) {
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

  async undoLastEvent(matchId) {
    return await this.provider.deleteMatchEvent(matchId);
  }

  async getCompleteMatchState(matchId) {
    const match = await this.provider.getMatch(matchId);
    if (!match) return null;

    const [team1, team2, events] = await Promise.all([
      this.provider.getTeam(match.team1Id),
      this.provider.getTeam(match.team2Id),
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
