/**
 * TonalScript - Real Music Engine
 * 4-Track System: Melody, Chords, Bass, Drums
 */

// ==================== MUSIC THEORY ====================
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

const KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const CHORD_PROGRESSIONS = {
  pop: [
    [0, 4, 5, 3],   // I-V-vi-IV
    [0, 3, 4, 4],   // I-IV-V-V
    [0, 5, 3, 4],   // I-vi-IV-V
  ],
  jazz: [
    [0, 3, 4, 0],   // I-IV-V-I
    [0, 5, 1, 4],   // I-vi-ii-V
    [0, 4, 3, 0],   // I-V-IV-I
  ],
  blues: [
    [0, 0, 0, 0, 3, 3, 0, 0, 4, 4, 0, 0], // 12 bar blues
    [0, 0, 3, 3, 0, 0, 4, 3, 0, 0],
  ],
  rock: [
    [0, 3, 4, 0],   // I-IV-V-I
    [0, 0, 3, 4],   // I-I-IV-V
    [5, 4, 3, 4],   // vi-V-IV-V
  ],
  ambient: [
    [0, 3, 5, 4],   // I-IV-vi-V
    [0, 5, 3, 4],   // I-vi-IV-V
    [0, 2, 5, 4],   // I-iii-vi-V
  ],
  melancholic: [
    [0, 5, 3, 4],   // i-VI-III-VII (minor)
    [0, 3, 4, 0],   // i-III-IV-i
    [0, 6, 3, 4],   // i-VII-III-VII
  ]
};

const DRUM_PATTERNS = {
  basic: {
    kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0]
  },
  rock: {
    kick:  [1,0,0,0, 1,0,1,0, 1,0,0,0, 1,0,1,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0]
  },
  hiphop: {
    kick:  [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1]
  },
  electronic: {
    kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,1],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hihat: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0]
  },
  ballad: {
    kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hihat: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]
  }
};

// ==================== NOTE UTILITIES ====================
function noteToMidi(note) {
  const noteMap = {'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11};
  const match = note.match(/^([A-G])(#|b)?(\d)$/);
  if (!match) return 60;
  let midi = noteMap[match[1]];
  if (match[2] === '#') midi++;
  if (match[2] === 'b') midi--;
  midi += (parseInt(match[3]) + 1) * 12;
  return midi;
}

function midiToNote(midi) {
  const notes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const note = notes[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return note + octave;
}

function getScaleNotes(root, scaleType, octave = 4) {
  const rootMidi = noteToMidi(root + octave);
  const scale = SCALES[scaleType] || SCALES.major;
  return scale.map(interval => midiToNote(rootMidi + interval));
}

function getChord(root, type = 'major', octave = 4) {
  const rootMidi = noteToMidi(root + octave);
  const chords = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
    diminished: [0, 3, 6],
    augmented: [0, 4, 8],
    seventh: [0, 4, 7, 10],
    minorSeventh: [0, 3, 7, 10]
  };
  return (chords[type] || chords.major).map(interval => midiToNote(rootMidi + interval));
}

// ==================== SONG GENERATOR ====================
class SongGenerator {
  constructor() {
    this.key = 'C';
    this.scale = 'major';
    this.bpm = 120;
    this.genre = 'pop';
  }

  generate(genre = 'pop') {
    this.genre = genre;
    const settings = this.getGenreSettings(genre);
    this.key = settings.key;
    this.scale = settings.scale;
    this.bpm = settings.bpm;

    const progression = this.getProgression();
    const bars = settings.bars || 8;
    
    return {
      key: this.key,
      scale: this.scale,
      bpm: this.bpm,
      progression: progression,
      melody: this.generateMelody(progression, bars),
      chords: this.generateChords(progression, bars),
      bass: this.generateBass(progression, bars),
      drums: this.getDrumPattern(settings.drumPattern || 'basic'),
      bars: bars
    };
  }

  getGenreSettings(genre) {
    const settings = {
      pop: { key: 'C', scale: 'major', bpm: 120, bars: 8, drumPattern: 'basic' },
      rock: { key: 'E', scale: 'minor', bpm: 130, bars: 8, drumPattern: 'rock' },
      jazz: { key: 'Bb', scale: 'major', bpm: 110, bars: 8, drumPattern: 'ballad' },
      blues: { key: 'A', scale: 'blues', bpm: 90, bars: 12, drumPattern: 'basic' },
      electronic: { key: 'F', scale: 'minor', bpm: 128, bars: 8, drumPattern: 'electronic' },
      hiphop: { key: 'D', scale: 'minor', bpm: 90, bars: 8, drumPattern: 'hiphop' },
      ambient: { key: 'G', scale: 'pentatonic', bpm: 80, bars: 16, drumPattern: 'ballad' },
      classical: { key: 'C', scale: 'major', bpm: 100, bars: 16, drumPattern: 'ballad' },
      melancholic: { key: 'Am', scale: 'minor', bpm: 75, bars: 8, drumPattern: 'ballad' },
      happy: { key: 'D', scale: 'major', bpm: 135, bars: 8, drumPattern: 'basic' },
      romantic: { key: 'Eb', scale: 'major', bpm: 70, bars: 8, drumPattern: 'ballad' },
      workout: { key: 'G', scale: 'minor', bpm: 140, bars: 8, drumPattern: 'electronic' },
      tropical: { key: 'A', scale: 'major', bpm: 110, bars: 8, drumPattern: 'basic' },
      meditation: { key: 'F', scale: 'pentatonic', bpm: 60, bars: 16, drumPattern: 'ballad' },
      traditional: { key: 'G', scale: 'pentatonic', bpm: 100, bars: 8, drumPattern: 'basic' },
      gamelan: { key: 'D', scale: 'pentatonic', bpm: 85, bars: 8, drumPattern: 'basic' },
      koto: { key: 'E', scale: 'pentatonic', bpm: 90, bars: 8, drumPattern: 'ballad' },
      lofi: { key: 'Db', scale: 'major', bpm: 85, bars: 8, drumPattern: 'hiphop' },
      cinematic: { key: 'D', scale: 'minor', bpm: 95, bars: 16, drumPattern: 'rock' },
      scary: { key: 'F#', scale: 'minor', bpm: 70, bars: 8, drumPattern: 'ballad' }
    };
    return settings[genre] || settings.pop;
  }

  getProgression() {
    const progressions = CHORD_PROGRESSIONS[this.genre] || CHORD_PROGRESSIONS.pop;
    return progressions[Math.floor(Math.random() * progressions.length)];
  }

  generateMelody(progression, bars) {
    const notes = [];
    const scaleNotes = getScaleNotes(this.key, this.scale);
    const beatsPerBar = 4;
    const totalBeats = bars * beatsPerBar;

    let lastNoteIdx = Math.floor(scaleNotes.length / 2);
    
    for (let beat = 0; beat < totalBeats; beat++) {
      const bar = Math.floor(beat / beatsPerBar);
      const beatInBar = beat % beatsPerBar;
      const chordRoot = progression[bar % progression.length];
      const chordTonic = midiToNote(noteToMidi(this.key + '4') + SCALES[this.scale][chordRoot % 7]);

      // Rhythm - vary note lengths
      let duration = 4; // quarter note
      const rand = Math.random();
      if (beatInBar === 0) {
        duration = rand < 0.3 ? 2 : rand < 0.6 ? 4 : 8;
      } else {
        duration = rand < 0.4 ? 4 : rand < 0.7 ? 8 : 16;
      }

      // Melody movement - mostly stepwise with occasional leaps
      let movement;
      if (Math.random() < 0.7) {
        movement = Math.random() < 0.5 ? -1 : 1; // step
      } else {
        movement = Math.random() < 0.5 ? -2 : 2; // leap
      }
      
      lastNoteIdx = Math.max(0, Math.min(scaleNotes.length - 1, lastNoteIdx + movement));
      
      // Accent on downbeats
      const velocity = beatInBar === 0 ? 0.9 : 0.7 + Math.random() * 0.2;

      notes.push({
        note: scaleNotes[lastNoteIdx],
        duration: `${duration}n`,
        velocity: velocity,
        time: beat * (60 / this.bpm)
      });
    }

    return notes;
  }

  generateChords(progression, bars) {
    const chords = [];
    const beatsPerBar = 4;

    for (let bar = 0; bar < bars; bar++) {
      const chordIdx = progression[bar % progression.length];
      const rootNote = SCALES[this.scale][chordIdx % 7];
      const rootMidi = noteToMidi(this.key + '4') + rootNote;
      
      // Create chord voicing
      const chordType = this.scale === 'minor' ? 'minor' : 'major';
      const chordNotes = [
        midiToNote(rootMidi),
        midiToNote(rootMidi + (chordType === 'minor' ? 3 : 4)),
        midiToNote(rootMidi + 7)
      ];

      // Strum pattern
      chords.push({
        notes: chordNotes,
        duration: '1n',
        velocity: 0.7,
        time: bar * beatsPerBar * (60 / this.bpm),
        strum: true
      });
    }

    return chords;
  }

  generateBass(progression, bars) {
    const bass = [];
    const beatsPerBar = 4;

    for (let bar = 0; bar < bars; bar++) {
      const chordIdx = progression[bar % progression.length];
      const rootNote = SCALES[this.scale][chordIdx % 7];
      const bassMidi = noteToMidi(this.key + '2') + rootNote;
      const bassNote = midiToNote(bassMidi);

      // Bass pattern - root on 1 and 3
      for (let beat = 0; beat < beatsPerBar; beat++) {
        if (beat === 0 || beat === 2) {
          bass.push({
            note: bassNote,
            duration: '4n',
            velocity: beat === 0 ? 0.9 : 0.7,
            time: (bar * beatsPerBar + beat) * (60 / this.bpm)
          });
        }
      }
    }

    return bass;
  }

  getDrumPattern(patternName) {
    const pattern = DRUM_PATTERNS[patternName] || DRUM_PATTERNS.basic;
    return {
      kick: pattern.kick,
      snare: pattern.snare,
      hihat: pattern.hihat
    };
  }
}

// ==================== AUDIO ENGINE ====================
class MusicEngine {
  constructor() {
    this.melodySynth = null;
    this.chordSynth = null;
    this.bassSynth = null;
    this.kick = null;
    this.snare = null;
    this.hihat = null;
    this.isPlaying = false;
    this.scheduledEvents = [];
  }

  async init() {
    await Tone.start();

    // Melody synth
    this.melodySynth = new Tone.Synth({
      oscillator: { type: "sine", partials: [1, 0.5, 0.25] },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.5 },
      volume: -10
    }).toDestination();

    // Chord synth
    this.chordSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.1, decay: 0.5, sustain: 0.3, release: 1 },
      volume: -14
    }).toDestination();

    // Bass synth
    this.bassSynth = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.3 },
      volume: -8
    }).toDestination();

    // Drums using MonoSynth for kick, noise for snare/hihat
    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 8,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 },
      volume: -6
    }).toDestination();

    this.snare = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
      volume: -12
    }).toDestination();

    this.hihat = new Tone.MetalSynth({
      frequency: 400,
      envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
      volume: -18
    }).toDestination();
  }

  playSong(songData) {
    this.stop();
    const { melody, chords, bass, drums, bpm } = songData;
    
    Tone.Transport.bpm.value = bpm;
    const sixteenthTime = 60 / bpm / 4;

    // Schedule melody
    melody.forEach(({ note, duration, velocity, time }) => {
      const event = Tone.Transport.scheduleOnce((t) => {
        try { this.melodySynth.triggerAttackRelease(note, duration, t, velocity); } catch(e) {}
      }, `+${time}`);
      this.scheduledEvents.push(event);
    });

    // Schedule chords
    chords.forEach(({ notes, duration, velocity, time }) => {
      const event = Tone.Transport.scheduleOnce((t) => {
        try { this.chordSynth.triggerAttackRelease(notes, duration, t, velocity); } catch(e) {}
      }, `+${time}`);
      this.scheduledEvents.push(event);
    });

    // Schedule bass
    bass.forEach(({ note, duration, velocity, time }) => {
      const event = Tone.Transport.scheduleOnce((t) => {
        try { this.bassSynth.triggerAttackRelease(note, duration, t, velocity); } catch(e) {}
      }, `+${time}`);
      this.scheduledEvents.push(event);
    });

    // Schedule drums (16th note pattern)
    const totalSteps = drums.kick.length * 4;
    for (let i = 0; i < totalSteps; i++) {
      const step = i % 16;
      const time = i * sixteenthTime;
      
      if (drums.kick[step]) {
        const event = Tone.Transport.scheduleOnce((t) => {
          try { this.kick.triggerAttackRelease('C1', '8n', t); } catch(e) {}
        }, `+${time}`);
        this.scheduledEvents.push(event);
      }
      
      if (drums.snare[step]) {
        const event = Tone.Transport.scheduleOnce((t) => {
          try { this.snare.triggerAttackRelease('16n', t); } catch(e) {}
        }, `+${time}`);
        this.scheduledEvents.push(event);
      }
      
      if (drums.hihat[step]) {
        const event = Tone.Transport.scheduleOnce((t) => {
          try { this.hihat.triggerAttackRelease('32n', t); } catch(e) {}
        }, `+${time}`);
        this.scheduledEvents.push(event);
      }
    }

    Tone.Transport.start();
    this.isPlaying = true;
  }

  stop() {
    this.scheduledEvents.forEach(id => { try { Tone.Transport.clear(id); } catch(e) {} });
    this.scheduledEvents = [];
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    this.isPlaying = false;
  }
}

// ==================== EXPORT ENGINE ====================
class ExportEngine {
  static async export(songData, format = 'wav', duration = 30) {
    // Create recording synth
    const melodySynth = new Tone.Synth({
      oscillator: { type: "sine", partials: [1, 0.5, 0.25] },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.5 },
      volume: -10
    }).toDestination();

    const chordSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.1, decay: 0.5, sustain: 0.3, release: 1 },
      volume: -14
    }).toDestination();

    const bassSynth = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.3 },
      volume: -8
    }).toDestination();

    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.05, octaves: 8,
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 },
      volume: -6
    }).toDestination();

    const snare = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
      volume: -12
    }).toDestination();

    const hihat = new Tone.MetalSynth({
      frequency: 400,
      envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
      harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5,
      volume: -18
    }).toDestination();

    // Connect all to recorder
    const recorder = new Tone.Recorder();
    melodySynth.connect(recorder);
    chordSynth.connect(recorder);
    bassSynth.connect(recorder);
    kick.connect(recorder);
    snare.connect(recorder);
    hihat.connect(recorder);

    await recorder.start();
    Tone.Transport.bpm.value = songData.bpm;

    const { melody, chords, bass, drums } = songData;
    const sixteenthTime = 60 / songData.bpm / 4;
    const events = [];

    // Schedule all
    melody.forEach(({ note, duration, velocity, time }) => {
      if (time < duration) {
        events.push(Tone.Transport.scheduleOnce((t) => {
          try { melodySynth.triggerAttackRelease(note, duration, t, velocity); } catch(e) {}
        }, `+${time}`));
      }
    });

    chords.forEach(({ notes, duration, velocity, time }) => {
      if (time < duration) {
        events.push(Tone.Transport.scheduleOnce((t) => {
          try { chordSynth.triggerAttackRelease(notes, duration, t, velocity); } catch(e) {}
        }, `+${time}`));
      }
    });

    bass.forEach(({ note, duration, velocity, time }) => {
      if (time < duration) {
        events.push(Tone.Transport.scheduleOnce((t) => {
          try { bassSynth.triggerAttackRelease(note, duration, t, velocity); } catch(e) {}
        }, `+${time}`));
      }
    });

    const totalSteps = drums.kick.length * 4;
    for (let i = 0; i < totalSteps; i++) {
      const step = i % 16;
      const time = i * sixteenthTime;
      if (time > duration) break;
      
      if (drums.kick[step]) {
        events.push(Tone.Transport.scheduleOnce((t) => {
          try { kick.triggerAttackRelease('C1', '8n', t); } catch(e) {}
        }, `+${time}`));
      }
      if (drums.snare[step]) {
        events.push(Tone.Transport.scheduleOnce((t) => {
          try { snare.triggerAttackRelease('16n', t); } catch(e) {}
        }, `+${time}`));
      }
      if (drums.hihat[step]) {
        events.push(Tone.Transport.scheduleOnce((t) => {
          try { hihat.triggerAttackRelease('32n', t); } catch(e) {}
        }, `+${time}`));
      }
    }

    Tone.Transport.start();

    // Wait
    await new Promise(r => setTimeout(r, duration * 1000));

    // Stop & cleanup
    Tone.Transport.stop();
    events.forEach(id => { try { Tone.Transport.clear(id); } catch(e) {} });
    
    const recording = await recorder.stop();
    melodySynth.dispose();
    chordSynth.dispose();
    bassSynth.dispose();
    kick.dispose();
    snare.dispose();
    hihat.dispose();

    if (!recording) throw new Error('Recording failed');

    if (format === 'mp3') {
      return ExportEngine.wavToMp3(recording);
    }
    return new Blob([recording], { type: 'audio/wav' });
  }

  static async wavToMp3(wavBlob) {
    if (typeof lamejs === 'undefined') {
      console.warn('lamejs not loaded');
      return wavBlob;
    }

    const arrayBuffer = await wavBlob.arrayBuffer();
    const audioBuffer = await Tone.context.decodeAudioData(arrayBuffer);
    
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const L = audioBuffer.getChannelData(0);
    const R = numChannels > 1 ? audioBuffer.getChannelData(1) : L;
    
    const int16 = new Int16Array(L.length * numChannels);
    for (let i = 0; i < L.length; i++) {
      const l = Math.max(-1, Math.min(1, L[i]));
      const r = Math.max(-1, Math.min(1, R[i]));
      int16[i * numChannels] = l < 0 ? l * 0x8000 : l * 0x7FFF;
      int16[i * numChannels + 1] = r < 0 ? r * 0x8000 : r * 0x7FFF;
    }

    const encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, 192);
    const chunks = [];
    for (let i = 0; i < int16.length; i += 1152) {
      const buf = encoder.encodeBuffer(int16.subarray(i, i + 1152));
      if (buf.length > 0) chunks.push(buf);
    }
    chunks.push(encoder.flush());

    return new Blob(chunks, { type: 'audio/mp3' });
  }
}

export { SongGenerator, MusicEngine, ExportEngine, SCALES, KEYS };
