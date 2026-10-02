import { predefinedUsers, ROLES, SESSION_STORAGE_KEY } from '../config/authConfig.js';
import { storageProvider } from '../storage/storageFactory.js';
import { generateId } from '../utils/ids.js';

/**
 * Authentication and Session Management Service
 * 
 * Supports:
 * - Dynamic User registration and login (stored in DB)
 * - Single-session Umpire concurrency lock with Heartbeat + TTL + Force Takeover
 * - Multi-umpire data ownership (Umpires can only modify their own items)
 * - View-only permissions for other Umpires and normal Users
 */
export class AuthService {
  constructor(provider = storageProvider) {
    this.provider = provider;
    this.heartbeatInterval = null;
    this._initSession();
  }

  _initSession() {
    const session = this.getCurrentSession();
    if (session && session.role === ROLES.UMPIRE && session.sessionId) {
      this.startHeartbeat();
    }
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
   * Checks if current user is allowed to modify/delete/score a specific item
   * Rule: UMPIRE can modify items they created, or legacy items without createdBy.
   * If created by another umpire, returns false.
   * USER cannot modify any item.
   * @param {Object} item 
   * @returns {boolean}
   */
  canModify(item) {
    const session = this.getCurrentSession();
    if (!session || session.role !== ROLES.UMPIRE) return false;
    if (!item) return true;
    // Backward compatibility: items without createdBy can be managed by any umpire
    if (!item.createdBy) return true;
    return item.createdBy.toLowerCase() === session.username.toLowerCase();
  }

  /**
   * Enforces that current user is an UMPIRE.
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

  /**
   * Enforces that current user is the owner Umpire of the item.
   * @param {Object} item 
   * @param {string} actionName 
   */
  requireOwnership(item, actionName = 'modify this item') {
    const session = this.requireUmpire(actionName);
    if (!this.canModify(item)) {
      throw new Error(`Permission Denied: This was created by "${item?.createdBy}". Only the creator umpire can ${actionName}.`);
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
   * Registers a new user account in database
   * @param {string} username 
   * @param {string} password 
   * @param {string} role 'UMPIRE' | 'USER'
   * @returns {Promise<Object>} session object
   */
  async register(username, password, role = ROLES.USER) {
    const cleanUser = (username || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanUser || cleanUser.length < 2) {
      throw new Error('Username must be at least 2 characters.');
    }
    if (!cleanPass || cleanPass.length < 3) {
      throw new Error('Password must be at least 3 characters.');
    }

    const assignedRole = role === ROLES.UMPIRE ? ROLES.UMPIRE : ROLES.USER;

    // Check if user already exists
    const existing = await this.provider.getUser(cleanUser);
    if (existing) {
      throw new Error(`Username "${cleanUser}" is already taken. Please sign in.`);
    }

    const newUser = {
      id: generateId('user'),
      username: cleanUser,
      displayName: cleanUser,
      password: cleanPass,
      role: assignedRole,
      createdAt: new Date().toISOString()
    };

    await this.provider.createUser(newUser);

    // Auto login after registration
    return await this.login(cleanUser, cleanPass);
  }

  /**
   * Performs authentication with single-Umpire lock verification
   * @param {string} username 
   * @param {string} password 
   * @param {Object} options { force: boolean }
   * @returns {Promise<Object>} session object
   */
  async login(username, password, options = {}) {
    const cleanUser = (username || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanUser || !cleanPass) {
      throw new Error('Please enter username and password.');
    }

    // Lookup user in DB
    let user = await this.provider.getUser(cleanUser);

    // Backward-compatibility: Check predefined users if not in DB
    if (!user) {
      const predefined = predefinedUsers.find(
        u => u.username.toLowerCase() === cleanUser.toLowerCase() && u.password === cleanPass
      );
      if (predefined) {
        user = {
          id: predefined.id,
          username: predefined.username,
          displayName: predefined.displayName,
          password: predefined.password,
          role: predefined.role,
          createdAt: new Date().toISOString()
        };
        try {
          await this.provider.createUser(user);
        } catch {
          // Ignore if already created
        }
      }
    }

    if (!user) {
      const err = new Error(`Account "${cleanUser}" not found. Please click Register to create your account.`);
      err.userNotFound = true;
      throw err;
    }

    if (user.password !== cleanPass) {
      throw new Error('Invalid password. Please try again.');
    }

    const sessionId = generateId('session');

    // Single active session restriction for UMPIRE role
    if (user.role === ROLES.UMPIRE) {
      const result = await this.provider.acquireUmpireLock(sessionId, user.username, !!options.force);
      if (!result.acquired) {
        const lockErr = new Error(
          `The Umpire account "${user.username}" currently has an active session. If you closed your browser without logging out, click "Take Over Session" below to continue.`
        );
        lockErr.canForceTakeover = true;
        lockErr.username = user.username;
        throw lockErr;
      }
    }

    const sessionPayload = {
      id: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      role: user.role,
      sessionId,
      loginTime: new Date().toISOString()
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionPayload));
    this.startHeartbeat();
    return sessionPayload;
  }

  /**
   * Starts periodic heartbeat for active Umpire session
   */
  startHeartbeat() {
    this.stopHeartbeat();
    const session = this.getCurrentSession();
    if (session && session.role === ROLES.UMPIRE && session.sessionId) {
      this.heartbeatInterval = setInterval(async () => {
        try {
          await this.provider.heartbeatUmpireLock(session.sessionId, session.username);
        } catch (e) {
          console.warn('Heartbeat update failed:', e);
        }
      }, 15000);
    }
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Logs out current session and releases Umpire lock if applicable
   * @returns {Promise<boolean>}
   */
  async logout() {
    this.stopHeartbeat();
    const session = this.getCurrentSession();
    if (session && session.role === ROLES.UMPIRE && session.sessionId) {
      try {
        await this.provider.releaseUmpireLock(session.sessionId, session.username);
      } catch (err) {
        console.warn('Error releasing umpire lock on logout:', err);
      }
    }

    localStorage.removeItem(SESSION_STORAGE_KEY);
    return true;
  }
}

export const authService = new AuthService();

