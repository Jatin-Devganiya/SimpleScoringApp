/**
 * Formats cricket legal balls into over format (e.g. 7 balls -> "1.1", 12 balls -> "2.0")
 * Never relies on floating point math.
 * @param {number} legalBalls 
 * @returns {string}
 */
export function formatOvers(legalBalls = 0) {
  const safeBalls = Math.max(0, parseInt(legalBalls, 10) || 0);
  const completedOvers = Math.floor(safeBalls / 6);
  const remainingBalls = safeBalls % 6;
  return `${completedOvers}.${remainingBalls}`;
}

/**
 * Calculates Run Rate (runs per over)
 * @param {number} runs 
 * @param {number} legalBalls 
 * @returns {string}
 */
export function calculateRunRate(runs = 0, legalBalls = 0) {
  if (!legalBalls || legalBalls <= 0) return '0.00';
  const overs = legalBalls / 6;
  return (runs / overs).toFixed(2);
}

/**
 * Calculates Strike Rate (runs per 100 balls)
 * @param {number} runs 
 * @param {number} balls 
 * @returns {string}
 */
export function calculateStrikeRate(runs = 0, balls = 0) {
  if (!balls || balls <= 0) return '0.00';
  return ((runs / balls) * 100).toFixed(2);
}

/**
 * Calculates Bowling Economy Rate (runs conceded per over)
 * @param {number} runs 
 * @param {number} legalBalls 
 * @returns {string}
 */
export function calculateEconomy(runs = 0, legalBalls = 0) {
  if (!legalBalls || legalBalls <= 0) return '0.00';
  const overs = legalBalls / 6;
  return (runs / overs).toFixed(2);
}

/**
 * Calculates Required Run Rate (RRR)
 * Formula: Required Runs / Remaining Legal Balls * 6
 * @param {number} targetRuns 
 * @param {number} currentRuns 
 * @param {number} totalOvers 
 * @param {number} currentLegalBalls 
 * @returns {string|null}
 */
export function calculateRequiredRunRate(targetRuns, currentRuns, totalOvers, currentLegalBalls) {
  if (targetRuns === undefined || targetRuns === null) return null;
  const remainingRuns = targetRuns - currentRuns;
  const totalMaxBalls = (totalOvers || 20) * 6;
  const remainingBalls = Math.max(0, totalMaxBalls - currentLegalBalls);

  if (remainingRuns <= 0) return '0.00';
  if (remainingBalls === 0) return 'N/A';

  return ((remainingRuns / remainingBalls) * 6).toFixed(2);
}

/**
 * Formats ISO timestamp to human-friendly local date/time
 * @param {string} isoString 
 * @returns {string}
 */
export function formatDateTime(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}
