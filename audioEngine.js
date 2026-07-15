/**
 * TonalScript - Enhanced Audio Engine with Multiple Instruments
 */

// Instrument presets
const INSTRUMENTS = {
  // Traditional
  gamelan: {
    name: 'Gamelan',
    type: 'traditional',
    synth: { oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.5 } },
    effects: { reverb: 2, delay: 0.2, delayTime: "8n" }
  },
  koto: {
    name: 'Koto',
    type: 'traditional',
    synth: { oscillator: { type: "triangle" }, envelope: { attack: 0.02, decay: 0.2, sustain: 0.1, release: 0.4 } },
    effects: { reverb: 2.5, delay: 0.25, delayTime: "8n" }
  },
  shamisen: {
    name: 'Shamisen',
    type: 'traditional',
    synth: { oscillator: { type: "square" }, envelope: { attack: 0.01, decay: 0.15, sustain: 0.05, release: 0.3 } },
    effects: { reverb: 1.5, delay: 0.15, delayTime: "16n" }
  },
  // Modern
  piano: {
    name: 'Piano',
    type: 'modern',
    synth: { oscillator: { type: "triangle" }, envelope: { attack: 0.01, decay: 0.5, sustain: 0.3, release: 0.8 } },
    effects: { reverb: 1.5, delay: 0.1, delayTime: "8n" }
  },
  guitar: {
    name: 'Guitar',
    type: 'modern',
    synth: { oscillator: { type: "sawtooth" }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.5 } },
    effects: { reverb: 1, delay: 0.15, delayTime: "8n" }
  },
  bass: {
    name: 'Bass',
    type: 'modern',
    synth: { oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.4, sustain: 0.4, release: 0.6 } },
    effects: { reverb: 0.5, delay: 0, delayTime: "8n" }
  },
  synth: {
    name: 'Synth',
    type: 'modern',
    synth: { oscillator: { type: "square" }, envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 0.5 } },
    effects: { reverb: 2, delay: 0.25, delayTime: "8n" }
  },
  pad: {
    name: 'Ambient Pad',
    type: 'ambient',
    synth: { oscillator: { type: "sine" }, envelope: { attack: 0.8, decay: 0.5, sustain: 0.6, release: 2 } },
    effects: { reverb: 4, delay: 0.3, delayTime: "4n" }
  },
  strings: {
    name: 'Strings',
    type: 'ambient',
    synth: { oscillator: { type: "sawtooth" }, envelope: { attack: 0.3, decay: 0.3, sustain: 0.5, release: 1 } },
    effects: { reverb: 3, delay: 0.2, delayTime: "8n" }
  },
  bells: {
    name: 'Bells',
    type: 'ambient',
    synth: { oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 1, sustain: 0, release: 2 } },
    effects: { reverb: 3.5, delay: 0.35, delayTime: "4n" }
  }
};

// Note mapping
const NOTE_MAP = {
  'DO': 'C4', 'DA': 'C4', 'RE': 'D4', 'RA': 'D4',
  'MI': 'E4', 'MA': 'E4', 'FA': 'F4', 'PA': 'F4',
  'SOL': 'G4', 'GA': 'G4', 'LA': 'A4', 'NA': 'A4',
  'SI': 'B4', 'SA': 'B4', 'NI': 'B4', 'DHA': 'A#4',
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
};

class AudioEngine {
  constructor() {
    this.synth = null;
    this.reverb = null;
    this.delay = null;
    this.currentInstrument = 'piano';
    this.isPlaying = false;
    this.scheduledEvents = [];
  }

  async init() {
    await Tone.start();
    this.createSynth('piano');
  }

  createSynth(instrumentKey) {
    const instrument = INSTRUMENTS[instrumentKey] || INSTRUMENTS.piano;
    this.currentInstrument = instrumentKey;

    // Dispose old nodes
    if (this.synth) this.synth.dispose();
    if (this.reverb) this.reverb.dispose();
    if (this.delay) this.delay.dispose();

    // Create new synth
    this.synth = new Tone.Synth(instrument.synth).toDestination();

    // Create reverb
    this.reverb = new Tone.Reverb({
      decay: instrument.effects.reverb,
      wet: 0.3
    }).toDestination();

    // Create delay
    if (instrument.effects.delay > 0) {
      this.delay = new Tone.FeedbackDelay({
        delayTime: instrument.effects.delayTime,
        feedback: 0.2,
        wet: instrument.effects.delay
      }).toDestination();
      this.synth.chain(this.delay, this.reverb);
    } else {
      this.synth.connect(this.reverb);
    }
  }

  setInstrument(key) {
    if (INSTRUMENTS[key]) {
      this.createSynth(key);
    }
  }

  mapNote(note) {
    const upper = note.toUpperCase().trim();
    if (NOTE_MAP[upper]) return NOTE_MAP[upper];
    if (/^[A-G][#b]?\d$/.test(upper)) return upper;
    return 'C4';
  }

  parseNotation(text) {
    if (!text) return [];
    const notes = [];
    const tokens = text.split(',');
    for (const token of tokens) {
      const trimmed = token.trim();
      if (!trimmed || trimmed === '[' || trimmed === ']') continue;
      const parts = trimmed.split(':');
      if (parts.length !== 2) continue;
      const note = this.mapNote(parts[0]);
      let dur = parts[1].trim().replace(/\]/g, '');
      if (/^\d+\.?$/.test(dur)) dur = dur + 'n';
      if (/^\d+n\.?$/.test(dur) || /^\d+n$/.test(dur)) {
        notes.push({ note, duration: dur });
      }
    }
    return notes;
  }

  playNotes(notes, bpm) {
    if (!this.synth) return;

    this.stop();
    Tone.Transport.bpm.value = bpm;

    notes.forEach(({ note, duration }, i) => {
      const eventId = Tone.Transport.scheduleOnce((time) => {
        try {
          this.synth.triggerAttackRelease(note, duration, time);
        } catch (err) {
          console.warn('Note error:', note, err);
        }
      }, `+${i * 0.4}`);
      this.scheduledEvents.push(eventId);
    });

    Tone.Transport.start();
    this.isPlaying = true;
  }

  stop() {
    this.scheduledEvents.forEach(id => Tone.Transport.clear(id));
    this.scheduledEvents = [];
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    this.isPlaying = false;
  }

  getInstruments() {
    return Object.entries(INSTRUMENTS).map(([key, val]) => ({
      id: key,
      name: val.name,
      type: val.type
    }));
  }
}

export { AudioEngine, INSTRUMENTS, NOTE_MAP };
