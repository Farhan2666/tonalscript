/**
 * TonalScript - Clean Audio Engine v2
 */

const INSTRUMENTS = {
  piano: {
    name: 'Piano',
    oscillator: { type: "sine", partials: [1, 0.5, 0.25] },
    envelope: { attack: 0.02, decay: 0.8, sustain: 0.2, release: 1.5 },
    volume: -8
  },
  guitar: {
    name: 'Guitar',
    oscillator: { type: "triangle" },
    envelope: { attack: 0.01, decay: 0.5, sustain: 0.3, release: 0.8 },
    volume: -10
  },
  bass: {
    name: 'Bass',
    oscillator: { type: "sine" },
    envelope: { attack: 0.01, decay: 0.4, sustain: 0.5, release: 0.5 },
    volume: -6
  },
  synth: {
    name: 'Synth Lead',
    oscillator: { type: "square", count: 2, spread: 5 },
    envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.6 },
    volume: -12
  },
  pad: {
    name: 'Pad',
    oscillator: { type: "sine", count: 3, spread: 10 },
    envelope: { attack: 1, decay: 0.5, sustain: 0.7, release: 2 },
    volume: -10
  },
  bells: {
    name: 'Bells',
    oscillator: { type: "sine", partials: [1, 0.3, 0.1, 0.05] },
    envelope: { attack: 0.01, decay: 2, sustain: 0, release: 3 },
    volume: -14
  },
  gamelan: {
    name: 'Gamelan',
    oscillator: { type: "sine", partials: [1, 0.8, 0.6, 0.4, 0.2] },
    envelope: { attack: 0.01, decay: 1, sustain: 0.1, release: 1.5 },
    volume: -8
  },
  koto: {
    name: 'Koto',
    oscillator: { type: "triangle", partials: [1, 0.6, 0.3] },
    envelope: { attack: 0.01, decay: 0.6, sustain: 0.15, release: 1 },
    volume: -10
  },
  strings: {
    name: 'Strings',
    oscillator: { type: "sawtooth", count: 4, spread: 8 },
    envelope: { attack: 0.5, decay: 0.3, sustain: 0.6, release: 1.5 },
    volume: -12
  },
  flute: {
    name: 'Flute',
    oscillator: { type: "sine", partials: [1, 0.5] },
    envelope: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.8 },
    volume: -12
  }
};

const NOTE_MAP = {
  // Octave 2 (Very Low)
  'C2': 'C2', 'D2': 'D2', 'E2': 'E2', 'F2': 'F2', 'G2': 'G2', 'A2': 'A2', 'B2': 'B2',
  'CS2': 'C#2', 'DS2': 'D#2', 'FS2': 'F#2', 'GS2': 'G#2', 'AS2': 'A#2',
  // Octave 3 (Low)
  'C3': 'C3', 'D3': 'D3', 'E3': 'E3', 'F3': 'F3', 'G3': 'G3', 'A3': 'A3', 'B3': 'B3',
  'CS3': 'C#3', 'DS3': 'D#3', 'FS3': 'F#3', 'GS3': 'G#3', 'AS3': 'A#3',
  // Octave 4 (Middle)
  'C4': 'C4', 'D4': 'D4', 'E4': 'E4', 'F4': 'F4', 'G4': 'G4', 'A4': 'A4', 'B4': 'B4',
  'CS4': 'C#4', 'DS4': 'D#4', 'FS4': 'F#4', 'GS4': 'G#4', 'AS4': 'A#4',
  // Octave 5 (High)
  'C5': 'C5', 'D5': 'D5', 'E5': 'E5', 'F5': 'F5', 'G5': 'G5', 'A5': 'A5', 'B5': 'B5',
  'CS5': 'C#5', 'DS5': 'D#5', 'FS5': 'F#5', 'GS5': 'G#5', 'AS5': 'A#5',
  // Octave 6 (Very High)
  'C6': 'C6', 'D6': 'D6', 'E6': 'E6', 'F6': 'F6', 'G6': 'G6', 'A6': 'A6', 'B6': 'B6',
  // Custom Names (Solfege)
  'DO': 'C4', 'RE': 'D4', 'MI': 'E4', 'FA': 'F4', 'SOL': 'G4', 'LA': 'A4', 'SI': 'B4',
  'DO2': 'C3', 'RE2': 'D3', 'MI2': 'E3', 'FA2': 'F3', 'SOL2': 'G3', 'LA2': 'A3', 'SI2': 'B3',
  'DO3': 'C4', 'RE3': 'D4', 'MI3': 'E4', 'FA3': 'F4', 'SOL3': 'G4', 'LA3': 'A4', 'SI3': 'B4',
  'DO4': 'C5', 'RE4': 'D5', 'MI4': 'E5', 'FA4': 'F5', 'SOL4': 'G5', 'LA4': 'A5', 'SI4': 'B5',
  'DO5': 'C6', 'RE5': 'D6', 'MI5': 'E6', 'FA5': 'F6', 'SOL5': 'G6', 'LA5': 'A6', 'SI5': 'B6',
};

class CleanAudioEngine {
  constructor() {
    this.synth = null;
    this.currentInstrument = 'piano';
    this.isPlaying = false;
    this.scheduledEvents = [];
  }

  async init() {
    await Tone.start();
    this.createSynth('piano');
  }

  createSynth(instrumentKey) {
    const inst = INSTRUMENTS[instrumentKey] || INSTRUMENTS.piano;
    this.currentInstrument = instrumentKey;

    if (this.synth) {
      this.synth.disconnect();
      this.synth.dispose();
    }

    this.synth = new Tone.Synth({
      oscillator: inst.oscillator,
      envelope: inst.envelope,
      volume: inst.volume || -10
    }).toDestination();

    console.log('Synth created:', instrumentKey);
  }

  setInstrument(key) {
    if (INSTRUMENTS[key]) {
      this.createSynth(key);
    }
  }

  parseNotation(text) {
    if (!text) return [];
    const notes = [];
    const parts = text.split(',');
    
    for (const part of parts) {
      const trimmed = part.trim().replace(/[\[\]]/g, '');
      if (!trimmed) continue;
      
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;
      
      const noteStr = trimmed.substring(0, colonIndex).toUpperCase().trim();
      let durStr = trimmed.substring(colonIndex + 1).trim();
      
      // Convert duration
      if (/^\d+\.?$/.test(durStr)) durStr = durStr + 'n';
      
      // Get note from map
      const note = NOTE_MAP[noteStr] || ( /^[A-G][#b]?\d$/.test(noteStr) ? noteStr : null);
      
      if (note && durStr.match(/^\d+n\.?$/)) {
        notes.push({ note, duration: durStr });
      }
    }
    
    return notes;
  }

  playNotes(notes, bpm) {
    if (!this.synth) return;
    this.stop();

    Tone.Transport.bpm.value = bpm;
    const noteSpacing = 60 / bpm; // seconds per beat

    notes.forEach(({ note, duration }, i) => {
      const time = `+${i * noteSpacing * 0.5}`;
      
      const eventId = Tone.Transport.scheduleOnce((t) => {
        if (this.synth && this.synth.context.state === 'running') {
          this.synth.triggerAttackRelease(note, duration, t);
        }
      }, time);
      
      this.scheduledEvents.push(eventId);
    });

    Tone.Transport.start();
    this.isPlaying = true;
  }

  stop() {
    this.scheduledEvents.forEach(id => {
      try { Tone.Transport.clear(id); } catch(e) {}
    });
    this.scheduledEvents = [];
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    this.isPlaying = false;
  }

  dispose() {
    this.stop();
    if (this.synth) {
      this.synth.disconnect();
      this.synth.dispose();
      this.synth = null;
    }
  }
}

export { CleanAudioEngine, INSTRUMENTS, NOTE_MAP };
