/**
 * Base Abstract StorageProvider interface
 * Defines the contract that both LocalStorageProvider and FirebaseStorageProvider must satisfy.
 */
export class StorageProvider {
  /**
   * Retrieves all players
   * @returns {Promise<Array>}
   */
  async getPlayers() {
    throw new Error('Method getPlayers() must be implemented');
  }

  /**
   * Retrieves a player by ID
   * @param {string} playerId 
   * @returns {Promise<Object|null>}
   */
  async getPlayer(playerId) {
    throw new Error('Method getPlayer() must be implemented');
  }

  /**
   * Saves a new player
   * @param {Object} player 
   * @returns {Promise<Object>}
   */
  async createPlayer(player) {
    throw new Error('Method createPlayer() must be implemented');
  }

  /**
   * Updates an existing player
   * @param {Object} player 
   * @returns {Promise<Object>}
   */
  async updatePlayer(player) {
    throw new Error('Method updatePlayer() must be implemented');
  }

  /**
   * Deletes a player by ID
   * @param {string} playerId 
   * @returns {Promise<boolean>}
   */
  async deletePlayer(playerId) {
    throw new Error('Method deletePlayer() must be implemented');
  }

  /**
   * Retrieves all teams
   * @returns {Promise<Array>}
   */
  async getTeams() {
    throw new Error('Method getTeams() must be implemented');
  }

  /**
   * Retrieves a single team by ID
   * @param {string} teamId 
   * @returns {Promise<Object|null>}
   */
  async getTeam(teamId) {
    throw new Error('Method getTeam() must be implemented');
  }

  /**
   * Saves a new team
   * @param {Object} team 
   * @returns {Promise<Object>}
   */
  async createTeam(team) {
    throw new Error('Method createTeam() must be implemented');
  }

  /**
   * Updates an existing team
   * @param {Object} team 
   * @returns {Promise<Object>}
   */
  async updateTeam(team) {
    throw new Error('Method updateTeam() must be implemented');
  }

  /**
   * Deletes a team by ID
   * @param {string} teamId 
   * @returns {Promise<boolean>}
   */
  async deleteTeam(teamId) {
    throw new Error('Method deleteTeam() must be implemented');
  }

  /**
   * Retrieves all matches
   * @returns {Promise<Array>}
   */
  async getMatches() {
    throw new Error('Method getMatches() must be implemented');
  }

  /**
   * Retrieves a single match by ID
   * @param {string} matchId 
   * @returns {Promise<Object|null>}
   */
  async getMatch(matchId) {
    throw new Error('Method getMatch() must be implemented');
  }

  /**
   * Creates a new match
   * @param {Object} match 
   * @returns {Promise<Object>}
   */
  async createMatch(match) {
    throw new Error('Method createMatch() must be implemented');
  }

  /**
   * Updates an existing match
   * @param {Object} match 
   * @returns {Promise<Object>}
   */
  async updateMatch(match) {
    throw new Error('Method updateMatch() must be implemented');
  }

  /**
   * Deletes a match and its events
   * @param {string} matchId 
   * @returns {Promise<boolean>}
   */
  async deleteMatch(matchId) {
    throw new Error('Method deleteMatch() must be implemented');
  }

  /**
   * Retrieves all events for a match sorted by sequence / timestamp
   * @param {string} matchId 
   * @returns {Promise<Array>}
   */
  async getMatchEvents(matchId) {
    throw new Error('Method getMatchEvents() must be implemented');
  }

  /**
   * Persists a single scoring event for a match
   * @param {string} matchId 
   * @param {Object} event 
   * @returns {Promise<Object>}
   */
  async saveMatchEvent(matchId, event) {
    throw new Error('Method saveMatchEvent() must be implemented');
  }

  /**
   * Deletes the most recent scoring event (for Undo)
   * @param {string} matchId 
   * @param {string} eventId 
   * @returns {Promise<boolean>}
   */
  async deleteMatchEvent(matchId, eventId) {
    throw new Error('Method deleteMatchEvent() must be implemented');
  }

  /**
   * Retrieves a user by username
   * @param {string} username
   * @returns {Promise<Object|null>}
   */
  async getUser(username) {
    throw new Error('Method getUser() must be implemented');
  }

  /**
   * Saves/creates a new user
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  async createUser(user) {
    throw new Error('Method createUser() must be implemented');
  }

  /**
   * Attempts to acquire the active Umpire session lock
   * @param {string} sessionId
   * @param {string} username
   * @param {boolean} force
   * @returns {Promise<{ acquired: boolean, existingSession?: Object }>}
   */
  async acquireUmpireLock(sessionId, username, force = false) {
    throw new Error('Method acquireUmpireLock() must be implemented');
  }

  /**
   * Updates heartbeat timestamp for active Umpire session lock
   * @param {string} sessionId
   * @param {string} username
   * @returns {Promise<boolean>}
   */
  async heartbeatUmpireLock(sessionId, username) {
    throw new Error('Method heartbeatUmpireLock() must be implemented');
  }

  /**
   * Releases active Umpire session lock
   * @param {string} sessionId
   * @param {string} username
   * @returns {Promise<boolean>}
   */
  async releaseUmpireLock(sessionId, username) {
    throw new Error('Method releaseUmpireLock() must be implemented');
  }

  /**
   * Checks current Umpire session lock
   * @param {string} username
   * @returns {Promise<Object|null>}
   */
  async getUmpireLock(username) {
    throw new Error('Method getUmpireLock() must be implemented');
  }

  /**
   * Exports full application data in standard format
   * @returns {Promise<Object>}
   */
  async exportData() {
    throw new Error('Method exportData() must be implemented');
  }

  /**
   * Imports standardized data payload
   * @param {Object} data 
   * @returns {Promise<boolean>}
   */
  async importData(data) {
    throw new Error('Method importData() must be implemented');
  }

  /**
   * Completely clears application data
   * @returns {Promise<boolean>}
   */
  async clearAllData() {
    throw new Error('Method clearAllData() must be implemented');
  }

  /**
   * Optional subscription listener for match updates
   * @param {string} matchId 
   * @param {Function} callback 
   * @returns {Function} unsubscribe function
   */
  subscribeToMatch(matchId, callback) {
    return () => {};
  }
}
