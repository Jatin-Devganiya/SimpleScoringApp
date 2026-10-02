import { StorageProvider } from './StorageProvider';
import { appConfig } from '../config/appConfig';

/**
 * LocalStorage implementation of StorageProvider
 * Stores all teams, matches, and match events in browser localStorage.
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
        teams: Array.isArray(parsed.teams) ? parsed.teams : [],
        matches: Array.isArray(parsed.matches) ? parsed.matches : [],
        events: parsed.events && typeof parsed.events === 'object' ? parsed.events : {},
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
      teams: [],
      matches: [],
      events: {},
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

  async getMatches() {
    const store = this._readStore();
    // Return sorted newest first
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

    // Update match's updatedAt
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
      // Pop last event
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

  async exportData() {
    const store = this._readStore();
    // Build standard export format matching schema
    return {
      version: 1,
      teams: store.teams,
      matches: store.matches,
      events: store.events,
      metadata: {
        exportedAt: new Date().toISOString(),
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
      teams: Array.isArray(data.teams) ? data.teams : [],
      matches: Array.isArray(data.matches) ? data.matches : [],
      events: data.events && typeof data.events === 'object' ? data.events : {},
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
