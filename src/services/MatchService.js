import { storageProvider } from '../storage/storageFactory.js';
import { generateId } from '../utils/ids.js';
import { authService } from './AuthService.js';

export class MatchService {
  constructor(provider = storageProvider) {
    this.provider = provider;
  }

  async getMatches() {
    return await this.provider.getMatches();
  }

  async getMatch(matchId) {
    return await this.provider.getMatch(matchId);
  }

  async createMatch({
    team1Id,
    team2Id,
    totalOvers = 20,
    battingFirstTeamId,
    openingStrikerId,
    openingNonStrikerId,
    openingBowlerId
  }) {
    authService.requireUmpire('create matches');

    if (!team1Id || !team2Id) {
      throw new Error('Both teams are required.');
    }
    if (team1Id === team2Id) {
      throw new Error('Cannot select the same team twice.');
    }
    if (!battingFirstTeamId) {
      throw new Error('Please select which team bats first.');
    }

    const bowlingFirstTeamId = battingFirstTeamId === team1Id ? team2Id : team1Id;
    const now = new Date().toISOString();
    const matchId = generateId('match');

    const firstInnings = {
      id: generateId('innings'),
      inningsIndex: 0,
      battingTeamId: battingFirstTeamId,
      bowlingTeamId: bowlingFirstTeamId,
      strikerId: openingStrikerId,
      nonStrikerId: openingNonStrikerId,
      bowlerId: openingBowlerId,
      completed: false,
      startedAt: now
    };

    const newMatch = {
      id: matchId,
      team1Id,
      team2Id,
      battingFirstTeamId,
      bowlingFirstTeamId,
      totalOvers: parseInt(totalOvers, 10) || 20,
      status: 'IN_PROGRESS',
      currentInningsIndex: 0,
      innings: [firstInnings],
      createdAt: now,
      updatedAt: now
    };

    return await this.provider.createMatch(newMatch);
  }

  async updateMatch(match) {
    authService.requireUmpire('update matches');
    return await this.provider.updateMatch(match);
  }

  async deleteMatch(matchId) {
    authService.requireUmpire('delete matches');
    return await this.provider.deleteMatch(matchId);
  }

  async startSecondInnings(matchId, { strikerId, nonStrikerId, bowlerId }) {
    authService.requireUmpire('start second innings');

    const match = await this.provider.getMatch(matchId);
    if (!match) {
      throw new Error('Match not found.');
    }

    const firstInnings = match.innings[0];
    const secondBattingTeamId = firstInnings.bowlingTeamId;
    const secondBowlingTeamId = firstInnings.battingTeamId;
    const now = new Date().toISOString();

    const secondInnings = {
      id: generateId('innings'),
      inningsIndex: 1,
      battingTeamId: secondBattingTeamId,
      bowlingTeamId: secondBowlingTeamId,
      strikerId,
      nonStrikerId,
      bowlerId,
      completed: false,
      startedAt: now
    };

    const updatedMatch = {
      ...match,
      currentInningsIndex: 1,
      innings: [
        { ...firstInnings, completed: true, completedAt: now },
        secondInnings
      ],
      updatedAt: now
    };

    return await this.provider.updateMatch(updatedMatch);
  }

  async completeMatch(matchId, matchResult) {
    authService.requireUmpire('complete matches');

    const match = await this.provider.getMatch(matchId);
    if (!match) return null;

    const now = new Date().toISOString();
    const updated = {
      ...match,
      status: 'COMPLETED',
      result: matchResult,
      completedAt: now,
      updatedAt: now
    };

    return await this.provider.updateMatch(updated);
  }
}

export const matchService = new MatchService();
