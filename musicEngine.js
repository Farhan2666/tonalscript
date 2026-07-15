/**
 * TonalScript - Genre-Specific Music Engine
 * Each genre has unique melody patterns, chord voicings, bass grooves, and drum patterns
 */

// ==================== MUSIC THEORY ====================
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

function noteToMidi(note) {
  const match = note.match(/^([A-G])(#|b)?(\d)$/);
  if (!match) return 60;
  const base = {'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}[match[1]];
  const sharp = match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0;
  return base + sharp + (parseInt(match[3]) + 1) * 12;
}

function midiToNote(midi) {
  return NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
}

function getScale(root, type, octave = 4) {
  const rootMidi = noteToMidi(root + octave);
  const scales = {
    major: [0,2,4,5,7,9,11],
    minor: [0,2,3,5,7,8,10],
    pentatonic: [0,2,4,7,9],
    blues: [0,3,5,6,7,10],
    dorian: [0,2,3,5,7,9,10],
    mixolydian: [0,2,4,5,7,9,10],
    harmonicMinor: [0,2,3,5,7,8,11]
  };
  return (scales[type] || scales.major).map(i => midiToNote(rootMidi + i));
}

// ==================== GENRE DEFINITIONS ====================
const GENRES = {
  pop: {
    key: 'C', scale: 'major', bpm: 120,
    instrument: 'piano',
    melodyPattern: [
      {note:'E4',dur:'4n',vel:0.8}, {note:'D4',dur:'4n',vel:0.7},
      {note:'C4',dur:'4n',vel:0.8}, {note:'D4',dur:'4n',vel:0.7},
      {note:'E4',dur:'4n',vel:0.8}, {note:'E4',dur:'4n',vel:0.8},
      {note:'E4',dur:'2n',vel:0.9}
    ],
    chordPattern: [
      {chord:['C4','E4','G4'], dur:'2n'}, {chord:['G3','B3','D4'], dur:'2n'},
      {chord:['A3','C4','E4'], dur:'2n'}, {chord:['F3','A3','C4'], dur:'2n'}
    ],
    bassPattern: [
      {note:'C2',dur:'4n'}, {note:'C2',dur:'4n'}, {note:'G2',dur:'4n'}, {note:'G2',dur:'4n'},
      {note:'A2',dur:'4n'}, {note:'A2',dur:'4n'}, {note:'F2',dur:'4n'}, {note:'F2',dur:'4n'}
    ],
    drums: {kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hihat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0]}
  },
  
  rock: {
    key: 'E', scale: 'minor', bpm: 135,
    instrument: 'guitar',
    melodyPattern: [
      {note:'E4',dur:'8n',vel:0.9}, {note:'E4',dur:'8n',vel:0.8}, {note:'G4',dur:'4n',vel:0.9},
      {note:'A4',dur:'4n',vel:0.8}, {note:'G4',dur:'4n',vel:0.9}, {note:'E4',dur:'4n',vel:0.8}
    ],
    chordPattern: [
      {chord:['E3','G3','B3'], dur:'4n'}, {chord:['A3','C4','E4'], dur:'4n'},
      {chord:['B3','D4','F4'], dur:'4n'}, {chord:['A3','C4','E4'], dur:'4n'}
    ],
    bassPattern: [
      {note:'E2',dur:'8n'}, {note:'E2',dur:'8n'}, {note:'E2',dur:'4n'},
      {note:'A2',dur:'8n'}, {note:'A2',dur:'8n'}, {note:'A2',dur:'4n'},
      {note:'B2',dur:'8n'}, {note:'B2',dur:'8n'}, {note:'B2',dur:'4n'}
    ],
    drums: {kick:[1,0,0,0,1,0,1,0,1,0,0,0,1,0,1,0], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hihat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0]}
  },
  
  jazz: {
    key: 'Bb', scale: 'major', bpm: 110,
    instrument: 'sax',
    melodyPattern: [
      {note:'D4',dur:'8n',vel:0.7}, {note:'F4',dur:'8n',vel:0.8}, {note:'A4',dur:'4n',vel:0.9},
      {note:'G4',dur:'8n',vel:0.7}, {note:'F4',dur:'4n',vel:0.8}, {note:'D4',dur:'4n',vel:0.7}
    ],
    chordPattern: [
      {chord:['Bb3','D4','F4','A4'], dur:'2n'}, {chord:['Eb3','G3','Bb3','D4'], dur:'2n'},
      {chord:['F3','A3','C4','Eb4'], dur:'2n'}, {chord:['Bb3','D4','F4'], dur:'2n'}
    ],
    bassPattern: [
      {note:'Bb2',dur:'4n'}, {note:'D3',dur:'8n'}, {note:'F3',dur:'8n'},
      {note:'Eb2',dur:'4n'}, {note:'G2',dur:'8n'}, {note:'Bb2',dur:'8n'}
    ],
    drums: {kick:[1,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hihat:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]}
  },
  
  blues: {
    key: 'A', scale: 'blues', bpm: 90,
    instrument: 'guitar',
    melodyPattern: [
      {note:'A3',dur:'4n',vel:0.8}, {note:'C4',dur:'4n',vel:0.9},
      {note:'Eb4',dur:'8n',vel:0.7}, {note:'E4',dur:'4n',vel:0.9},
      {note:'G4',dur:'4n',vel:0.8}, {note:'E4',dur:'4n',vel:0.9}
    ],
    chordPattern: [
      {chord:['A3','C4','E4'], dur:'4n'}, {chord:['A3','C4','E4'], dur:'4n'},
      {chord:['D3','F3','A3'], dur:'4n'}, {chord:['D3','F3','A3'], dur:'4n'},
      {chord:['A3','C4','E4'], dur:'4n'}, {chord:['E3','G3','B3'], dur:'4n'},
      {chord:['D3','F3','A3'], dur:'4n'}, {chord:['A3','C4','E4'], dur:'4n'}
    ],
    bassPattern: [
      {note:'A2',dur:'4n'}, {note:'A2',dur:'8n'}, {note:'A2',dur:'8n'},
      {note:'D2',dur:'4n'}, {note:'D2',dur:'8n'}, {note:'D2',dur:'8n'}
    ],
    drums: {kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hihat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0]}
  },
  
  hiphop: {
    key: 'D', scale: 'minor', bpm: 85,
    instrument: 'synth',
    melodyPattern: [
      {note:'D4',dur:'8n',vel:0.9}, {note:'F4',dur:'8n',vel:0.7}, {note:'A4',dur:'4n',vel:0.8},
      {note:'G4',dur:'8n',vel:0.6}, {note:'F4',dur:'4n',vel:0.7}, {note:'D4',dur:'4n',vel:0.8}
    ],
    chordPattern: [
      {chord:['D3','F3','A3'], dur:'2n'}, {chord:['Bb3','D4','F4'], dur:'2n'},
      {chord:['G3','B3','D4'], dur:'2n'}, {chord:['A3','C4','E4'], dur:'2n'}
    ],
    bassPattern: [
      {note:'D2',dur:'4n'}, {note:'D2',dur:'8n'}, {note:'rest',dur:'8n'},
      {note:'D2',dur:'8n'}, {note:'D2',dur:'4n'}
    ],
    drums: {kick:[1,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hihat:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]}
  },
  
  electronic: {
    key: 'F', scale: 'minor', bpm: 128,
    instrument: 'synth',
    melodyPattern: [
      {note:'F4',dur:'8n',vel:0.9}, {note:'G4',dur:'8n',vel:0.7}, {note:'Ab4',dur:'8n',vel:0.8},
      {note:'Bb4',dur:'4n',vel:0.9}, {note:'Ab4',dur:'8n',vel:0.7}, {note:'F4',dur:'4n',vel:0.8}
    ],
    chordPattern: [
      {chord:['F3','Ab3','C4'], dur:'4n'}, {chord:['Db3','F3','Ab3'], dur:'4n'},
      {chord:['Eb3','G3','Bb3'], dur:'4n'}, {chord:['C3','E3','G3'], dur:'4n'}
    ],
    bassPattern: [
      {note:'F2',dur:'8n'}, {note:'F2',dur:'8n'}, {note:'F2',dur:'4n'},
      {note:'Db2',dur:'8n'}, {note:'Db2',dur:'8n'}, {note:'Db2',dur:'4n'}
    ],
    drums: {kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hihat:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0]}
  },
  
  ambient: {
    key: 'G', scale: 'pentatonic', bpm: 70,
    instrument: 'pad',
    melodyPattern: [
      {note:'G4',dur:'2n',vel:0.5}, {note:'B4',dur:'2n',vel:0.4},
      {note:'D5',dur:'1n',vel:0.3}, {note:'A4',dur:'2n',vel:0.4}
    ],
    chordPattern: [
      {chord:['G3','B3','D4'], dur:'1n'}, {chord:['Em3','G3','B3'], dur:'1n'},
      {chord:['C3','E3','G3'], dur:'1n'}, {chord:['D3','F#3','A3'], dur:'1n'}
    ],
    bassPattern: [
      {note:'G2',dur:'1n'}, {note:'E2',dur:'1n'},
      {note:'C2',dur:'1n'}, {note:'D2',dur:'1n'}
    ],
    drums: {kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], snare:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], hihat:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0]}
  },
  
  classical: {
    key: 'C', scale: 'major', bpm: 100,
    instrument: 'strings',
    melodyPattern: [
      {note:'C4',dur:'4n',vel:0.7}, {note:'D4',dur:'4n',vel:0.7},
      {note:'E4',dur:'4n',vel:0.8}, {note:'F4',dur:'4n',vel:0.7},
      {note:'G4',dur:'2n',vel:0.9}, {note:'E4',dur:'2n',vel:0.7}
    ],
    chordPattern: [
      {chord:['C4','E4','G4'], dur:'2n'}, {chord:['F3','A3','C4'], dur:'2n'},
      {chord:['G3','B3','D4'], dur:'2n'}, {chord:['C4','E4','G4'], dur:'2n'}
    ],
    bassPattern: [
      {note:'C2',dur:'2n'}, {note:'F2',dur:'2n'},
      {note:'G2',dur:'2n'}, {note:'C2',dur:'2n'}
    ],
    drums: {kick:[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], snare:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], hihat:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0]}
  },
  
  lofi: {
    key: 'Db', scale: 'major', bpm: 80,
    instrument: 'piano',
    melodyPattern: [
      {note:'F4',dur:'8n',vel:0.6}, {note:'Ab4',dur:'8n',vel:0.5},
      {note:'Bb4',dur:'4n',vel:0.7}, {note:'Ab4',dur:'4n',vel:0.5},
      {note:'F4',dur:'4n',vel:0.6}
    ],
    chordPattern: [
      {chord:['Db3','F3','Ab3'], dur:'2n'}, {chord:['Gb3','Bb3','Db4'], dur:'2n'},
      {chord:['Ab3','C4','Eb4'], dur:'2n'}, {chord:['Db3','F3','Ab3'], dur:'2n'}
    ],
    bassPattern: [
      {note:'Db2',dur:'2n'}, {note:'Gb2',dur:'2n'},
      {note:'Ab2',dur:'2n'}, {note:'Db2',dur:'2n'}
    ],
    drums: {kick:[1,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hihat:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]}
  },
  
  cinematic: {
    key: 'D', scale: 'minor', bpm: 95,
    instrument: 'strings',
    melodyPattern: [
      {note:'D4',dur:'4n',vel:0.6}, {note:'F4',dur:'4n',vel:0.7},
      {note:'A4',dur:'2n',vel:0.9}, {note:'G4',dur:'4n',vel:0.7},
      {note:'F4',dur:'4n',vel:0.8}
    ],
    chordPattern: [
      {chord:['D3','F3','A3'], dur:'2n'}, {chord:['Bb3','D4','F4'], dur:'2n'},
      {chord:['G3','B3','D4'], dur:'2n'}, {chord:['A3','C4','E4'], dur:'2n'}
    ],
    bassPattern: [
      {note:'D2',dur:'2n'}, {note:'Bb2',dur:'2n'},
      {note:'G2',dur:'2n'}, {note:'A2',dur:'2n'}
    ],
    drums: {kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hihat:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0]}
  },
  
  romantic: {
    key: 'Eb', scale: 'major', bpm: 68,
    instrument: 'piano',
    melodyPattern: [
      {note:'G4',dur:'4n',vel:0.5}, {note:'Bb4',dur:'4n',vel:0.6},
      {note:'Eb5',dur:'2n',vel:0.7}, {note:'D5',dur:'4n',vel:0.6},
      {note:'Bb4',dur:'4n',vel:0.5}
    ],
    chordPattern: [
      {chord:['Eb3','G3','Bb3'], dur:'2n'}, {chord:['Ab3','C4','Eb4'], dur:'2n'},
      {chord:['Bb3','D4','F4'], dur:'2n'}, {chord:['Eb3','G3','Bb3'], dur:'2n'}
    ],
    bassPattern: [
      {note:'Eb2',dur:'2n'}, {note:'Ab2',dur:'2n'},
      {note:'Bb2',dur:'2n'}, {note:'Eb2',dur:'2n'}
    ],
    drums: {kick:[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], snare:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], hihat:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0]}
  },
  
  meditation: {
    key: 'F', scale: 'pentatonic', bpm: 55,
    instrument: 'bells',
    melodyPattern: [
      {note:'F4',dur:'1n',vel:0.3}, {note:'A4',dur:'1n',vel:0.2},
      {note:'C5',dur:'2n',vel:0.2}, {note:'A4',dur:'1n',vel:0.2}
    ],
    chordPattern: [
      {chord:['F3','A3','C4'], dur:'2n'}, {chord:['C3','E3','G3'], dur:'2n'}
    ],
    bassPattern: [
      {note:'F2',dur:'2n'}, {note:'C2',dur:'2n'}
    ],
    drums: {kick:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], snare:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], hihat:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}
  },
  
  tropical: {
    key: 'A', scale: 'major', bpm: 115,
    instrument: 'guitar',
    melodyPattern: [
      {note:'A4',dur:'8n',vel:0.8}, {note:'B4',dur:'8n',vel:0.7},
      {note:'C#5',dur:'4n',vel:0.9}, {note:'B4',dur:'4n',vel:0.7},
      {note:'A4',dur:'4n',vel:0.8}
    ],
    chordPattern: [
      {chord:['A3','C#4','E4'], dur:'4n'}, {chord:['D3','F#3','A3'], dur:'4n'},
      {chord:['E3','G#3','B3'], dur:'4n'}, {chord:['A3','C#4','E4'], dur:'4n'}
    ],
    bassPattern: [
      {note:'A2',dur:'4n'}, {note:'A2',dur:'8n'}, {note:'A2',dur:'8n'},
      {note:'D2',dur:'4n'}, {note:'E2',dur:'4n'}
    ],
    drums: {kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hihat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0]}
  }
};

// Add missing genres with defaults
['scary','workout','koto','gamelan','traditional'].forEach(g => {
  if (!GENRES[g]) GENRES[g] = {...GENRES.ambient, key: 'C', scale: 'minor', bpm: 90};
});

// ==================== SONG GENERATOR ====================
class SongGenerator {
  generate(genre) {
    const g = GENRES[genre] || GENRES.pop;
    const bars = 8;
    
    // Repeat patterns to fill bars
    const melody = this.repeatPattern(g.melodyPattern, bars, g.bpm);
    const chords = this.repeatChordPattern(g.chordPattern, bars, g.bpm);
    const bass = this.repeatPattern(g.bassPattern, bars, g.bpm);
    
    return {
      key: g.key,
      scale: g.scale,
      bpm: g.bpm,
      genre: genre,
      instrument: g.instrument,
      melody: melody,
      chords: chords,
      bass: bass,
      drums: g.drums,
      bars: bars
    };
  }
  
  repeatPattern(pattern, bars, bpm) {
    const result = [];
    const beatTime = 60 / bpm;
    let time = 0;
    
    for (let bar = 0; bar < bars; bar++) {
      for (const item of pattern) {
        if (item.note === 'rest') {
          time += this.getDuration(item.dur, beatTime);
          continue;
        }
        result.push({
          note: item.note,
          duration: item.dur,
          velocity: item.vel || 0.7,
          time: time
        });
        time += this.getDuration(item.dur, beatTime);
      }
    }
    return result;
  }
  
  repeatChordPattern(pattern, bars, bpm) {
    const result = [];
    const beatTime = 60 / bpm;
    let time = 0;
    
    for (let bar = 0; bar < bars; bar++) {
      const p = pattern[bar % pattern.length];
      result.push({
        notes: p.chord,
        duration: p.dur,
        velocity: 0.6,
        time: time
      });
      time += this.getDuration(p.dur, beatTime);
    }
    return result;
  }
  
  getDuration(dur, beatTime) {
    const map = {'1n':4,'2n':2,'4n':1,'8n':0.5,'16n':0.25};
    return (map[dur] || 1) * beatTime;
  }
}

// ==================== AUDIO ENGINE ====================
class MusicEngine {
  constructor() {
    this.synths = {};
    this.isPlaying = false;
    this.events = [];
  }
  
  async init() {
    await Tone.start();
    
    // Melody
    this.synths.melody = new Tone.Synth({
      oscillator: { type: "sine", partials: [1, 0.5, 0.25] },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.5 },
      volume: -10
    }).toDestination();
    
    // Chords
    this.synths.chords = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.1, decay: 0.5, sustain: 0.3, release: 1 },
      volume: -16
    }).toDestination();
    
    // Bass
    this.synths.bass = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.3 },
      volume: -8
    }).toDestination();
    
    // Drums
    this.synths.kick = new Tone.MembraneSynth({
      pitchDecay: 0.05, octaves: 8,
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 },
      volume: -6
    }).toDestination();
    
    this.synths.snare = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0 },
      volume: -14
    }).toDestination();
    
    this.synths.hihat = new Tone.MetalSynth({
      frequency: 400,
      envelope: { attack: 0.001, decay: 0.04, release: 0.01 },
      harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5,
      volume: -20
    }).toDestination();
  }
  
  playSong(song) {
    this.stop();
    Tone.Transport.bpm.value = song.bpm;
    
    // Melody
    song.melody.forEach(({note, duration, velocity, time}) => {
      this.events.push(Tone.Transport.scheduleOnce((t) => {
        try { this.synths.melody.triggerAttackRelease(note, duration, t, velocity); } catch(e) {}
      }, `+${time}`));
    });
    
    // Chords
    song.chords.forEach(({notes, duration, velocity, time}) => {
      this.events.push(Tone.Transport.scheduleOnce((t) => {
        try { this.synths.chords.triggerAttackRelease(notes, duration, t, velocity); } catch(e) {}
      }, `+${time}`));
    });
    
    // Bass
    song.bass.forEach(({note, duration, velocity, time}) => {
      this.events.push(Tone.Transport.scheduleOnce((t) => {
        try { this.synths.bass.triggerAttackRelease(note, duration, t, velocity); } catch(e) {}
      }, `+${time}`));
    });
    
    // Drums
    const sixteenthTime = 60 / song.bpm / 4;
    const totalSteps = song.drums.kick.length * song.bars;
    for (let i = 0; i < totalSteps; i++) {
      const step = i % 16;
      const time = i * sixteenthTime;
      
      if (song.drums.kick[step]) {
        this.events.push(Tone.Transport.scheduleOnce((t) => {
          try { this.synths.kick.triggerAttackRelease('C1', '8n', t); } catch(e) {}
        }, `+${time}`));
      }
      if (song.drums.snare[step]) {
        this.events.push(Tone.Transport.scheduleOnce((t) => {
          try { this.synths.snare.triggerAttackRelease('16n', t); } catch(e) {}
        }, `+${time}`));
      }
      if (song.drums.hihat[step]) {
        this.events.push(Tone.Transport.scheduleOnce((t) => {
          try { this.synths.hihat.triggerAttackRelease('32n', t); } catch(e) {}
        }, `+${time}`));
      }
    }
    
    Tone.Transport.start();
    this.isPlaying = true;
  }
  
  stop() {
    this.events.forEach(id => { try { Tone.Transport.clear(id); } catch(e) {} });
    this.events = [];
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    this.isPlaying = false;
  }
}

// ==================== EXPORT ENGINE ====================
class ExportEngine {
  static async export(song, format, duration) {
    // Create fresh synths for recording
    const melody = new Tone.Synth({
      oscillator: { type: "sine", partials: [1, 0.5, 0.25] },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.5 },
      volume: -10
    }).toDestination();
    
    const chords = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.1, decay: 0.5, sustain: 0.3, release: 1 },
      volume: -16
    }).toDestination();
    
    const bass = new Tone.Synth({
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
      envelope: { attack: 0.001, decay: 0.15, sustain: 0 },
      volume: -14
    }).toDestination();
    
    const hihat = new Tone.MetalSynth({
      frequency: 400,
      envelope: { attack: 0.001, decay: 0.04, release: 0.01 },
      harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5,
      volume: -20
    }).toDestination();
    
    // Connect all to recorder
    const recorder = new Tone.Recorder();
    [melody, chords, bass, kick, snare, hihat].forEach(s => s.connect(recorder));
    
    await recorder.start();
    Tone.Transport.bpm.value = song.bpm;
    const events = [];
    
    // Schedule melody
    song.melody.forEach(({note, duration, velocity, time}) => {
      if (time < duration) {
        events.push(Tone.Transport.scheduleOnce((t) => {
          try { melody.triggerAttackRelease(note, duration, t, velocity); } catch(e) {}
        }, `+${time}`));
      }
    });
    
    // Schedule chords
    song.chords.forEach(({notes, duration, velocity, time}) => {
      if (time < duration) {
        events.push(Tone.Transport.scheduleOnce((t) => {
          try { chords.triggerAttackRelease(notes, duration, t, velocity); } catch(e) {}
        }, `+${time}`));
      }
    });
    
    // Schedule bass
    song.bass.forEach(({note, duration, velocity, time}) => {
      if (time < duration) {
        events.push(Tone.Transport.scheduleOnce((t) => {
          try { bass.triggerAttackRelease(note, duration, t, velocity); } catch(e) {}
        }, `+${time}`));
      }
    });
    
    // Schedule drums
    const sixteenthTime = 60 / song.bpm / 4;
    const totalSteps = Math.min(song.drums.kick.length * song.bars, duration / sixteenthTime);
    for (let i = 0; i < totalSteps; i++) {
      const step = i % 16;
      const time = i * sixteenthTime;
      
      if (song.drums.kick[step]) {
        events.push(Tone.Transport.scheduleOnce((t) => {
          try { kick.triggerAttackRelease('C1', '8n', t); } catch(e) {}
        }, `+${time}`));
      }
      if (song.drums.snare[step]) {
        events.push(Tone.Transport.scheduleOnce((t) => {
          try { snare.triggerAttackRelease('16n', t); } catch(e) {}
        }, `+${time}`));
      }
      if (song.drums.hihat[step]) {
        events.push(Tone.Transport.scheduleOnce((t) => {
          try { hihat.triggerAttackRelease('32n', t); } catch(e) {}
        }, `+${time}`));
      }
    }
    
    Tone.Transport.start();
    await new Promise(r => setTimeout(r, duration * 1000));
    Tone.Transport.stop();
    events.forEach(id => { try { Tone.Transport.clear(id); } catch(e) {} });
    
    const recording = await recorder.stop();
    [melody, chords, bass, kick, snare, hihat].forEach(s => s.dispose());
    
    if (!recording) throw new Error('Recording failed');
    
    if (format === 'mp3') {
      try {
        return await ExportEngine.toMp3(recording);
      } catch(e) {
        return new Blob([recording], { type: 'audio/wav' });
      }
    }
    return new Blob([recording], { type: 'audio/wav' });
  }
  
  static async toMp3(wavBlob) {
    if (typeof lamejs === 'undefined') return wavBlob;
    const buf = await wavBlob.arrayBuffer();
    const audio = await Tone.context.decodeAudioData(buf);
    const L = audio.getChannelData(0);
    const R = audio.numberOfChannels > 1 ? audio.getChannelData(1) : L;
    const int16 = new Int16Array(L.length * 2);
    for (let i = 0; i < L.length; i++) {
      int16[i*2] = Math.max(-32768, Math.min(32767, L[i] * 32767));
      int16[i*2+1] = Math.max(-32768, Math.min(32767, R[i] * 32767));
    }
    const enc = new lamejs.Mp3Encoder(2, audio.sampleRate, 192);
    const chunks = [];
    for (let i = 0; i < int16.length; i += 1152) {
      const buf = enc.encodeBuffer(int16.subarray(i, i + 1152));
      if (buf.length > 0) chunks.push(buf);
    }
    chunks.push(enc.flush());
    return new Blob(chunks, { type: 'audio/mp3' });
  }
}

export { SongGenerator, MusicEngine, ExportEngine, GENRES };
