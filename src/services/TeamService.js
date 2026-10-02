import { storageProvider } from '../storage/storageFactory.js';
import { generateId } from '../utils/ids.js';
import { authService } from './AuthService.js';

export class TeamService {
  constructor(provider = storageProvider) {
    this.provider = provider;
  }

  /**
   * Helper to resolve team player objects from playerIds with backward compatibility
   * @param {Object} team 
   * @param {Array} allPlayers 
   * @returns {Object} team with resolved .players array
   */
  _resolveTeamPlayers(team, allPlayers = []) {
    if (!team) return null;
    const playerMap = new Map(allPlayers.map(p => [p.id, p]));

    // Resolve playerIds to player objects
    let resolvedPlayers = [];
    if (Array.isArray(team.playerIds) && team.playerIds.length > 0) {
      resolvedPlayers = team.playerIds
        .map(id => playerMap.get(id))
        .filter(Boolean);
    } else if (Array.isArray(team.players)) {
      // Backward compatibility for legacy teams
      resolvedPlayers = team.players;
    }

    return {
      ...team,
      playerIds: Array.isArray(team.playerIds) ? team.playerIds : resolvedPlayers.map(p => p.id),
      players: resolvedPlayers
    };
  }

  async getTeams() {
    const [rawTeams, allPlayers] = await Promise.all([
      this.provider.getTeams(),
      this.provider.getPlayers()
    ]);
    return rawTeams.map(t => this._resolveTeamPlayers(t, allPlayers));
  }

  async getTeam(teamId) {
    const [rawTeam, allPlayers] = await Promise.all([
      this.provider.getTeam(teamId),
      this.provider.getPlayers()
    ]);
    return this._resolveTeamPlayers(rawTeam, allPlayers);
  }

  async createTeam(name, playerIds = []) {
    const session = authService.requireUmpire('create teams');

    const trimmedName = (name || '').trim();
    if (!trimmedName) {
      throw new Error('Team name is required.');
    }

    // Validate player IDs against registered players
    const allPlayers = await this.provider.getPlayers();
    const validPlayerIdSet = new Set(allPlayers.map(p => p.id));
    const sanitizedPlayerIds = Array.from(new Set(playerIds.filter(id => validPlayerIdSet.has(id))));

    const now = new Date().toISOString();
    const newTeam = {
      id: generateId('team'),
      name: trimmedName,
      playerIds: sanitizedPlayerIds,
      createdBy: session.username,
      createdAt: now,
      updatedAt: now
    };

    const saved = await this.provider.createTeam(newTeam);
    return this._resolveTeamPlayers(saved, allPlayers);
  }

  async updateTeam(teamId, data) {
    const existing = await this.provider.getTeam(teamId);
    if (!existing) {
      throw new Error('Team not found');
    }

    // Only creator umpire can edit team
    authService.requireOwnership(existing, 'edit this team');

    const allPlayers = await this.provider.getPlayers();
    const validPlayerIdSet = new Set(allPlayers.map(p => p.id));

    let sanitizedPlayerIds = existing.playerIds || [];
    if (data.playerIds !== undefined) {
      sanitizedPlayerIds = Array.from(new Set(data.playerIds.filter(id => validPlayerIdSet.has(id))));
    }

    const updated = {
      ...existing,
      ...data,
      name: (data.name !== undefined ? data.name : existing.name).trim(),
      playerIds: sanitizedPlayerIds,
      updatedAt: new Date().toISOString()
    };

    const saved = await this.provider.updateTeam(updated);
    return this._resolveTeamPlayers(saved, allPlayers);
  }

  async deleteTeam(teamId) {
    const existing = await this.provider.getTeam(teamId);
    if (!existing) {
      throw new Error('Team not found');
    }

    // Only creator umpire can delete team
    authService.requireOwnership(existing, 'delete this team');

    return await this.provider.deleteTeam(teamId);
  }

}

export const teamService = new TeamService();
