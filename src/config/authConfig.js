/**
 * Predefined Application Users and Roles
 * 
 * Supports two roles:
 * - UMPIRE: Full administrative and scoring privileges (single concurrent session lock)
 * - USER: Read-only access to matches, teams, players, and live scores
 */

export const predefinedUsers = [
  {
    id: 'user_umpire',
    username: 'umpire',
    password: 'umpire123',
    role: 'UMPIRE',
    displayName: 'Head Umpire'
  },
  {
    id: 'user_viewer',
    username: 'user',
    password: 'user123',
    role: 'USER',
    displayName: 'Match Viewer'
  }
];

export const ROLES = {
  UMPIRE: 'UMPIRE',
  USER: 'USER'
};

export const SESSION_STORAGE_KEY = 'cricketApp.currentUserSession';
export const UMPIRE_LOCK_KEY = 'cricketApp.activeUmpireSession';
