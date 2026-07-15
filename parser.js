/**
 * Parser module for TonalScript (Enhanced)
 * Converts text notation string to array of note objects with chord support
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
  // With octave
  'DO2': 'C3', 'DO3': 'C4', 'DO4': 'C5', 'DO5': 'C6',
  'RE2': 'D3', 'RE3': 'D4', 'RE4': 'D5', 'RE5': 'D6',
  'MI2': 'E3', 'MI3': 'E4', 'MI4': 'E5', 'MI5': 'E6',
  'FA2': 'F3', 'FA3': 'F4', 'FA4': 'F5', 'FA5': 'F6',
  'SOL2': 'G3', 'SOL3': 'G4', 'SOL4': 'G5', 'SOL5': 'G6',
  'LA2': 'A3', 'LA3': 'A4', 'LA4': 'A5', 'LA5': 'A6',
  'SI2': 'B3', 'SI3': 'B4', 'SI4': 'B5', 'SI5': 'B6',
  'DA2': 'C3', 'DA3': 'C4', 'DA4': 'C5', 'DA5': 'C6',
  'NA2': 'A3', 'NA3': 'A4', 'NA4': 'A5', 'NA5': 'A6',
  'SA2': 'B3', 'SA3': 'B4', 'SA4': 'B5', 'SA5': 'B6',
  'MI2': 'E3', 'MI3': 'E4', 'MI4': 'E5', 'MI5': 'E6',
};

function mapNote(note) {
  const upper = note.toUpperCase().trim();
  if (NOTE_MAP[upper]) return NOTE_MAP[upper];
  if (/^[A-G][#b]?\d$/.test(upper)) return upper;
  return 'C4';
}

/**
 * Parse notation string to array of notes (supports chords with [])
 * @param {string} text - Input notation (e.g., "DA4:4, [DA4:4, MI4:4]")
 * @returns {Array<{note: string, duration: string, isChord: boolean}>}
 */
export function parseNotation(text) {
  if (!text || typeof text !== 'string') return [];

  const notes = [];
  let i = 0;

  while (i < text.length) {
    // Skip whitespace and commas
    while (i < text.length && (text[i] === ' ' || text[i] === ',' || text[i] === '\n')) i++;
    if (i >= text.length) break;

    // Check for chord [ ]
    if (text[i] === '[') {
      i++; // skip [
      const chordNotes = [];
      
      while (i < text.length && text[i] !== ']') {
        while (i < text.length && (text[i] === ' ' || text[i] === ',')) i++;
        if (i >= text.length || text[i] === ']') break;
        
        const noteStr = parseSingleNote(text, i);
        if (noteStr) {
          chordNotes.push(noteStr);
          i = noteStr.endIndex;
        } else {
          i++;
        }
      }
      
      if (text[i] === ']') i++; // skip ]
      
      // Add chord notes with same timing
      if (chordNotes.length > 0) {
        const duration = chordNotes[0].duration;
        chordNotes.forEach(n => {
          notes.push({ note: mapNote(n.note), duration: n.duration, isChord: true });
        });
      }
    } else {
      // Single note
      const noteStr = parseSingleNote(text, i);
      if (noteStr) {
        notes.push({ note: mapNote(noteStr.note), duration: noteStr.duration, isChord: false });
        i = noteStr.endIndex;
      } else {
        i++;
      }
    }
  }

  return notes;
}

function parseSingleNote(text, startIndex) {
  let i = startIndex;
  
  // Read note name (letters)
  let noteStart = i;
  while (i < text.length && /[A-Za-z]/.test(text[i])) i++;
  const note = text.slice(noteStart, i);
  
  if (!note) return null;
  
  // Read optional octave (digits)
  while (i < text.length && /\d/.test(text[i])) i++;
  const noteWithOctave = text.slice(noteStart, i);
  
  // Skip colon
  if (i >= text.length || text[i] !== ':') return null;
  i++; // skip :
  
  // Read duration
  let durStart = i;
  while (i < text.length && /[\d.]/.test(text[i])) i++;
  let duration = text.slice(durStart, i);
  
  // Convert to Tone.js format
  if (/^\d+\.?$/.test(duration)) {
    duration = duration + 'n';
  }
  
  // Skip optional 'n' or 'n.'
  while (i < text.length && (text[i] === 'n' || text[i] === '.')) i++;
  
  return { note: noteWithOctave, duration, endIndex: i };
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
