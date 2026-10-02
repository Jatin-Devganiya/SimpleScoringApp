import { StorageProvider } from './StorageProvider';
import { getFirebaseDb } from '../config/firebaseConfig';
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
  writeBatch
} from 'firebase/firestore';

/**
 * Firebase Firestore implementation of StorageProvider
 * Persists data to Cloud Firestore without leaking Firestore details to the UI.
 */
export class FirebaseStorageProvider extends StorageProvider {
  constructor() {
    super();
    // Validates Firebase environment variables; throws clear error if unconfigured
    this.db = getFirebaseDb();
  }

  async getTeams() {
    try {
      const snap = await getDocs(collection(this.db, 'teams'));
      const teams = [];
      snap.forEach(d => teams.push(d.data()));
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
      return snap.exists() ? snap.data() : null;
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
      // Delete all subcollection events first
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
      
      // Update parent match updatedAt timestamp
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
        // Find last event by sequence
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

  async exportData() {
    try {
      const teams = await this.getTeams();
      const matches = await this.getMatches();
      const events = {};

      for (const m of matches) {
        events[m.id] = await this.getMatchEvents(m.id);
      }

      return {
        version: 1,
        teams,
        matches,
        events,
        metadata: {
          exportedAt: new Date().toISOString(),
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
      // Write teams
      if (Array.isArray(data.teams)) {
        for (const team of data.teams) {
          await setDoc(doc(this.db, 'teams', team.id), team);
        }
      }

      // Write matches and their events
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
