/**
 * Generates a unique, URL-safe and Firestore-safe identifier with an optional prefix.
 * @param {string} prefix 
 * @returns {string}
 */
export function generateId(prefix = 'id') {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${randomPart}`;
}
