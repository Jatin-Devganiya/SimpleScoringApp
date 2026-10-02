import { StorageProvider } from './StorageProvider.js';
import { appConfig } from '../config/appConfig.js';
import { UMPIRE_LOCK_KEY } from '../config/authConfig.js';

/**
 * LocalStorage implementation of StorageProvider
 * Stores all players, teams, matches, match events, and umpire locks in browser localStorage.
 */
export class LocalStorageProvider extends StorageProvider {
  constructor() {
    super();
    this.storageKey = appConfig.STORAGE_KEY || 'cricket_app_data';
    this.listeners = new Map();
  }

  _readStore() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return this._getEmptyStore();
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return this._getEmptyStore();
      }
      return {
        version: parsed.version || 1,
        users: Array.isArray(parsed.users) ? parsed.users : [],
        players: Array.isArray(parsed.players) ? parsed.players : [],
        teams: Array.isArray(parsed.teams) ? parsed.teams : [],
        matches: Array.isArray(parsed.matches) ? parsed.matches : [],
        events: parsed.events && typeof parsed.events === 'object' ? parsed.events : {},
        activeUmpireSessions: parsed.activeUmpireSessions && typeof parsed.activeUmpireSessions === 'object' ? parsed.activeUmpireSessions : {},
        metadata: parsed.metadata || { lastUpdated: new Date().toISOString() }
      };
    } catch (err) {
      console.warn('Failed to parse localStorage data, initializing empty store:', err);
      return this._getEmptyStore();
    }
  }

  _writeStore(data) {
    try {
      const payload = {
        ...data,
        metadata: {
          ...(data.metadata || {}),
          lastUpdated: new Date().toISOString()
        }
      };
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
      this._notifyListeners();
      return true;
    } catch (err) {
      console.error('LocalStorage write failed (quota exceeded or disabled):', err);
      throw new Error('Storage write failed. Your browser storage might be full or private browsing may restrict storage.');
    }
  }

  _getEmptyStore() {
    return {
      version: appConfig.APP_VERSION || 1,
      users: [],
      players: [],
      teams: [],
      matches: [],
      events: {},
      activeUmpireSessions: {},
      metadata: {
        lastUpdated: new Date().toISOString()
      }
    };
  }


  _notifyListeners(matchId) {
    if (matchId && this.listeners.has(matchId)) {
      const callbacks = this.listeners.get(matchId);
      callbacks.forEach(cb => {
        try { cb(); } catch (e) { console.error('Listener callback error:', e); }
      });
    }
  }

  // --- Players Management ---
  async getPlayers() {
    const store = this._readStore();
    return store.players.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  async getPlayer(playerId) {
    const store = this._readStore();
    return store.players.find(p => p.id === playerId) || null;
  }

  async createPlayer(player) {
    const store = this._readStore();
    const now = new Date().toISOString();
    const newPlayer = {
      ...player,
      createdAt: player.createdAt || now,
      updatedAt: now
    };
    store.players.push(newPlayer);
    this._writeStore(store);
    return newPlayer;
  }

  async updatePlayer(player) {
    const store = this._readStore();
    const index = store.players.findIndex(p => p.id === player.id);
    if (index === -1) {
      throw new Error(`Player with id ${player.id} not found.`);
    }
    const updated = {
      ...store.players[index],
      ...player,
      updatedAt: new Date().toISOString()
    };
    store.players[index] = updated;
    this._writeStore(store);
    return updated;
  }

  async deletePlayer(playerId) {
    const store = this._readStore();
    store.players = store.players.filter(p => p.id !== playerId);
    // Also remove player from teams' playerIds
    store.teams.forEach(team => {
      if (Array.isArray(team.playerIds)) {
        team.playerIds = team.playerIds.filter(id => id !== playerId);
      }
    });
    this._writeStore(store);
    return true;
  }

  // --- Teams Management ---
  async getTeams() {
    const store = this._readStore();
    return store.teams;
  }

  async getTeam(teamId) {
    const store = this._readStore();
    return store.teams.find(t => t.id === teamId) || null;
  }

  async createTeam(team) {
    const store = this._readStore();
    const existingIndex = store.teams.findIndex(t => t.id === team.id);
    const now = new Date().toISOString();
    const newTeam = {
      ...team,
      playerIds: Array.isArray(team.playerIds) ? team.playerIds : [],
      createdAt: team.createdAt || now,
      updatedAt: now
    };

    if (existingIndex >= 0) {
      store.teams[existingIndex] = newTeam;
    } else {
      store.teams.push(newTeam);
    }

    this._writeStore(store);
    return newTeam;
  }

  async updateTeam(team) {
    const store = this._readStore();
    const index = store.teams.findIndex(t => t.id === team.id);
    if (index === -1) {
      throw new Error(`Team with id ${team.id} not found.`);
    }

    const updated = {
      ...store.teams[index],
      ...team,
      playerIds: Array.isArray(team.playerIds) ? team.playerIds : (store.teams[index].playerIds || []),
      updatedAt: new Date().toISOString()
    };
    store.teams[index] = updated;
    this._writeStore(store);
    return updated;
  }

  async deleteTeam(teamId) {
    const store = this._readStore();
    store.teams = store.teams.filter(t => t.id !== teamId);
    this._writeStore(store);
    return true;
  }

  // --- Matches Management ---
  async getMatches() {
    const store = this._readStore();
    return [...store.matches].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  async getMatch(matchId) {
    const store = this._readStore();
    return store.matches.find(m => m.id === matchId) || null;
  }

  async createMatch(match) {
    const store = this._readStore();
    const now = new Date().toISOString();
    const newMatch = {
      ...match,
      createdAt: match.createdAt || now,
      updatedAt: now
    };
    store.matches.push(newMatch);
    if (!store.events[match.id]) {
      store.events[match.id] = [];
    }
    this._writeStore(store);
    return newMatch;
  }

  async updateMatch(match) {
    const store = this._readStore();
    const index = store.matches.findIndex(m => m.id === match.id);
    if (index === -1) {
      throw new Error(`Match with id ${match.id} not found.`);
    }
    const updated = {
      ...store.matches[index],
      ...match,
      updatedAt: new Date().toISOString()
    };
    store.matches[index] = updated;
    this._writeStore(store);
    this._notifyListeners(match.id);
    return updated;
  }

  async deleteMatch(matchId) {
    const store = this._readStore();
    store.matches = store.matches.filter(m => m.id !== matchId);
    delete store.events[matchId];
    this._writeStore(store);
    return true;
  }

  // --- Match Events ---
  async getMatchEvents(matchId) {
    const store = this._readStore();
    const matchEvents = store.events[matchId] || [];
    return [...matchEvents].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  }

  async saveMatchEvent(matchId, event) {
    const store = this._readStore();
    if (!store.events[matchId]) {
      store.events[matchId] = [];
    }
    const newEvent = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
      sequence: event.sequence !== undefined ? event.sequence : store.events[matchId].length + 1
    };
    store.events[matchId].push(newEvent);

    const mIdx = store.matches.findIndex(m => m.id === matchId);
    if (mIdx !== -1) {
      store.matches[mIdx].updatedAt = new Date().toISOString();
    }

    this._writeStore(store);
    this._notifyListeners(matchId);
    return newEvent;
  }

  async deleteMatchEvent(matchId, eventId) {
    const store = this._readStore();
    if (!store.events[matchId] || store.events[matchId].length === 0) {
      return false;
    }
    if (eventId) {
      store.events[matchId] = store.events[matchId].filter(e => e.id !== eventId);
    } else {
      store.events[matchId].pop();
    }

    const mIdx = store.matches.findIndex(m => m.id === matchId);
    if (mIdx !== -1) {
      store.matches[mIdx].updatedAt = new Date().toISOString();
    }

    this._writeStore(store);
    this._notifyListeners(matchId);
    return true;
  }

  // --- User Accounts ---
  async getUser(username) {
    const store = this._readStore();
    const clean = (username || '').trim().toLowerCase();
    return store.users.find(u => u.username.toLowerCase() === clean) || null;
  }

  async createUser(user) {
    const store = this._readStore();
    const clean = (user.username || '').trim().toLowerCase();
    const existing = store.users.find(u => u.username.toLowerCase() === clean);
    if (existing) {
      throw new Error(`Username "${user.username}" is already taken.`);
    }
    store.users.push(user);
    this._writeStore(store);
    return user;
  }

  // --- Single Umpire Session Lock (Heartbeat & TTL based) ---
  async acquireUmpireLock(sessionId, username) {
    const store = this._readStore();
    const cleanUser = (username || 'umpire').trim().toLowerCase();
    if (!store.activeUmpireSessions) store.activeUmpireSessions = {};

    const currentLock = store.activeUmpireSessions[cleanUser] || null;
    const now = Date.now();

    // Stale session check: If no heartbeat in 30 seconds, treat as expired (e.g. browser closed)
    const isStale = currentLock && (now - (currentLock.lastHeartbeat || 0) > 30000);

    if (currentLock && currentLock.status === 'ACTIVE' && currentLock.sessionId !== sessionId && !isStale) {
      return { acquired: false, existingSession: currentLock, canForceTakeover: false };
    }

    const newLock = {
      username: username || 'umpire',
      role: 'UMPIRE',
      sessionId,
      loginTime: new Date().toISOString(),
      lastHeartbeat: now,
      status: 'ACTIVE'
    };

    store.activeUmpireSessions[cleanUser] = newLock;
    this._writeStore(store);
    return { acquired: true, existingSession: newLock };
  }

  async heartbeatUmpireLock(sessionId, username) {
    const store = this._readStore();
    const cleanUser = (username || 'umpire').trim().toLowerCase();
    if (store.activeUmpireSessions && store.activeUmpireSessions[cleanUser]) {
      if (store.activeUmpireSessions[cleanUser].sessionId === sessionId) {
        store.activeUmpireSessions[cleanUser].lastHeartbeat = Date.now();
        this._writeStore(store);
        return true;
      }
    }
    return false;
  }

  async releaseUmpireLock(sessionId, username) {
    const store = this._readStore();
    const cleanUser = (username || 'umpire').trim().toLowerCase();
    if (store.activeUmpireSessions && store.activeUmpireSessions[cleanUser]) {
      if (!sessionId || store.activeUmpireSessions[cleanUser].sessionId === sessionId) {
        delete store.activeUmpireSessions[cleanUser];
        this._writeStore(store);
        return true;
      }
    }
    return false;
  }

  async getUmpireLock(username) {
    const store = this._readStore();
    const cleanUser = (username || 'umpire').trim().toLowerCase();
    return store.activeUmpireSessions?.[cleanUser] || null;
  }


  // --- Export & Import ---
  async exportData() {
    const store = this._readStore();
    return {
      version: 1,
      players: store.players,
      teams: store.teams,
      matches: store.matches,
      events: store.events,
      metadata: {
        exportedAt: new Date().toISOString(),
        totalPlayers: store.players.length,
        totalTeams: store.teams.length,
        totalMatches: store.matches.length
      }
    };
  }

  async importData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid backup file format');
    }
    const store = {
      version: data.version || 1,
      players: Array.isArray(data.players) ? data.players : [],
      teams: Array.isArray(data.teams) ? data.teams : [],
      matches: Array.isArray(data.matches) ? data.matches : [],
      events: data.events && typeof data.events === 'object' ? data.events : {},
      activeUmpireSession: null,
      metadata: {
        importedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
    };
    this._writeStore(store);
    return true;
  }

  async clearAllData() {
    localStorage.removeItem(this.storageKey);
    return true;
  }

  subscribeToMatch(matchId, callback) {
    if (!this.listeners.has(matchId)) {
      this.listeners.set(matchId, new Set());
    }
    this.listeners.get(matchId).add(callback);

    return () => {
      if (this.listeners.has(matchId)) {
        this.listeners.get(matchId).delete(callback);
      }
    };
  }
}
