import { storageProvider } from '../storage/storageFactory';
import { generateId } from '../utils/ids';

export class TeamService {
  constructor(provider = storageProvider) {
    this.provider = provider;
  }

  async getTeams() {
    return await this.provider.getTeams();
  }

  async getTeam(teamId) {
    return await this.provider.getTeam(teamId);
  }

  async createTeam(name, playerNames = []) {
    const trimmedName = (name || '').trim();
    if (!trimmedName) {
      throw new Error('Team name is required.');
    }

    const players = playerNames
      .map(pName => (typeof pName === 'string' ? pName.trim() : pName?.name?.trim()))
      .filter(Boolean)
      .map(pName => ({
        id: generateId('player'),
        name: pName
      }));

    const newTeam = {
      id: generateId('team'),
      name: trimmedName,
      players,
      createdAt: new Date().toISOString()
    };

    return await this.provider.createTeam(newTeam);
  }

  async updateTeam(teamId, data) {
    const existing = await this.provider.getTeam(teamId);
    if (!existing) {
      throw new Error('Team not found');
    }

    const updated = {
      ...existing,
      ...data,
      name: (data.name || existing.name).trim(),
      updatedAt: new Date().toISOString()
    };

    return await this.provider.updateTeam(updated);
  }

  async deleteTeam(teamId) {
    return await this.provider.deleteTeam(teamId);
  }

  async addPlayer(teamId, playerName) {
    const trimmed = (playerName || '').trim();
    if (!trimmed) {
      throw new Error('Player name cannot be empty.');
    }

    const team = await this.provider.getTeam(teamId);
    if (!team) {
      throw new Error('Team not found.');
    }

    const newPlayer = {
      id: generateId('player'),
      name: trimmed
    };

    const updatedPlayers = [...(team.players || []), newPlayer];
    return await this.updateTeam(teamId, { players: updatedPlayers });
  }

  async updatePlayer(teamId, playerId, newName) {
    const trimmed = (newName || '').trim();
    if (!trimmed) {
      throw new Error('Player name cannot be empty.');
    }

    const team = await this.provider.getTeam(teamId);
    if (!team) {
      throw new Error('Team not found.');
    }

    const updatedPlayers = (team.players || []).map(p =>
      p.id === playerId ? { ...p, name: trimmed } : p
    );

    return await this.updateTeam(teamId, { players: updatedPlayers });
  }

  async deletePlayer(teamId, playerId) {
    const team = await this.provider.getTeam(teamId);
    if (!team) {
      throw new Error('Team not found.');
    }

    const updatedPlayers = (team.players || []).filter(p => p.id !== playerId);
    return await this.updateTeam(teamId, { players: updatedPlayers });
  }
}

export const teamService = new TeamService();
