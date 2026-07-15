/**
 * TonalScript - Main Application (Clean Audio)
 */

import { AudioEngine, INSTRUMENTS, NOTE_MAP } from './audioEngine.js';

let engine = null;
let isPlaying = false;

function parseNotation(text) {
  if (!text) return [];
  const notes = [];
  const tokens = text.split(',');
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed || trimmed === '[' || trimmed === ']') continue;
    const parts = trimmed.split(':');
    if (parts.length !== 2) continue;
    
    const noteUpper = parts[0].toUpperCase().trim();
    let note = NOTE_MAP[noteUpper] || ( /^[A-G][#b]?\d$/.test(noteUpper) ? noteUpper : 'C4');
    
    let dur = parts[1].trim().replace(/\]/g, '');
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
  initInstrumentSelector();
});

async function initEngine() {
  if (engine) return true;
  try {
    await Tone.start();
    engine = new AudioEngine();
    await engine.init();
    console.log('Engine ready');
    return true;
  } catch (err) {
    console.error('Engine init failed:', err);
    return false;
  }
}

function initInstrumentSelector() {
  const select = document.getElementById('presetSelect');
  if (!select) return;
  
  // Clear existing options
  select.innerHTML = '';
  
  // Group by type
  const groups = {};
  Object.entries(INSTRUMENTS).forEach(([key, inst]) => {
    if (!groups[inst.type]) groups[inst.type] = [];
    groups[inst.type].push({ key, name: inst.name });
  });
  
  Object.entries(groups).forEach(([type, instruments]) => {
    const group = document.createElement('optgroup');
    group.label = type.charAt(0).toUpperCase() + type.slice(1);
    instruments.forEach(inst => {
      const option = document.createElement('option');
      option.value = inst.key;
      option.textContent = inst.name;
      group.appendChild(option);
    });
    select.appendChild(group);
  });
  
  select.addEventListener('change', () => {
    if (engine) engine.setInstrument(select.value);
  });
}

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
    if (engine && isPlaying) Tone.Transport.bpm.value = parseInt(bpmSlider.value);
  });

  playBtn.addEventListener('click', async () => {
    const text = notationInput.value.trim();
    if (!text) return;

    const ready = await initEngine();
    if (!ready) {
      inputError.textContent = 'Failed to init audio';
      return;
    }

    const notes = parseNotation(text);
    if (notes.length === 0) {
      inputError.textContent = 'No valid notes';
      return;
    }

    engine.stop();
    if (presetSelect.value) engine.setInstrument(presetSelect.value);
    Tone.Transport.bpm.value = parseInt(bpmSlider.value);

    // Play notes directly - clean sound
    notes.forEach(({ note, duration }, i) => {
      Tone.Transport.scheduleOnce((time) => {
        try {
          engine.synth.triggerAttackRelease(note, duration, time);
        } catch (e) {}
      }, `+${i * 0.4}`);
      engine.scheduledEvents.push(i);
    });

    Tone.Transport.start();
    isPlaying = true;
    engine.isPlaying = true;
    playBtn.disabled = true;
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
    notationInput.readOnly = true;
  });

  pauseBtn.addEventListener('click', () => {
    if (isPlaying && engine) {
      Tone.Transport.pause();
      isPlaying = false;
      engine.isPlaying = false;
      playBtn.disabled = false;
    }
  });

  stopBtn.addEventListener('click', () => {
    if (engine) engine.stop();
    isPlaying = false;
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

  // Enable play if notation exists
  const savedState = localStorage.getItem('tonalscript-state');
  if (savedState) {
    try {
      const state = JSON.parse(savedState);
      if (state.lastNotation) {
        notationInput.value = state.lastNotation;
        playBtn.disabled = false;
      }
    } catch (e) {}
  }
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

    if (!prompt) { aiError.textContent = 'Enter description'; return; }
    if (!apiKey) { aiError.textContent = 'Set API key first'; return; }

    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    aiError.textContent = '';

    try {
      const notation = await generateNotationWithAPI(apiKey, prompt, aiGenre.value);
      notationInput.value = notation;
      notationInput.dispatchEvent(new Event('input'));
      document.getElementById('playBtn').disabled = false;
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

FORMAT: NOTE:DURATION (comma separated)
- Notes: DA, MI, NA, SA, GA, PA, DHA, NI + octave (DA4, MI3)
- Duration: 4=quarter, 2=half, 1=whole, 8=eighth, 16=sixteenth
- Example: DA4:4, MI4:2, NA4:4, SA3:2

RULES:
- Return ONLY notation string
- Use octaves 3-5 for variety
- Mix durations for rhythm
- Keep it simple and clean
- No chords needed

Example: DA4:4, MI4:2, NA4:4, SA3:2, GA4:4, PA4:2`;

  const genreContexts = {
    ambient: 'Slow, peaceful, atmospheric. Use longer notes.',
    gamelan: 'Cyclical, rhythmic patterns.',
    koto: 'Flowing pentatonic melodies.',
    shamisen: 'Energetic, percussive.',
    cinematic: 'Epic, emotional.',
    lofi: 'Chill, relaxed.',
    electronic: 'Repetitive, hypnotic.',
    traditional: 'Simple folk melodies.'
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
        { role: 'system', content: systemPrompt + '\n\n' + (genreContexts[genre] || '') },
        { role: 'user', content: `Genre: ${genre}\nDescription: ${prompt}` }
      ],
      temperature: 0.7,
      max_tokens: 100
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
  notation = notation.replace(/^[^A-Z0-9]/im, '');
  notation = notation.split('\n')[0] || notation;

  return notation;
}

function updateAIStatusUI() {
  const status = document.getElementById('aiStatus');
  const generateBtn = document.getElementById('aiGenerateBtn');
  const hasKey = !!localStorage.getItem('openrouter-api-key');
  
  if (status) {
    status.textContent = hasKey ? 'API Key Set' : 'No API Key';
    status.classList.toggle('active', hasKey);
  }
  if (generateBtn) generateBtn.disabled = !hasKey;
}
