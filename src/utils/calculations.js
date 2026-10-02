/**
 * Safe numeric helper functions
 */
export function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return isNaN(parsed) ? fallback : parsed;
}
