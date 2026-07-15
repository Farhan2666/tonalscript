/**
 * TonalScript - Main Application v2 (with MP3 Export)
 */

import { CleanAudioEngine, INSTRUMENTS, NOTE_MAP } from './audioEngine.js';

let engine = null;
let isPlaying = false;
let recorder = null;
let isRecording = false;

document.addEventListener('DOMContentLoaded', () => {
  setupSettings();
  setupAIGenerate();
  setupPlayback();
  setupInstrumentSelect();
  setupExport();
});

async function ensureEngine() {
  if (engine && engine.synth) return true;
  try {
    await Tone.start();
    engine = new CleanAudioEngine();
    await engine.init();
    
    // Setup recorder
    recorder = new Tone.Recorder();
    engine.synth.connect(recorder);
    
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
  const typeMap = {
    Modern: ['piano', 'guitar', 'bass', 'synth', 'flute'],
    Traditional: ['gamelan', 'koto'],
    Ambient: ['pad', 'strings', 'bells']
  };

  Object.entries(typeMap).forEach(([type, keys]) => {
    const group = document.createElement('optgroup');
    group.label = type;
    keys.forEach(key => {
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
  } catch(e) {}
}

function setupExport() {
  const exportBtn = document.getElementById('exportBtn');
  const modal = document.getElementById('exportModal');
  const cancelBtn = document.getElementById('cancelExport');
  const confirmBtn = document.getElementById('confirmExport');
  const durationSlider = document.getElementById('durationSlider');
  const durationValue = document.getElementById('durationValue');
  const formatSelect = document.getElementById('formatSelect');

  durationSlider.addEventListener('input', () => {
    durationValue.textContent = durationSlider.value;
  });

  exportBtn.addEventListener('click', async () => {
    if (!await ensureEngine()) {
      alert('Audio not initialized. Click anywhere first.');
      return;
    }
    modal.classList.remove('hidden');
  });

  cancelBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  confirmBtn.addEventListener('click', async () => {
    const duration = parseInt(durationSlider.value);
    const format = formatSelect ? formatSelect.value : 'wav';
    
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Recording...';
    modal.classList.add('hidden');

    try {
      await exportAudio(duration, format);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed: ' + err.message);
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Download';
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });
}

async function exportAudio(duration, format) {
  const textarea = document.getElementById('notationInput');
  const text = textarea.value.trim();
  if (!text) throw new Error('No notation to export');

  const notes = engine.parseNotation(text);
  if (!notes.length) throw new Error('No valid notes');

  // Start recording
  await recorder.start();
  
  // Play notes
  engine.stop();
  Tone.Transport.bpm.value = parseInt(document.getElementById('bpmSlider').value);
  
  const noteSpacing = 60 / Tone.Transport.bpm.value;
  notes.forEach(({ note, duration: dur }, i) => {
    Tone.Transport.scheduleOnce((time) => {
      engine.synth.triggerAttackRelease(note, dur, time);
    }, `+${i * noteSpacing * 0.5}`);
  });
  
  Tone.Transport.start();

  // Wait for duration
  await new Promise(resolve => setTimeout(resolve, duration * 1000));

  // Stop and get recording
  engine.stop();
  const recording = await recorder.stop();

  if (!recording || recording.length === 0) {
    throw new Error('No audio recorded');
  }

  // Convert and download
  if (format === 'mp3') {
    await downloadAsMP3(recording);
  } else {
    downloadAsWAV(recording);
  }
}

function downloadAsWAV(audioBuffer) {
  const blob = new Blob([audioBuffer], { type: 'audio/wav' });
  downloadBlob(blob, 'tonalscript-export.wav');
}

async function downloadAsMP3(audioBuffer) {
  // Convert AudioBuffer to WAV first, then to MP3
  const audioContext = Tone.context;
  const wavBuffer = await audioBuffer.arrayBuffer();
  
  // Decode the WAV data
  const decodedAudio = await audioContext.decodeAudioData(wavBuffer);
  
  // Get raw PCM data
  const numChannels = decodedAudio.numberOfChannels;
  const sampleRate = decodedAudio.sampleRate;
  const length = decodedAudio.length;
  
  // Interleave channels
  let pcmData;
  if (numChannels === 2) {
    const left = decodedAudio.getChannelData(0);
    const right = decodedAudio.getChannelData(1);
    pcmData = new Float32Array(length * 2);
    for (let i = 0; i < length; i++) {
      pcmData[i * 2] = left[i];
      pcmData[i * 2 + 1] = right[i];
    }
  } else {
    pcmData = decodedAudio.getChannelData(0);
  }

  // Convert Float32 to Int16
  const int16Data = new Int16Array(pcmData.length);
  for (let i = 0; i < pcmData.length; i++) {
    const s = Math.max(-1, Math.min(1, pcmData[i]));
    int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  // Encode to MP3 using lamejs
  if (typeof lamejs === 'undefined') {
    // Fallback to WAV if lamejs not loaded
    console.warn('lamejs not loaded, falling back to WAV');
    const wavBlob = audioBufferToWav(decodedAudio);
    downloadBlob(wavBlob, 'tonalscript-export.wav');
    return;
  }

  const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, 128);
  const mp3Data = [];
  
  const chunkSize = 1152;
  for (let i = 0; i < int16Data.length; i += chunkSize) {
    const chunk = int16Data.subarray(i, i + chunkSize);
    const mp3buf = mp3encoder.encodeBuffer(chunk);
    if (mp3buf.length > 0) mp3Data.push(mp3buf);
  }
  
  const mp3Footer = mp3encoder.flush();
  if (mp3Footer.length > 0) mp3Data.push(mp3Footer);

  const mp3Blob = new Blob(mp3Data, { type: 'audio/mp3' });
  downloadBlob(mp3Blob, 'tonalscript-export.mp3');
}

function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  let interleaved;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    interleaved = new Float32Array(left.length * 2);
    for (let i = 0; i < left.length; i++) {
      interleaved[i * 2] = left[i];
      interleaved[i * 2 + 1] = right[i];
    }
  } else {
    interleaved = buffer.getChannelData(0);
  }

  const dataLength = interleaved.length * 2;
  const bufferArray = new ArrayBuffer(44 + dataLength);
  const view = new DataView(bufferArray);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bitDepth / 8, true);
  view.setUint16(32, numChannels * bitDepth / 8, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write PCM data
  const offset = 44;
  for (let i = 0; i < interleaved.length; i++) {
    const sample = Math.max(-1, Math.min(1, interleaved[i]));
    view.setInt16(offset + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
  }

  return new Blob([bufferArray], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
