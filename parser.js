/**
 * Parser module for TonalScript
 * Converts text notation string to array of note objects
 */

/**
 * Parse notation string to array of ParsedNote objects
 * @param {string} text - Input notation (e.g., "DA:4, MI:2")
 * @returns {Array<{note: string, duration: string}>} Array of notes
 */
export function parseNotation(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const tokens = text.split(',');
  const notes = [];

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    const parts = trimmed.split(':');
    if (parts.length !== 2) {
      console.warn(`Invalid token format: "${trimmed}" - expected "NOTE:DURATION"`);
      continue;
    }

    const note = parts[0].toUpperCase();
    const durationRaw = parts[1].trim();

    if (!note || !durationRaw) {
      console.warn(`Empty note or duration in token: "${trimmed}"`);
      continue;
    }

    const duration = parseDuration(durationRaw);
    if (duration === null) {
      console.warn(`Invalid duration "${durationRaw}" in token: "${trimmed}"`);
      continue;
    }

    notes.push({ note, duration });
  }

  return notes;
}

/**
 * Parse duration string to Tone.js compatible format
 * @param {string} duration - Duration value (e.g., "4", "2.", "8n")
 * @returns {string|null} Tone.js duration format (e.g., "4n", "2n.") or null if invalid
 */
function parseDuration(duration) {
  if (!duration) return null;

  const cleanDuration = duration.trim().toLowerCase();

  if (cleanDuration.includes('n')) {
    if (/^\d+n\.?$/.test(cleanDuration)) {
      return cleanDuration;
    }
    return null;
  }

  if (/^\d+\.?$/.test(cleanDuration)) {
    return `${cleanDuration}n`;
  }

  return null;
}

/**
 * Validate notation string format
 * @param {string} text - Input notation to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
export function validateNotation(text) {
  const errors = [];

  if (!text || typeof text !== 'string') {
    return { valid: false, errors: ['Input is empty'] };
  }

  const tokens = text.split(',');

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    const parts = trimmed.split(':');
    if (parts.length !== 2) {
      errors.push(`Invalid format: "${trimmed}" (expected NOTE:DURATION)`);
      continue;
    }

    const note = parts[0].trim();
    const duration = parts[1].trim();

    if (!note) {
      errors.push(`Empty note in: "${trimmed}"`);
    }

    if (!duration) {
      errors.push(`Empty duration in: "${trimmed}"`);
    } else if (!/^\d+\.?n?\.?$/.test(duration) && !/^\d+\.?$/.test(duration)) {
      errors.push(`Invalid duration: "${duration}" in "${trimmed}"`);
    }
  }

  return { valid: errors.length === 0, errors };
}
