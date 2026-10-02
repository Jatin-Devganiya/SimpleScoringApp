import { StorageProvider } from './StorageProvider.js';
import { getFirebaseDb } from '../config/firebaseConfig.js';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  runTransaction
} from 'firebase/firestore';

/**
 * Firebase Firestore implementation of StorageProvider
 * Persists players, teams, matches, events, and atomic umpire session locks to Cloud Firestore.
 */
export class FirebaseStorageProvider extends StorageProvider {
  constructor() {
    super();
    this.db = getFirebaseDb();
  }

  // --- Players Management ---
  async getPlayers() {
    try {
      const snap = await getDocs(collection(this.db, 'players'));
      const players = [];
      snap.forEach(d => players.push(d.data()));
      return players.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } catch (err) {
      console.error('Firebase getPlayers failed:', err);
      throw new Error(`Unable to fetch players from Firebase: ${err.message}`);
    }
  }

  async getPlayer(playerId) {
    try {
      const ref = doc(this.db, 'players', playerId);
      const snap = await getDoc(ref);
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      console.error('Firebase getPlayer failed:', err);
      throw new Error(`Unable to fetch player: ${err.message}`);
    }
  }

  async createPlayer(player) {
    try {
      const now = new Date().toISOString();
      const payload = {
        ...player,
        createdAt: player.createdAt || now,
        updatedAt: now
      };
      await setDoc(doc(this.db, 'players', player.id), payload);
      return payload;
    } catch (err) {
      console.error('Firebase createPlayer failed:', err);
      throw new Error(`Unable to create player in Firebase: ${err.message}`);
    }
  }

  async updatePlayer(player) {
    try {
      const now = new Date().toISOString();
      const payload = {
        ...player,
        updatedAt: now
      };
      await updateDoc(doc(this.db, 'players', player.id), payload);
      return payload;
    } catch (err) {
      console.error('Firebase updatePlayer failed:', err);
      throw new Error(`Unable to update player in Firebase: ${err.message}`);
    }
  }

  async deletePlayer(playerId) {
    try {
      await deleteDoc(doc(this.db, 'players', playerId));
      return true;
    } catch (err) {
      console.error('Firebase deletePlayer failed:', err);
      throw new Error(`Unable to delete player from Firebase: ${err.message}`);
    }
  }

  // --- Teams Management ---
  async getTeams() {
    try {
      const snap = await getDocs(collection(this.db, 'teams'));
      const teams = [];
      snap.forEach(d => {
        const data = d.data();
        teams.push({
          ...data,
          playerIds: Array.isArray(data.playerIds) ? data.playerIds : []
        });
      });
      return teams;
    } catch (err) {
      console.error('Firebase getTeams failed:', err);
      throw new Error(`Unable to fetch teams from Firebase: ${err.message}`);
    }
  }

  async getTeam(teamId) {
    try {
      const ref = doc(this.db, 'teams', teamId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const data = snap.data();
      return {
        ...data,
        playerIds: Array.isArray(data.playerIds) ? data.playerIds : []
      };
    } catch (err) {
      console.error('Firebase getTeam failed:', err);
      throw new Error(`Unable to fetch team: ${err.message}`);
    }
  }

  async createTeam(team) {
    try {
      const now = new Date().toISOString();
      const payload = {
        ...team,
        playerIds: Array.isArray(team.playerIds) ? team.playerIds : [],
        createdAt: team.createdAt || now,
        updatedAt: now
      };
      await setDoc(doc(this.db, 'teams', team.id), payload);
      return payload;
    } catch (err) {
      console.error('Firebase createTeam failed:', err);
      throw new Error(`Unable to save team to Firebase: ${err.message}`);
    }
  }

  async updateTeam(team) {
    try {
      const now = new Date().toISOString();
      const payload = {
        ...team,
        playerIds: Array.isArray(team.playerIds) ? team.playerIds : [],
        updatedAt: now
      };
      await updateDoc(doc(this.db, 'teams', team.id), payload);
      return payload;
    } catch (err) {
      console.error('Firebase updateTeam failed:', err);
      throw new Error(`Unable to update team in Firebase: ${err.message}`);
    }
  }

  async deleteTeam(teamId) {
    try {
      await deleteDoc(doc(this.db, 'teams', teamId));
      return true;
    } catch (err) {
      console.error('Firebase deleteTeam failed:', err);
      throw new Error(`Unable to delete team: ${err.message}`);
    }
  }

  // --- Matches Management ---
  async getMatches() {
    try {
      const snap = await getDocs(collection(this.db, 'matches'));
      const matches = [];
      snap.forEach(d => matches.push(d.data()));
      return matches.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } catch (err) {
      console.error('Firebase getMatches failed:', err);
      throw new Error(`Unable to fetch matches from Firebase: ${err.message}`);
    }
  }

  async getMatch(matchId) {
    try {
      const ref = doc(this.db, 'matches', matchId);
      const snap = await getDoc(ref);
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      console.error('Firebase getMatch failed:', err);
      throw new Error(`Unable to fetch match: ${err.message}`);
    }
  }

  async createMatch(match) {
    try {
      const now = new Date().toISOString();
      const payload = {
        ...match,
        createdAt: match.createdAt || now,
        updatedAt: now
      };
      await setDoc(doc(this.db, 'matches', match.id), payload);
      return payload;
    } catch (err) {
      console.error('Firebase createMatch failed:', err);
      throw new Error(`Unable to create match in Firebase: ${err.message}`);
    }
  }

  async updateMatch(match) {
    try {
      const now = new Date().toISOString();
      const payload = {
        ...match,
        updatedAt: now
      };
      await updateDoc(doc(this.db, 'matches', match.id), payload);
      return payload;
    } catch (err) {
      console.error('Firebase updateMatch failed:', err);
      throw new Error(`Unable to update match in Firebase: ${err.message}`);
    }
  }

  async deleteMatch(matchId) {
    try {
      const eventsSnap = await getDocs(collection(this.db, 'matches', matchId, 'events'));
      const batch = writeBatch(this.db);
      eventsSnap.forEach(d => batch.delete(d.ref));
      batch.delete(doc(this.db, 'matches', matchId));
      await batch.commit();
      return true;
    } catch (err) {
      console.error('Firebase deleteMatch failed:', err);
      throw new Error(`Unable to delete match: ${err.message}`);
    }
  }

  async getMatchEvents(matchId) {
    try {
      const q = query(
        collection(this.db, 'matches', matchId, 'events'),
        orderBy('sequence', 'asc')
      );
      const snap = await getDocs(q);
      const events = [];
      snap.forEach(d => events.push(d.data()));
      return events;
    } catch (err) {
      console.error('Firebase getMatchEvents failed:', err);
      throw new Error(`Unable to fetch match events: ${err.message}`);
    }
  }

  async saveMatchEvent(matchId, event) {
    try {
      const now = new Date().toISOString();
      const payload = {
        ...event,
        timestamp: event.timestamp || now
      };
      await setDoc(doc(this.db, 'matches', matchId, 'events', event.id), payload);
      
      await updateDoc(doc(this.db, 'matches', matchId), {
        updatedAt: now
      });

      return payload;
    } catch (err) {
      console.error('Firebase saveMatchEvent failed:', err);
      throw new Error(`Unable to save scoring event to Firebase: ${err.message}`);
    }
  }

  async deleteMatchEvent(matchId, eventId) {
    try {
      if (!eventId) {
        const events = await this.getMatchEvents(matchId);
        if (events.length === 0) return false;
        eventId = events[events.length - 1].id;
      }
      await deleteDoc(doc(this.db, 'matches', matchId, 'events', eventId));
      await updateDoc(doc(this.db, 'matches', matchId), {
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.error('Firebase deleteMatchEvent failed:', err);
      throw new Error(`Unable to undo scoring event in Firebase: ${err.message}`);
    }
  }

  // --- User Accounts ---
  async getUser(username) {
    try {
      const clean = (username || '').trim().toLowerCase();
      const userRef = doc(this.db, 'users', clean);
      const snap = await getDoc(userRef);
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      console.error('Firebase getUser error:', err);
      return null;
    }
  }

  async createUser(user) {
    try {
      const clean = (user.username || '').trim().toLowerCase();
      const userRef = doc(this.db, 'users', clean);
      await setDoc(userRef, user);
      return user;
    } catch (err) {
      console.error('Firebase createUser error:', err);
      throw new Error(`Unable to create user in Firebase: ${err.message}`);
    }
  }

  // --- Atomic Firebase Umpire Lock (Heartbeat & TTL based) ---
  async acquireUmpireLock(sessionId, username) {
    const cleanUser = (username || 'umpire').trim().toLowerCase();
    const sessionRef = doc(this.db, 'systemSessions', cleanUser);
    const now = Date.now();

    try {
      return await runTransaction(this.db, async (transaction) => {
        const sessionDoc = await transaction.get(sessionRef);

        if (sessionDoc.exists()) {
          const data = sessionDoc.data();
          const isStale = (now - (data.lastHeartbeat || 0)) > 30000;

          // Active lock exists with a different session ID and is not stale
          if (data.status === 'ACTIVE' && data.sessionId !== sessionId && !isStale) {
            return { acquired: false, existingSession: data, canForceTakeover: false };
          }
        }

        const newLock = {
          username: username || 'umpire',
          role: 'UMPIRE',
          sessionId,
          loginTime: new Date().toISOString(),
          lastHeartbeat: now,
          status: 'ACTIVE'
        };

        transaction.set(sessionRef, newLock);
        return { acquired: true, existingSession: newLock };
      });
    } catch (err) {
      console.error('Firebase acquireUmpireLock transaction failed:', err);
      throw new Error(`Failed to verify umpire session lock: ${err.message}`);
    }
  }

  async heartbeatUmpireLock(sessionId, username) {
    const cleanUser = (username || 'umpire').trim().toLowerCase();
    const sessionRef = doc(this.db, 'systemSessions', cleanUser);
    try {
      await updateDoc(sessionRef, {
        lastHeartbeat: Date.now()
      });
      return true;
    } catch {
      return false;
    }
  }

  async releaseUmpireLock(sessionId, username) {
    const cleanUser = (username || 'umpire').trim().toLowerCase();
    const sessionRef = doc(this.db, 'systemSessions', cleanUser);

    try {
      return await runTransaction(this.db, async (transaction) => {
        const sessionDoc = await transaction.get(sessionRef);
        if (sessionDoc.exists()) {
          const data = sessionDoc.data();
          if (!sessionId || data.sessionId === sessionId) {
            transaction.delete(sessionRef);
            return true;
          }
        }
        return false;
      });
    } catch (err) {
      console.error('Firebase releaseUmpireLock error:', err);
      return false;
    }
  }

  async getUmpireLock(username) {
    const cleanUser = (username || 'umpire').trim().toLowerCase();
    try {
      const snap = await getDoc(doc(this.db, 'systemSessions', cleanUser));
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      console.warn('Firebase getUmpireLock error:', err);
      return null;
    }
  }


  // --- Export & Import ---
  async exportData() {
    try {
      const players = await this.getPlayers();
      const teams = await this.getTeams();
      const matches = await this.getMatches();
      const events = {};

      for (const m of matches) {
        events[m.id] = await this.getMatchEvents(m.id);
      }

      return {
        version: 1,
        players,
        teams,
        matches,
        events,
        metadata: {
          exportedAt: new Date().toISOString(),
          totalPlayers: players.length,
          totalTeams: teams.length,
          totalMatches: matches.length,
          source: 'firebase'
        }
      };
    } catch (err) {
      console.error('Firebase exportData failed:', err);
      throw new Error(`Unable to export data from Firebase: ${err.message}`);
    }
  }

  async importData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid backup file format');
    }

    try {
      // Import players
      if (Array.isArray(data.players)) {
        for (const player of data.players) {
          await setDoc(doc(this.db, 'players', player.id), player);
        }
      }

      // Import teams
      if (Array.isArray(data.teams)) {
        for (const team of data.teams) {
          await setDoc(doc(this.db, 'teams', team.id), team);
        }
      }

      // Import matches and events
      if (Array.isArray(data.matches)) {
        for (const match of data.matches) {
          await setDoc(doc(this.db, 'matches', match.id), match);
          const matchEvents = data.events?.[match.id] || [];
          for (const ev of matchEvents) {
            await setDoc(doc(this.db, 'matches', match.id, 'events', ev.id), ev);
          }
        }
      }

      return true;
    } catch (err) {
      console.error('Firebase importData failed:', err);
      throw new Error(`Unable to import data into Firebase: ${err.message}`);
    }
  }

  async clearAllData() {
    try {
      const matches = await this.getMatches();
      for (const m of matches) {
        await this.deleteMatch(m.id);
      }
      const teams = await this.getTeams();
      for (const t of teams) {
        await this.deleteTeam(t.id);
      }
      const players = await this.getPlayers();
      for (const p of players) {
        await this.deletePlayer(p.id);
      }
      await deleteDoc(doc(this.db, 'systemSessions', 'umpire'));
      return true;
    } catch (err) {
      console.error('Firebase clearAllData failed:', err);
      throw new Error(`Unable to clear Firebase data: ${err.message}`);
    }
  }

  subscribeToMatch(matchId, callback) {
    try {
      const unsub = onSnapshot(doc(this.db, 'matches', matchId), docSnap => {
        if (docSnap.exists()) {
          callback(docSnap.data());
        }
      });
      return unsub;
    } catch (err) {
      console.warn('Firebase subscribeToMatch error:', err);
      return () => {};
    }
  }
}
