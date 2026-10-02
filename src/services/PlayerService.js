import { storageProvider } from '../storage/storageFactory.js';
import { generateId } from '../utils/ids.js';
import { authService } from './AuthService.js';

export class PlayerService {
  constructor(provider = storageProvider) {
    this.provider = provider;
  }

  async getPlayers() {
    return await this.provider.getPlayers();
  }

  async getPlayer(playerId) {
    return await this.provider.getPlayer(playerId);
  }

  async createPlayer(name) {
    authService.requireUmpire('create players');

    const trimmed = (name || '').trim();
    if (!trimmed) {
      throw new Error('Player name is required.');
    }

    // Case-insensitive duplicate check
    const existing = await this.provider.getPlayers();
    const isDuplicate = existing.some(
      p => p.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      throw new Error(`A player named "${trimmed}" already exists.`);
    }

    const now = new Date().toISOString();
    const newPlayer = {
      id: generateId('player'),
      name: trimmed,
      createdAt: now,
      updatedAt: now
    };

    return await this.provider.createPlayer(newPlayer);
  }

  async updatePlayer(playerId, newName) {
    authService.requireUmpire('edit players');

    const trimmed = (newName || '').trim();
    if (!trimmed) {
      throw new Error('Player name is required.');
    }

    const existingPlayer = await this.provider.getPlayer(playerId);
    if (!existingPlayer) {
      throw new Error('Player not found.');
    }

    // Check duplicate against other players
    const allPlayers = await this.provider.getPlayers();
    const isDuplicate = allPlayers.some(
      p => p.id !== playerId && p.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      throw new Error(`Another player named "${trimmed}" already exists.`);
    }

    const updated = {
      ...existingPlayer,
      name: trimmed,
      updatedAt: new Date().toISOString()
    };

    return await this.provider.updatePlayer(updated);
  }

  async deletePlayer(playerId) {
    authService.requireUmpire('delete players');
    return await this.provider.deletePlayer(playerId);
  }
}

export const playerService = new PlayerService();
