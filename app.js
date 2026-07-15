/**
 * TonalScript - Main Application Entry Point (Enhanced)
 */

let audioEngine = null;
let reverbNode = null;
let delayNode = null;
let isPlaying = false;
let scheduledEvents = [];

// Extended note mapping with multiple octaves
const NOTE_MAP = {
  // Octave 3 (Low)
  'DO2': 'C3', 'RE2': 'D3', 'MI2': 'E3', 'FA2': 'F3', 'SOL2': 'G3', 'LA2': 'A3', 'SI2': 'B3',
  'DA2': 'C3', 'RA2': 'D3', 'MA2': 'E3', 'PA2': 'F3', 'GA2': 'G3', 'NA2': 'A3', 'SA2': 'B3', 'NI2': 'B3',
  // Octave 4 (Mid)
  'DO': 'C4', 'RE': 'D4', 'MI': 'E4', 'FA': 'F4', 'SOL': 'G4', 'LA': 'A4', 'SI': 'B4',
  'DA': 'C4', 'RA': 'D4', 'MA': 'E4', 'PA': 'F4', 'GA': 'G4', 'NA': 'A4', 'SA': 'B4', 'NI': 'B4',
  'DO3': 'C4', 'RE3': 'D4', 'MI3': 'E4', 'FA3': 'F4', 'SOL3': 'G4', 'LA3': 'A4', 'SI3': 'B4',
  // Octave 5 (High)
  'DO4': 'C5', 'RE4': 'D5', 'MI4': 'E5', 'FA4': 'F5', 'SOL4': 'G5', 'LA4': 'A5', 'SI4': 'B5',
  'DA4': 'C5', 'RA4': 'D5', 'MA4': 'E5', 'PA4': 'F5', 'GA4': 'G5', 'NA4': 'A5', 'SA4': 'B5', 'NI4': 'B5',
  // Octave 6 (Very High)
  'DO5': 'C6', 'RE5': 'D6', 'MI5': 'E6', 'FA5': 'F6', 'SOL5': 'G6', 'LA5': 'A6', 'SI5': 'B6',
  // Sharps
  'DOD': 'C#4', 'RED': 'D#4', 'MID': 'E#4', 'FAD': 'F#4', 'SOLD': 'G#4', 'LAD': 'A#4', 'SID': 'B#4',
  'DAD': 'C#4', 'RAD': 'D#4', 'MAD': 'E#4', 'PAD': 'F#4', 'GAD': 'G#4', 'NAD': 'A#4', 'SAD': 'B#4',
};

function mapNote(note) {
  const upper = note.toUpperCase().trim();
  if (NOTE_MAP[upper]) return NOTE_MAP[upper];
  if (/^[A-G][#b]?\d$/.test(upper)) return upper;
  return 'C4';
}

function parseNotation(text) {
  if (!text) return [];
  const notes = [];
  const tokens = text.split(',');
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(':');
    if (parts.length !== 2) continue;
    const note = mapNote(parts[0]);
    let dur = parts[1].trim();
    if (/^\d+\.?$/.test(dur)) dur = dur + 'n';
    if (/^\d+n\.?$/.test(dur) || /^\d+n$/.test(dur)) {
      notes.push({ note, duration: dur });
    }
  }
  return notes;
}

// Get random velocity for humanization
function randomVelocity() {
  return 0.7 + Math.random() * 0.3; // 0.7 to 1.0
}

// Get octave from note string
function getOctave(noteStr) {
  const match = noteStr.match(/\d/);
  return match ? parseInt(match[0]) : 4;
}

document.addEventListener('DOMContentLoaded', () => {
  initSettingsModal();
  initAIGenerate();
  initPlayback();
});

function initPlayback() {
  const playBtn = document.getElementById('playBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const stopBtn = document.getElementById('stopBtn');
  const notationInput = document.getElementById('notationInput');
  const inputError = document.getElementById('inputError');
  const bpmSlider = document.getElementById('bpmSlider');
  const bpmValue = document.getElementById('bpmValue');
  const presetSelect = document.getElementById('presetSelect');

  notationInput.addEventListener('input', () => {
    playBtn.disabled = !notationInput.value.trim() || isPlaying;
    inputError.textContent = '';
  });

  bpmSlider.addEventListener('input', () => {
    bpmValue.textContent = bpmSlider.value;
    if (isPlaying) Tone.Transport.bpm.value = parseInt(bpmSlider.value);
  });

  playBtn.addEventListener('click', async () => {
    const text = notationInput.value.trim();
    if (!text) return;

    if (!audioEngine) {
      try {
        await Tone.start();
        
        // Create synth
        audioEngine = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: "triangle" },
          envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 0.8 },
          volume: -6
        }).toDestination();

        // Add reverb
        reverbNode = new Tone.Reverb({
          decay: 3,
          wet: 0.4
        }).toDestination();
        audioEngine.connect(reverbNode);

        // Add delay
        delayNode = new Tone.FeedbackDelay({
          delayTime: "8n",
          feedback: 0.3,
          wet: 0.25
        }).toDestination();
        audioEngine.connect(delayNode);

        console.log('Audio engine initialized');
      } catch (err) {
        console.error('Failed to init audio:', err);
        inputError.textContent = 'Failed to initialize audio';
        return;
      }
    }

    const notes = parseNotation(text);
    if (notes.length === 0) {
      inputError.textContent = 'No valid notes found';
      return;
    }

    stopAll();
    Tone.Transport.bpm.value = parseInt(bpmSlider.value);

    // Create richer pattern with overlapping notes and arpeggios
    const enrichedNotes = enrichPattern(notes);
    
    enrichedNotes.forEach(({ note, duration, time, velocity }, i) => {
      const eventId = Tone.Transport.scheduleOnce((t) => {
        try {
          audioEngine.triggerAttackRelease(note, duration, t, velocity);
        } catch (err) {
          console.warn('Note error:', note, err);
        }
      }, time);
      scheduledEvents.push(eventId);
    });

    Tone.Transport.start();
    isPlaying = true;
    playBtn.disabled = true;
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
    notationInput.readOnly = true;
  });

  pauseBtn.addEventListener('click', () => {
    if (isPlaying) {
      Tone.Transport.pause();
      isPlaying = false;
      playBtn.disabled = false;
    }
  });

  stopBtn.addEventListener('click', () => {
    stopAll();
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    notationInput.readOnly = false;
  });

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      isPlaying ? stopBtn.click() : playBtn.click();
    }
  });

  setTimeout(() => {
    if (notationInput.value.trim()) playBtn.disabled = false;
  }, 100);
}

// Enrich the pattern with arpeggios, chords, and variation
function enrichPattern(notes) {
  const enriched = [];
  const beatDuration = 0.5; // seconds per beat
  
  notes.forEach(({ note, duration }, i) => {
    const time = `+${i * beatDuration}`;
    const velocity = randomVelocity();
    
    // Main note
    enriched.push({ note, duration, time, velocity });
    
    // Add arpeggio (one octave up, slightly delayed)
    const octave = getOctave(note);
    if (octave < 6) {
      const highNote = note.replace(/\d/, String(octave + 1));
      enriched.push({
        note: highNote,
        duration: duration,
        time: `+${i * beatDuration + 0.05}`,
        velocity: velocity * 0.7
      });
    }
    
    // Add octave below for depth (every other note)
    if (i % 2 === 0 && octave > 3) {
      const lowNote = note.replace(/\d/, String(octave - 1));
      enriched.push({
        note: lowNote,
        duration: duration,
        time: `+${i * beatDuration}`,
        velocity: velocity * 0.5
      });
    }
  });
  
  return enriched;
}

function stopAll() {
  scheduledEvents.forEach(id => Tone.Transport.clear(id));
  scheduledEvents = [];
  Tone.Transport.stop();
  Tone.Transport.position = 0;
  isPlaying = false;
}

function initSettingsModal() {
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const cancelSettings = document.getElementById('cancelSettings');
  const saveSettings = document.getElementById('saveSettings');
  const toggleKeyVisibility = document.getElementById('toggleKeyVisibility');
  const apiKeyInput = document.getElementById('apiKeyInput');

  apiKeyInput.value = localStorage.getItem('openrouter-api-key') || '';

  settingsBtn.addEventListener('click', () => {
    apiKeyInput.value = localStorage.getItem('openrouter-api-key') || '';
    settingsModal.classList.remove('hidden');
  });

  cancelSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));

  saveSettings.addEventListener('click', () => {
    localStorage.setItem('openrouter-api-key', apiKeyInput.value.trim());
    settingsModal.classList.add('hidden');
    updateAIStatusUI();
  });

  toggleKeyVisibility.addEventListener('click', () => {
    apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.add('hidden');
  });

  updateAIStatusUI();
}

function initAIGenerate() {
  const generateBtn = document.getElementById('aiGenerateBtn');
  const aiPrompt = document.getElementById('aiPrompt');
  const aiGenre = document.getElementById('aiGenre');
  const aiError = document.getElementById('aiError');
  const notationInput = document.getElementById('notationInput');

  generateBtn.addEventListener('click', async () => {
    const prompt = aiPrompt.value.trim();
    const apiKey = localStorage.getItem('openrouter-api-key') || '';

    if (!prompt) { aiError.textContent = 'Enter a description'; return; }
    if (!apiKey) { aiError.textContent = 'Set API key first (⚙️)'; return; }

    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    aiError.textContent = '';

    try {
      const notation = await generateNotationWithAPI(apiKey, prompt, aiGenre.value);
      notationInput.value = notation;
      notationInput.dispatchEvent(new Event('input'));
    } catch (err) {
      aiError.textContent = err.message;
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate';
    }
  });

  aiPrompt.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generateBtn.click(); }
  });
}

async function generateNotationWithAPI(apiKey, prompt, genre) {
  const systemPrompt = `You are a music notation assistant for TonalScript.

FORMAT RULES:
- Notes: DA, MI, NA, SA, GA, PA, DHA, NI + octave (DA4, MI3, etc.)
- Duration: number after colon (4=quarter, 2=half, 1=whole, 8=eighth, 16=sixteenth)
- Separate notes with commas
- Support chords: [DA4:4, MI4:4] means play together
- Support arpeggios: DA4:8, MI4:8, SA4:8

EXAMPLES:
Simple: DA:4, MI:2, NA:4, SA:2
Rich: DA4:4, [DA4:4, MI4:4], NA4:8, SA4:8, DA3:2

RESPONSE RULES:
- Return ONLY the notation string
- Use varied octaves (3, 4, 5) for richness
- Mix long and short notes
- Add chords [ ] for harmony
- Keep it musical

Example: DA4:4, [DA4:4, FA4:4], NA4:8, SA4:8, DA3:2, MI4:4`;

  const genreContexts = {
    ambient: 'Slow, dreamy, atmospheric. Use long notes and space.',
    gamelan: 'Cyclical, metallic, percussive patterns.',
    koto: 'Pentatonic, flowing, graceful melodies.',
    shamisen: 'Rhythmic, percussive, energetic.',
    cinematic: 'Epic, dramatic, emotional builds.',
    lofi: 'Chill, relaxed, mellow vibes.',
    electronic: 'Repetitive, hypnotic, layered.',
    traditional: 'Simple, memorable folk melodies.'
  };

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
        { role: 'system', content: systemPrompt + '\n\n' + (genreContexts[genre] || genreContexts.ambient) },
        { role: 'user', content: `Genre: ${genre}\nDescription: ${prompt}\n\nGenerate rich notation.` }
      ],
      temperature: 0.8,
      max_tokens: 150
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API failed');
  }

  const data = await response.json();
  let notation = data.choices[0]?.message?.content?.trim();
  if (!notation) throw new Error('No notation generated');

  notation = notation.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
  notation = notation.replace(/^[^A-Z0-9\[\]]/im, '');
  notation = notation.split('\n')[0] || notation;

  return notation;
}

function updateAIStatusUI() {
  const status = document.getElementById('aiStatus');
  const generateBtn = document.getElementById('aiGenerateBtn');
  const hasKey = !!localStorage.getItem('openrouter-api-key');
  
  status.textContent = hasKey ? 'API Key Set' : 'No API Key';
  status.classList.toggle('active', hasKey);
  generateBtn.disabled = !hasKey;
}
