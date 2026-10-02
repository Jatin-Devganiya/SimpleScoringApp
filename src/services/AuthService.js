import { predefinedUsers, ROLES, SESSION_STORAGE_KEY } from '../config/authConfig.js';
import { storageProvider } from '../storage/storageFactory.js';
import { generateId } from '../utils/ids.js';

/**
 * Authentication and Session Management Service
 * 
 * Manages:
 * - Predefined logins (UMPIRE, USER)
 * - Single-session Umpire concurrency lock (both LocalStorage and Firebase)
 * - Multi-user USER logins
 * - Role permission checks
 */
export class AuthService {
  constructor(provider = storageProvider) {
    this.provider = provider;
  }

  getCurrentSession() {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  isAuthenticated() {
    const session = this.getCurrentSession();
    return !!session && !!session.role;
  }

  isUmpire() {
    const session = this.getCurrentSession();
    return session?.role === ROLES.UMPIRE;
  }

  isUser() {
    const session = this.getCurrentSession();
    return session?.role === ROLES.USER;
  }

  /**
   * Enforces that current user is an UMPIRE.
   * Required for all mutation operations (security rule).
   * @param {string} actionName 
   */
  requireUmpire(actionName = 'perform this action') {
    const session = this.getCurrentSession();
    if (!session) {
      throw new Error('Please login to continue.');
    }
    if (session.role !== ROLES.UMPIRE) {
      throw new Error(`You do not have permission to ${actionName}. Only an Umpire can make modifications.`);
    }
    return session;
  }

  hasPermission(permission) {
    const session = this.getCurrentSession();
    if (!session) return false;
    if (session.role === ROLES.UMPIRE) return true;

    // USER role has only VIEW permissions
    if (session.role === ROLES.USER) {
      return permission.endsWith('_VIEW');
    }

    return false;
  }

  /**
   * Performs authentication with single-Umpire lock verification
   * @param {string} username 
   * @param {string} password 
   * @returns {Promise<Object>} session object
   */
  async login(username, password) {
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const user = predefinedUsers.find(
      u => u.username.toLowerCase() === cleanUser && u.password === cleanPass
    );

    if (!user) {
      throw new Error('Invalid username or password.');
    }

    const sessionId = generateId('session');

    // Single active session restriction for UMPIRE role
    if (user.role === ROLES.UMPIRE) {
      const result = await this.provider.acquireUmpireLock(sessionId, user.username);
      if (!result.acquired) {
        throw new Error('The Umpire account is currently in use. Please try again after the existing Umpire session is completed.');
      }
    }

    const sessionPayload = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      sessionId,
      loginTime: new Date().toISOString()
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionPayload));
    return sessionPayload;
  }

  /**
   * Logs out current session and releases Umpire lock if applicable
   * @returns {Promise<boolean>}
   */
  async logout() {
    const session = this.getCurrentSession();
    if (session && session.role === ROLES.UMPIRE && session.sessionId) {
      try {
        await this.provider.releaseUmpireLock(session.sessionId);
      } catch (err) {
        console.warn('Error releasing umpire lock on logout:', err);
      }
    }

    localStorage.removeItem(SESSION_STORAGE_KEY);
    return true;
  }
}

export const authService = new AuthService();
