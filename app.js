/**
 * TonalScript - Complete Rewrite with Real Instrument Sounds
 */

// ==================== AUDIO ENGINE ====================
class RealInstrumentEngine {
  constructor() {
    this.synth = null;
    this.currentInstrument = 'piano';
    this.isPlaying = false;
    this.events = [];
  }

  async init() {
    await Tone.start();
    this.createInstrument('piano');
  }

  createInstrument(type) {
    if (this.synth) this.synth.dispose();
    
    // Each instrument has unique sound characteristics
    const instruments = {
      piano: () => {
        const synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { 
            type: "custom", 
            partials: [1, 0.5, 0.25, 0.125, 0.0625] 
          },
          envelope: { attack: 0.005, decay: 1.2, sustain: 0.1, release: 1.8 },
          volume: -12
        });
        return synth;
      },
      
      guitar: () => {
        // Plucked string sound using PluckSynth
        const synth = new Tone.PluckSynth({
          attackNoise: 1,
          dampening: 4000,
          resonance: 0.95,
          volume: -15
        });
        return synth;
      },
      
      bass: () => {
        const synth = new Tone.Synth({
          oscillator: { type: "sine" },
          envelope: { attack: 0.01, decay: 0.3, sustain: 0.7, release: 0.4 },
          volume: -8
        });
        return synth;
      },
      
      flute: () => {
        const synth = new Tone.Synth({
          oscillator: { 
            type: "sine", 
            partials: [1, 0.3, 0.1] 
          },
          envelope: { attack: 0.2, decay: 0.1, sustain: 0.8, release: 0.5 },
          volume: -18
        });
        return synth;
      },
      
      synth: () => {
        const synth = new Tone.MonoSynth({
          oscillator: { type: "sawtooth", count: 3, spread: 10 },
          envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.5 },
          filter: { Q: 2, type: "lowpass", rolloff: -24 },
          filterEnvelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.5, baseFrequency: 800, octaves: 3 },
          volume: -12
        });
        return synth;
      },
      
      bells: () => {
        const synth = new Tone.Synth({
          oscillator: { 
            type: "sine", 
            partials: [1, 0.3, 0.1, 0.05, 0.02] 
          },
          envelope: { attack: 0.001, decay: 2.5, sustain: 0, release: 3 },
          volume: -16
        });
        return synth;
      },
      
      gamelan: () => {
        const synth = new Tone.Synth({
          oscillator: { 
            type: "sine", 
            partials: [1, 0.8, 0.6, 0.4, 0.2, 0.1] 
          },
          envelope: { attack: 0.001, decay: 1.5, sustain: 0.05, release: 2 },
          volume: -10
        });
        return synth;
      },
      
      koto: () => {
        const synth = new Tone.PluckSynth({
          attackNoise: 0.5,
          dampening: 3000,
          resonance: 0.9,
          volume: -14
        });
        return synth;
      },
      
      strings: () => {
        const synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: "sawtooth", count: 4, spread: 8 },
          envelope: { attack: 0.8, decay: 0.3, sustain: 0.6, release: 1.5 },
          volume: -14
        });
        return synth;
      },
      
      pad: () => {
        const synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: "sine", count: 3, spread: 15 },
          envelope: { attack: 1.5, decay: 0.5, sustain: 0.7, release: 3 },
          volume: -14
        });
        return synth;
      },
      
      trumpet: () => {
        const synth = new Tone.Synth({
          oscillator: { type: "sawtooth", partials: [1, 0.7, 0.5, 0.3] },
          envelope: { attack: 0.05, decay: 0.2, sustain: 0.7, release: 0.3 },
          volume: -10
        });
        return synth;
      },
      
      violin: () => {
        const synth = new Tone.Synth({
          oscillator: { type: "sawtooth", partials: [1, 0.6, 0.4, 0.2] },
          envelope: { attack: 0.3, decay: 0.2, sustain: 0.7, release: 0.8 },
          volume: -12
        });
        return synth;
      },
      
      organ: () => {
        const synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: "sine", partials: [1, 0.8, 0.6, 0.4, 0.2, 0.1] },
          envelope: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.3 },
          volume: -12
        });
        return synth;
      },
      
      harp: () => {
        const synth = new Tone.PluckSynth({
          attackNoise: 0.3,
          dampening: 2500,
          resonance: 0.92,
          volume: -14
        });
        return synth;
      }
    };

    this.synth = instruments[type] ? instruments[type]() : instruments.piano();
    this.currentInstrument = type;
    
    // Add effects based on instrument
    if (type === 'guitar' || type === 'koto' || type === 'harp') {
      const reverb = new Tone.Reverb(1.5).toDestination();
      this.synth.connect(reverb);
    } else if (type === 'strings' || type === 'pad') {
      const reverb = new Tone.Reverb(2.5).toDestination();
      this.synth.connect(reverb);
    } else {
      this.synth.toDestination();
    }
  }

  setInstrument(type) {
    this.createInstrument(type);
  }

  mapNote(note) {
    const map = {
      'C': 'C4', 'D': 'D4', 'E': 'E4', 'F': 'F4', 'G': 'G4', 'A': 'A4', 'B': 'B4',
      'C2': 'C2', 'D2': 'D2', 'E2': 'E2', 'F2': 'F2', 'G2': 'G2', 'A2': 'A2', 'B2': 'B2',
      'C3': 'C3', 'D3': 'D3', 'E3': 'E3', 'F3': 'F3', 'G3': 'G3', 'A3': 'A3', 'B3': 'B3',
      'C4': 'C4', 'D4': 'D4', 'E4': 'E4', 'F4': 'F4', 'G4': 'G4', 'A4': 'A4', 'B4': 'B4',
      'C5': 'C5', 'D5': 'D5', 'E5': 'E5', 'F5': 'F5', 'G5': 'G5', 'A5': 'A5', 'B5': 'B5',
      'C6': 'C6', 'D6': 'D6', 'E6': 'E6', 'F6': 'F6', 'G6': 'G6', 'A6': 'A6', 'B6': 'B6',
      'C#4': 'C#4', 'D#4': 'D#4', 'F#4': 'F#4', 'G#4': 'G#4', 'A#4': 'A#4',
      'C#3': 'C#3', 'D#3': 'D#3', 'F#3': 'F#3', 'G#3': 'G#3', 'A#3': 'A#3',
      'C#5': 'C#5', 'D#5': 'D#5', 'F#5': 'F#5', 'G#5': 'G#5', 'A#5': 'A#5',
    };
    const upper = note.toUpperCase().replace('DO','C').replace('RE','D').replace('MI','E')
      .replace('FA','F').replace('SOL','G').replace('LA','A').replace('SI','B')
      .replace('SA','B').replace('NI','B').replace('NA','A').replace('PA','F')
      .replace('GA','G').replace('DA','C').replace('RA','D').replace('MA','E');
    return map[upper] || ( /^[A-G][#b]?\d$/.test(upper) ? upper : 'C4');
  }

  parseNotation(text) {
    if (!text) return [];
    const notes = [];
    const parts = text.split(',');
    for (const part of parts) {
      const trimmed = part.trim().replace(/[\[\]]/g, '');
      if (!trimmed) continue;
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) continue;
      const noteStr = trimmed.substring(0, colonIdx).trim();
      let durStr = trimmed.substring(colonIdx + 1).trim();
      if (/^\d+\.?$/.test(durStr)) durStr += 'n';
      const note = this.mapNote(noteStr);
      if (durStr.match(/^\d+n\.?$/)) {
        notes.push({ note, duration: durStr });
      }
    }
    return notes;
  }

  playNotes(notes, bpm) {
    if (!this.synth) return;
    this.stop();
    Tone.Transport.bpm.value = bpm;
    const spacing = 60 / bpm / 2;

    notes.forEach(({ note, duration }, i) => {
      const eventId = Tone.Transport.scheduleOnce((time) => {
        try {
          if (this.synth instanceof Tone.PluckSynth) {
            this.synth.triggerAttack(note, time);
          } else {
            this.synth.triggerAttackRelease(note, duration, time);
          }
        } catch(e) {}
      }, `+${i * spacing}`);
      this.events.push(eventId);
    });

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

  getInstrumentNames() {
    return {
      'Traditional': ['gamelan', 'koto'],
      'Strings': ['guitar', 'harp', 'violin', 'strings'],
      'Keys': ['piano', 'organ'],
      'Wind': ['flute', 'trumpet'],
      'Electronic': ['synth', 'pad', 'bells'],
      'Low': ['bass']
    };
  }
}

// ==================== MAIN APP ====================
let engine = null;
let isPlaying = false;

document.addEventListener('DOMContentLoaded', () => {
  setupSettings();
  setupAIGenerate();
  setupPlayback();
  setupInstruments();
  setupExport();
});

async function ensureEngine() {
  if (engine && engine.synth) return true;
  try {
    await Tone.start();
    engine = new RealInstrumentEngine();
    await engine.init();
    return true;
  } catch (err) {
    console.error('Init failed:', err);
    return false;
  }
}

function setupInstruments() {
  const select = document.getElementById('presetSelect');
  if (!select) return;
  select.innerHTML = '';
  const groups = engine ? engine.getInstrumentNames() : {
    'Traditional': ['gamelan', 'koto'],
    'Strings': ['guitar', 'harp', 'violin', 'strings'],
    'Keys': ['piano', 'organ'],
    'Wind': ['flute', 'trumpet'],
    'Electronic': ['synth', 'pad', 'bells'],
    'Low': ['bass']
  };
  Object.entries(groups).forEach(([type, keys]) => {
    const group = document.createElement('optgroup');
    group.label = type;
    keys.forEach(key => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = key.charAt(0).toUpperCase() + key.slice(1);
      group.appendChild(opt);
    });
    select.appendChild(group);
  });
  select.onchange = () => { if (engine) engine.setInstrument(select.value); };
}

function setupPlayback() {
  const playBtn = document.getElementById('playBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const stopBtn = document.getElementById('stopBtn');
  const textarea = document.getElementById('notationInput');
  const errorEl = document.getElementById('inputError');
  const bpmSlider = document.getElementById('bpmSlider');
  const bpmValue = document.getElementById('bpmValue');
  const instSelect = document.getElementById('presetSelect');
  const exportBtn = document.getElementById('exportBtn');

  textarea.addEventListener('input', () => {
    playBtn.disabled = !textarea.value.trim() || isPlaying;
    errorEl.textContent = '';
  });

  bpmSlider.addEventListener('input', () => {
    bpmValue.textContent = bpmSlider.value;
    if (isPlaying && engine) Tone.Transport.bpm.value = parseInt(bpmSlider.value);
  });

  playBtn.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) return;
    if (!await ensureEngine()) { errorEl.textContent = 'Click page first to enable audio'; return; }

    if (instSelect.value) engine.setInstrument(instSelect.value);
    const notes = engine.parseNotation(text);
    if (!notes.length) { errorEl.textContent = 'No valid notes'; return; }

    engine.stop();
    engine.playNotes(notes, parseInt(bpmSlider.value));
    isPlaying = true;
    playBtn.disabled = true;
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
    exportBtn.disabled = false;
    textarea.readOnly = true;
  });

  pauseBtn.addEventListener('click', () => {
    if (isPlaying && engine) {
      Tone.Transport.pause();
      isPlaying = false;
      playBtn.disabled = false;
    }
  });

  stopBtn.addEventListener('click', () => {
    if (engine) engine.stop();
    isPlaying = false;
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    textarea.readOnly = false;
  });

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      isPlaying ? stopBtn.click() : playBtn.click();
    }
  });

  // Enable export when there's notation
  textarea.addEventListener('input', () => {
    exportBtn.disabled = !textarea.value.trim();
  });
}

function setupExport() {
  const exportBtn = document.getElementById('exportBtn');
  const modal = document.getElementById('exportModal');
  const cancelBtn = document.getElementById('cancelExport');
  const confirmBtn = document.getElementById('confirmExport');
  const durationSlider = document.getElementById('durationSlider');
  const durationValue = document.getElementById('durationValue');
  const formatSelect = document.getElementById('formatSelect');

  // Make export button always clickable when there's notation
  exportBtn.disabled = false;

  durationSlider.addEventListener('input', () => {
    durationValue.textContent = durationSlider.value;
  });

  exportBtn.addEventListener('click', async () => {
    const textarea = document.getElementById('notationInput');
    if (!textarea.value.trim()) {
      alert('Enter some notes first');
      return;
    }
    modal.classList.remove('hidden');
  });

  cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

  confirmBtn.addEventListener('click', async () => {
    const duration = parseInt(durationSlider.value);
    const format = formatSelect.value;
    
    modal.classList.add('hidden');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Recording...';
    exportBtn.disabled = true;

    try {
      await doExport(duration, format);
    } catch (err) {
      console.error('Export error:', err);
      alert('Export failed: ' + err.message);
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Download';
      exportBtn.disabled = false;
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });
}

async function doExport(duration, format) {
  const textarea = document.getElementById('notationInput');
  const text = textarea.value.trim();
  const bpm = parseInt(document.getElementById('bpmSlider').value);
  const instSelect = document.getElementById('presetSelect');

  // Create temporary engine for recording
  await ensureEngine();
  if (instSelect.value) engine.setInstrument(instSelect.value);
  
  const notes = engine.parseNotation(text);
  if (!notes.length) throw new Error('No valid notes');

  // Create recorder
  const recorder = new Tone.Recorder();
  engine.synth.connect(recorder);

  // Start recording
  await recorder.start();

  // Play
  engine.stop();
  Tone.Transport.bpm.value = bpm;
  const spacing = 60 / bpm / 2;
  notes.forEach(({ note, duration }, i) => {
    Tone.Transport.scheduleOnce((time) => {
      try {
        if (engine.synth instanceof Tone.PluckSynth) {
          engine.synth.triggerAttack(note, time);
        } else {
          engine.synth.triggerAttackRelease(note, duration, time);
        }
      } catch(e) {}
    }, `+${i * spacing}`);
  });
  Tone.Transport.start();

  // Wait
  await new Promise(r => setTimeout(r, duration * 1000));

  // Stop
  engine.stop();
  const recording = await recorder.stop();
  engine.synth.disconnect(recorder);

  if (!recording) throw new Error('Recording failed');

  // Download
  if (format === 'mp3') {
    const blob = await wavToMp3(recording);
    download(blob, 'tonalscript-export.mp3');
  } else {
    download(new Blob([recording], { type: 'audio/wav' }), 'tonalscript-export.wav');
  }
}

async function wavToMp3(wavBlob) {
  const arrayBuffer = await wavBlob.arrayBuffer();
  const audioCtx = Tone.context;
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  
  let interleaved;
  if (numChannels === 2) {
    const L = audioBuffer.getChannelData(0);
    const R = audioBuffer.getChannelData(1);
    interleaved = new Float32Array(L.length * 2);
    for (let i = 0; i < L.length; i++) {
      interleaved[i*2] = L[i];
      interleaved[i*2+1] = R[i];
    }
  } else {
    interleaved = audioBuffer.getChannelData(0);
  }

  // Convert to 16-bit
  const int16 = new Int16Array(interleaved.length);
  for (let i = 0; i < interleaved.length; i++) {
    const s = Math.max(-1, Math.min(1, interleaved[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  // Use lamejs
  if (typeof lamejs === 'undefined') {
    console.warn('lamejs not loaded, using WAV');
    return wavBlob;
  }

  const encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, 128);
  const chunks = [];
  const size = 1152;
  
  for (let i = 0; i < int16.length; i += size) {
    const buf = encoder.encodeBuffer(int16.subarray(i, i + size));
    if (buf.length > 0) chunks.push(buf);
  }
  chunks.push(encoder.flush());

  return new Blob(chunks, { type: 'audio/mp3' });
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function setupSettings() {
  const btn = document.getElementById('settingsBtn');
  const modal = document.getElementById('settingsModal');
  const cancel = document.getElementById('cancelSettings');
  const save = document.getElementById('saveSettings');
  const toggle = document.getElementById('toggleKeyVisibility');
  const input = document.getElementById('apiKeyInput');

  input.value = localStorage.getItem('openrouter-api-key') || '';
  btn.onclick = () => { input.value = localStorage.getItem('openrouter-api-key') || ''; modal.classList.remove('hidden'); };
  cancel.onclick = () => modal.classList.add('hidden');
  save.onclick = () => { localStorage.setItem('openrouter-api-key', input.value.trim()); modal.classList.add('hidden'); updateAIStatus(); };
  toggle.onclick = () => { input.type = input.type === 'password' ? 'text' : 'password'; };
  modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
}

function setupAIGenerate() {
  const btn = document.getElementById('aiGenerateBtn');
  const prompt = document.getElementById('aiPrompt');
  const genre = document.getElementById('aiGenre');
  const error = document.getElementById('aiError');
  const textarea = document.getElementById('notationInput');
  const playBtn = document.getElementById('playBtn');
  const exportBtn = document.getElementById('exportBtn');

  btn.onclick = async () => {
    const text = prompt.value.trim();
    const key = localStorage.getItem('openrouter-api-key') || '';
    if (!text) { error.textContent = 'Enter description'; return; }
    if (!key) { error.textContent = 'Set API key first'; return; }

    btn.disabled = true;
    btn.textContent = 'Generating...';
    error.textContent = '';

    try {
      const notation = await callAPI(key, text, genre.value);
      textarea.value = notation;
      textarea.dispatchEvent(new Event('input'));
      playBtn.disabled = false;
      exportBtn.disabled = false;
    } catch (err) {
      error.textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Generate';
    }
  };

  prompt.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); btn.click(); } };
}

async function callAPI(apiKey, prompt, genre) {
  const contexts = {
    ambient: 'Dreamy atmospheric. Notes: C4, E4, G4, A4. Long smooth notes.',
    gamelan: 'Indonesian metallic percussion. Notes: C4, D4, E4, G4, A4. Rhythmic.',
    koto: 'Japanese zither. Notes: C4, D4, E4, G4, A4. Flowing.',
    shamisen: 'Japanese drum-like. Notes: C4, E4, A4, B4. Energetic.',
    cinematic: 'Epic orchestral. Notes: C4, D4, E4, F4, G4, A4, B4.',
    lofi: 'Chill hip-hop. Notes: C4, E4, G4, A4, B4. Relaxed.',
    electronic: 'Synth patterns. Notes: C4, D4, E4, G4. Repetitive.',
    traditional: 'Folk melody. Notes: C4, D4, E4, G4, A4. Simple.',
    jazz: 'Swing feel. Notes: C4, D4, E4, F#4, G4, A4, B4.',
    blues: 'Blues scale. Notes: C4, Eb4, F4, F#4, G4, Bb4.',
    pop: 'Catchy melody. Notes: C4, D4, E4, G4, A4. Upbeat.',
    rock: 'Power chords. Notes: C3, G3, A3, F3. Driving.',
    classical: 'Orchestral. Notes: C4, D4, E4, F4, G4, A4, B4. Elegant.',
    tropical: 'Island vibes. Notes: C4, E4, F4, G4, A4. Sunny.',
    melancholic: 'Sad emotional. Notes: C4, D4, Eb4, G4, A4.',
    happy: 'Bright cheerful. Notes: C4, D4, E4, G4, A4, B4. Joyful.',
    scary: 'Dark tension. Notes: C3, Eb3, F#3, G3, Bb3.',
    meditation: 'Om sound. Notes: C3, G3, C4. Very slow.',
    workout: 'High energy. Notes: C4, E4, G4, A4. Fast.',
    romantic: 'Love theme. Notes: C4, E4, G4, A4, B4. Gentle.'
  };

  const systemPrompt = `You are a music notation generator. Generate melodies.

FORMAT: NOTE:DURATION (comma separated)
- Notes: C3-B6, C#3-B6 (e.g., C4, D4, E4, G#4)
- Duration: 4=quarter, 2=half, 8=eighth, 1=whole
- Example: C4:4, E4:2, G4:4, A4:2

RULES:
- 8-12 notes per melody
- Mix note lengths for rhythm
- Use varied octaves
- Return ONLY notation string`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'TonalScript'
    },
    body: JSON.stringify({
      model: 'google/gemma-4-26b-a4b-it:free',
      messages: [
        { role: 'system', content: systemPrompt + '\n\n' + (contexts[genre] || contexts.ambient) },
        { role: 'user', content: `Generate ${genre} melody: ${prompt}` }
      ],
      temperature: 0.8,
      max_tokens: 120
    })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'API error');
  }

  const data = await res.json();
  let notation = data.choices[0]?.message?.content?.trim();
  if (!notation) throw new Error('No notation');
  notation = notation.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
  notation = notation.replace(/^[^A-Z0-9]/im, '');
  return notation.split('\n')[0];
}

function updateAIStatus() {
  const status = document.getElementById('aiStatus');
  const btn = document.getElementById('aiGenerateBtn');
  const hasKey = !!localStorage.getItem('openrouter-api-key');
  if (status) { status.textContent = hasKey ? 'API Set ✓' : 'No API Key'; status.classList.toggle('active', hasKey); }
  if (btn) btn.disabled = !hasKey;
}

updateAIStatus();
