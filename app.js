/**
 * TonalScript - Main Application Entry Point
 */

let audioEngine = null;
let isPlaying = false;
let scheduledEvents = [];

// Note mapping for Tone.js
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

  // Enable/disable play based on input
  notationInput.addEventListener('input', () => {
    const hasText = notationInput.value.trim().length > 0;
    playBtn.disabled = !hasText || isPlaying;
    inputError.textContent = '';
  });

  // BPM slider
  bpmSlider.addEventListener('input', () => {
    bpmValue.textContent = bpmSlider.value;
    if (audioEngine && isPlaying) {
      Tone.Transport.bpm.value = parseInt(bpmSlider.value);
    }
  });

  // Play button
  playBtn.addEventListener('click', async () => {
    const text = notationInput.value.trim();
    if (!text) return;

    // Initialize audio on first click
    if (!audioEngine) {
      try {
        await Tone.start();
        audioEngine = new Tone.Synth({
          oscillator: { type: "sine" },
          envelope: { attack: 0.1, decay: 0.2, sustain: 0.3, release: 0.5 }
        }).toDestination();
        console.log('Audio engine initialized');
      } catch (err) {
        console.error('Failed to init audio:', err);
        inputError.textContent = 'Failed to initialize audio. Click anywhere first.';
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

    notes.forEach(({ note, duration }, i) => {
      const eventId = Tone.Transport.scheduleOnce((time) => {
        audioEngine.triggerAttackRelease(note, duration, time);
      }, `+${i * 0.5}`);
      scheduledEvents.push(eventId);
    });

    Tone.Transport.start();
    isPlaying = true;
    playBtn.disabled = true;
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
    notationInput.readOnly = true;
  });

  // Pause button
  pauseBtn.addEventListener('click', () => {
    if (isPlaying) {
      Tone.Transport.pause();
      isPlaying = false;
      playBtn.disabled = false;
      pauseBtn.disabled = true;
    }
  });

  // Stop button
  stopBtn.addEventListener('click', () => {
    stopAll();
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    notationInput.readOnly = false;
  });

  // Keyboard shortcut
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      if (isPlaying) {
        stopBtn.click();
      } else {
        playBtn.click();
      }
    }
  });

  // Enable play if there's saved notation
  setTimeout(() => {
    if (notationInput.value.trim()) {
      playBtn.disabled = false;
    }
  }, 100);
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

  const savedKey = localStorage.getItem('openrouter-api-key') || '';
  apiKeyInput.value = savedKey;

  settingsBtn.addEventListener('click', () => {
    apiKeyInput.value = localStorage.getItem('openrouter-api-key') || '';
    settingsModal.classList.remove('hidden');
  });

  cancelSettings.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });

  saveSettings.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    localStorage.setItem('openrouter-api-key', key);
    settingsModal.classList.add('hidden');
    updateAIStatusUI();
  });

  toggleKeyVisibility.addEventListener('click', () => {
    apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.add('hidden');
    }
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

    if (!prompt) {
      aiError.textContent = 'Please enter a description';
      return;
    }

    if (!apiKey) {
      aiError.textContent = 'Please set your API key first (click ⚙️ API Key)';
      return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    aiError.textContent = '';

    try {
      const genre = aiGenre.value;
      const notation = await generateNotationWithAPI(apiKey, prompt, genre);
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateBtn.click();
    }
  });
}

async function generateNotationWithAPI(apiKey, prompt, genre) {
  const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  const MODEL = 'google/gemma-4-26b-a4b-it:free';

  const systemPrompt = `You are a music notation assistant for TonalScript. Users will describe music they want, and you generate notation in TonalScript format.

FORMAT RULES:
- Notes: DA, MI, NA, SA, GA, PA, DHA, NI (or custom names)
- Duration: number after colon (4=quarter, 2=half, 1=whole, 8=eighth)
- Separate notes with commas
- Example: "DA:4, MI:2, NA:4, SA:1"

RESPONSE RULES:
- Return ONLY the notation string, no explanations
- For ambient/calm music: use longer durations (2, 4)
- For upbeat music: use shorter durations (1, 8)
- Repeat patterns for longer sequences
- Keep it musical and rhythmic

Example response: DA:4, MI:2, NA:4, SA:2, PA:4, DHA:1, NI:2, DA:4`;

  const genreContexts = {
    ambient: 'Create slow, atmospheric ambient music.',
    gamelan: 'Create traditional Indonesian Gamelan music.',
    koto: 'Create traditional Japanese Koto music.',
    shamisen: 'Create traditional Japanese Shamisen music.',
    cinematic: 'Create epic cinematic music.',
    lofi: 'Create chill lofi beats.',
    electronic: 'Create electronic/ambient music.',
    traditional: 'Create traditional folk music.'
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'TonalScript'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt + '\n\n' + (genreContexts[genre] || genreContexts.ambient) },
        { role: 'user', content: `Genre: ${genre}\nDescription: ${prompt}\n\nGenerate notation. Return ONLY the notation string.` }
      ],
      temperature: 0.7,
      max_tokens: 100
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }

  const data = await response.json();
  let notation = data.choices[0]?.message?.content?.trim();

  if (!notation) {
    throw new Error('No notation generated');
  }

  notation = notation.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
  notation = notation.replace(/^[^A-Z0-9]/im, '');
  notation = notation.split('\n')[0] || notation;

  return notation;
}

function updateAIStatusUI() {
  const status = document.getElementById('aiStatus');
  const generateBtn = document.getElementById('aiGenerateBtn');
  const hasKey = !!localStorage.getItem('openrouter-api-key');

  if (hasKey) {
    status.textContent = 'API Key Set';
    status.classList.add('active');
    generateBtn.disabled = false;
  } else {
    status.textContent = 'No API Key';
    status.classList.remove('active');
    generateBtn.disabled = true;
  }
}
