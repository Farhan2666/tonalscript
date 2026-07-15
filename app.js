/**
 * TonalScript - Main Application v2 (Clean)
 */

import { CleanAudioEngine, INSTRUMENTS, NOTE_MAP } from './audioEngine.js';

let engine = null;
let isPlaying = false;

document.addEventListener('DOMContentLoaded', () => {
  setupSettings();
  setupAIGenerate();
  setupPlayback();
  setupInstrumentSelect();
});

async function ensureEngine() {
  if (engine && engine.synth) return true;
  try {
    await Tone.start();
    engine = new CleanAudioEngine();
    await engine.init();
    return true;
  } catch (err) {
    console.error('Audio init failed:', err);
    return false;
  }
}

function setupInstrumentSelect() {
  const select = document.getElementById('presetSelect');
  if (!select) return;

  select.innerHTML = '';
  const types = ['Modern', 'Traditional', 'Ambient'];
  const typeMap = {
    Modern: ['piano', 'guitar', 'bass', 'synth', 'flute'],
    Traditional: ['gamelan', 'koto'],
    Ambient: ['pad', 'strings', 'bells']
  };

  types.forEach(type => {
    const group = document.createElement('optgroup');
    group.label = type;
    typeMap[type].forEach(key => {
      if (INSTRUMENTS[key]) {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = INSTRUMENTS[key].name;
        group.appendChild(opt);
      }
    });
    select.appendChild(group);
  });

  select.onchange = () => {
    if (engine) engine.setInstrument(select.value);
  };
}

function setupPlayback() {
  const playBtn = document.getElementById('playBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const stopBtn = document.getElementById('stopBtn');
  const textarea = document.getElementById('notationInput');
  const errorEl = document.getElementById('inputError');
  const bpmSlider = document.getElementById('bpmSlider');
  const bpmValue = document.getElementById('bpmValue');
  const instrumentSelect = document.getElementById('presetSelect');

  textarea.addEventListener('input', () => {
    playBtn.disabled = !textarea.value.trim() || isPlaying;
    errorEl.textContent = '';
  });

  bpmSlider.addEventListener('input', () => {
    bpmValue.textContent = bpmSlider.value;
    if (engine && isPlaying) Tone.Transport.bpm.value = parseInt(bpmSlider.value);
  });

  playBtn.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) return;

    if (!await ensureEngine()) {
      errorEl.textContent = 'Click anywhere first to enable audio';
      return;
    }

    if (instrumentSelect.value) engine.setInstrument(instrumentSelect.value);

    const notes = engine.parseNotation(text);
    if (!notes.length) {
      errorEl.textContent = 'No valid notes found';
      return;
    }

    engine.stop();
    engine.playNotes(notes, parseInt(bpmSlider.value));
    isPlaying = true;

    playBtn.disabled = true;
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
    textarea.readOnly = true;
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
    textarea.readOnly = false;
  });

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      isPlaying ? stopBtn.click() : playBtn.click();
    }
  });

  // Load saved state
  try {
    const saved = JSON.parse(localStorage.getItem('tonalscript-state') || '{}');
    if (saved.lastNotation) {
      textarea.value = saved.lastNotation;
      playBtn.disabled = false;
    }
    if (saved.bpm) {
      bpmSlider.value = saved.bpm;
      bpmValue.textContent = saved.bpm;
    }
    if (saved.instrument && instrumentSelect.querySelector(`value="${saved.instrument}"`)) {
      instrumentSelect.value = saved.instrument;
    }
  } catch(e) {}
}

function setupSettings() {
  const btn = document.getElementById('settingsBtn');
  const modal = document.getElementById('settingsModal');
  const cancel = document.getElementById('cancelSettings');
  const save = document.getElementById('saveSettings');
  const toggle = document.getElementById('toggleKeyVisibility');
  const input = document.getElementById('apiKeyInput');

  input.value = localStorage.getItem('openrouter-api-key') || '';

  btn.onclick = () => {
    input.value = localStorage.getItem('openrouter-api-key') || '';
    modal.classList.remove('hidden');
  };

  cancel.onclick = () => modal.classList.add('hidden');

  save.onclick = () => {
    localStorage.setItem('openrouter-api-key', input.value.trim());
    modal.classList.add('hidden');
    updateAIStatus();
  };

  toggle.onclick = () => {
    input.type = input.type === 'password' ? 'text' : 'password';
  };

  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  };
}

function setupAIGenerate() {
  const btn = document.getElementById('aiGenerateBtn');
  const prompt = document.getElementById('aiPrompt');
  const genre = document.getElementById('aiGenre');
  const error = document.getElementById('aiError');
  const textarea = document.getElementById('notationInput');
  const playBtn = document.getElementById('playBtn');

  btn.onclick = async () => {
    const text = prompt.value.trim();
    const key = localStorage.getItem('openrouter-api-key') || '';

    if (!text) { error.textContent = 'Enter a description'; return; }
    if (!key) { error.textContent = 'Set API key first'; return; }

    btn.disabled = true;
    btn.textContent = 'Generating...';
    error.textContent = '';

    try {
      const notation = await callOpenRouterAPI(key, text, genre.value);
      textarea.value = notation;
      textarea.dispatchEvent(new Event('input'));
      playBtn.disabled = false;
      
      // Save state
      localStorage.setItem('tonalscript-state', JSON.stringify({
        lastNotation: notation,
        bpm: document.getElementById('bpmSlider').value,
        instrument: document.getElementById('presetSelect').value
      }));
    } catch (err) {
      error.textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Generate';
    }
  };

  prompt.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      btn.click();
    }
  };
}

async function callOpenRouterAPI(apiKey, prompt, genre) {
  const context = {
    ambient: 'Slow, peaceful, dreamy. Use notes: C4, E4, G4, A4 with long durations.',
    gamelan: 'Rhythmic metallic patterns. Use notes: C4, D4, E4, G4, A4.',
    koto: 'Flowing pentatonic. Use notes: C4, D4, E4, G4, A4.',
    shamisen: 'Energetic, rhythmic. Use notes: C4, E4, A4, B4.',
    cinematic: 'Epic emotional. Use notes: C4, D4, E4, F4, G4, A4, B4.',
    lofi: 'Chill relaxed. Use notes: C4, E4, G4, A4, B4.',
    electronic: 'Repetitive hypnotic. Use notes: C4, D4, E4, G4.',
    traditional: 'Simple folk. Use notes: C4, D4, E4, G4, A4.'
  };

  const systemPrompt = `You are a music notation generator for TonalScript.

FORMAT: NOTE:DURATION (comma separated)
- Notes: C4, D4, E4, F4, G4, A4, B4 (middle octave)
- Notes: C3, D3, E3, F3, G3, A3, B3 (low octave)  
- Notes: C5, D5, E5, F5, G5, A5, B5 (high octave)
- Sharps: C#4, D#4, F#4, G#4, A#4
- Duration: 4=quarter, 2=half, 8=eighth, 16=sixteenth
- Example: C4:4, E4:2, G4:4, A3:2

RULES:
- Return ONLY the notation string
- 8-16 notes per melody
- Mix short and long notes
- Use different octaves for variety
- Keep it musical and pleasant`;

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
        { role: 'system', content: systemPrompt + '\n\nGenre context: ' + (context[genre] || context.ambient) },
        { role: 'user', content: `Generate a ${genre} melody: ${prompt}` }
      ],
      temperature: 0.7,
      max_tokens: 150
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'API failed');
  }

  const data = await response.json();
  let notation = data.choices[0]?.message?.content?.trim();
  if (!notation) throw new Error('No notation generated');

  // Clean
  notation = notation.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
  notation = notation.replace(/^[^A-Z0-9]/im, '');
  notation = notation.split('\n')[0];

  return notation;
}

function updateAIStatus() {
  const status = document.getElementById('aiStatus');
  const btn = document.getElementById('aiGenerateBtn');
  const hasKey = !!localStorage.getItem('openrouter-api-key');
  
  if (status) {
    status.textContent = hasKey ? 'API Key Set ✓' : 'No API Key';
    status.classList.toggle('active', hasKey);
  }
  if (btn) btn.disabled = !hasKey;
}

updateAIStatus();
