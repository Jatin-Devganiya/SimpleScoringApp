/**
 * Validates and normalizes backup files across different versions
 * Guarantees cross-storage migration compatibility (LocalStorage <-> Firebase)
 */

export class DataMigrationService {
  static SUPPORTED_VERSIONS = [1];

  /**
   * Validates structure of imported JSON payload
   * @param {any} data 
   * @returns {{ isValid: boolean, error?: string, normalized?: Object }}
   */
  static validateAndNormalize(data) {
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'Backup file must contain a valid JSON object.' };
    }

    const version = data.version || 1;
    if (!this.SUPPORTED_VERSIONS.includes(version)) {
      return {
        isValid: false,
        error: `Unsupported backup version (${version}). Supported versions: ${this.SUPPORTED_VERSIONS.join(', ')}`
      };
    }

    if (!Array.isArray(data.teams)) {
      return { isValid: false, error: 'Backup is missing or has invalid "teams" array.' };
    }

    if (!Array.isArray(data.matches)) {
      return { isValid: false, error: 'Backup is missing or has invalid "matches" array.' };
    }

    // Normalization logic
    const normalizedTeams = data.teams.map(team => ({
      id: team.id || `team_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: team.name || 'Unnamed Team',
      players: Array.isArray(team.players)
        ? team.players.map(p => ({
            id: p.id || `player_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: typeof p === 'string' ? p : (p.name || 'Player')
          }))
        : [],
      createdAt: team.createdAt || new Date().toISOString(),
      updatedAt: team.updatedAt || new Date().toISOString()
    }));

    const normalizedMatches = data.matches.map(m => ({
      id: m.id,
      team1Id: m.team1Id,
      team2Id: m.team2Id,
      battingFirstTeamId: m.battingFirstTeamId,
      bowlingFirstTeamId: m.bowlingFirstTeamId,
      totalOvers: m.totalOvers || 20,
      status: m.status || 'IN_PROGRESS',
      currentInningsIndex: m.currentInningsIndex || 0,
      innings: Array.isArray(m.innings) ? m.innings : [],
      result: m.result || null,
      createdAt: m.createdAt || new Date().toISOString(),
      updatedAt: m.updatedAt || new Date().toISOString(),
      completedAt: m.completedAt || null
    }));

    const normalizedEvents = {};
    if (data.events && typeof data.events === 'object') {
      Object.keys(data.events).forEach(matchId => {
        if (Array.isArray(data.events[matchId])) {
          normalizedEvents[matchId] = data.events[matchId];
        }
      });
    }

    return {
      isValid: true,
      normalized: {
        version: 1,
        teams: normalizedTeams,
        matches: normalizedMatches,
        events: normalizedEvents,
        metadata: {
          importedAt: new Date().toISOString(),
          originalMetadata: data.metadata || null
        }
      }
    };
  }
}
