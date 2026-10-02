/**
 * Base Abstract StorageProvider interface
 * Defines the contract that both LocalStorageProvider and FirebaseStorageProvider must satisfy.
 */
export class StorageProvider {
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
