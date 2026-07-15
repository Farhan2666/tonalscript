/**
 * Parser module for TonalScript
 * Converts text notation string to array of note objects
 */

/**
 * Map custom note names to Tone.js compatible note names
 */
const NOTE_MAP = {
  'DO': 'C4', 'DA': 'C4',
  'RE': 'D4', 'RA': 'D4',
  'MI': 'E4', 'MA': 'E4',
  'FA': 'F4', 'PA': 'F4',
  'SOL': 'G4', 'GA': 'G4',
  'LA': 'A4', 'NA': 'A4',
  'SI': 'B4', 'SA': 'B4', 'NI': 'B4',
  'DHA': 'A#4',
  // Octave variations
  'DO2': 'C3', 'DO3': 'C4', 'DO4': 'C5', 'DO5': 'C6',
  'RE2': 'D3', 'RE3': 'D4', 'RE4': 'D5', 'RE5': 'D6',
  'MI2': 'E3', 'MI3': 'E4', 'MI4': 'E5', 'MI5': 'E6',
  'FA2': 'F3', 'FA3': 'F4', 'FA4': 'F5', 'FA5': 'F6',
  'SOL2': 'G3', 'SOL3': 'G4', 'SOL4': 'G5', 'SOL5': 'G6',
  'LA2': 'A3', 'LA3': 'A4', 'LA4': 'A5', 'LA5': 'A6',
  'SI2': 'B3', 'SI3': 'B4', 'SI4': 'B5', 'SI5': 'B6',
};

/**
 * Convert custom note name to Tone.js note
 * @param {string} note - Custom note name (e.g., "DA", "MI", "SOL")
 * @returns {string} Tone.js note (e.g., "C4", "E4", "G4")
 */
function mapNoteToTone(note) {
  const upperNote = note.toUpperCase().trim();
  
  if (NOTE_MAP[upperNote]) {
    return NOTE_MAP[upperNote];
  }
  
  // If it's already a valid Tone.js note (like C4, D#5), return as is
  if (/^[A-G][#b]?\d$/.test(upperNote)) {
    return upperNote;
  }
  
  // Default to C4 if unknown
  console.warn(`Unknown note "${note}", defaulting to C4`);
  return 'C4';
}

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

    const rawNote = parts[0].trim();
    const durationRaw = parts[1].trim();

    if (!rawNote || !durationRaw) {
      console.warn(`Empty note or duration in token: "${trimmed}"`);
      continue;
    }

    const note = mapNoteToTone(rawNote);
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
