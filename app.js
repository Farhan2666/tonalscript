/**
 * TonalScript - Main App with Real Music Engine
 */

import { SongGenerator, MusicEngine, ExportEngine } from './musicEngine.js';

let engine = null;
let generator = new SongGenerator();
let currentSong = null;
let isPlaying = false;

document.addEventListener('DOMContentLoaded', () => {
  setupUI();
  setupSettings();
  setupAIGenerate();
});

async function ensureEngine() {
  if (engine && engine.isPlaying !== undefined) return true;
  try {
    await Tone.start();
    engine = new MusicEngine();
    await engine.init();
    return true;
  } catch (err) {
    console.error('Init failed:', err);
    return false;
  }
}

function setupUI() {
  const playBtn = document.getElementById('playBtn');
  const stopBtn = document.getElementById('stopBtn');
  const generateBtn = document.getElementById('generateSongBtn');
  const genreSelect = document.getElementById('genreSelect');
  const exportBtn = document.getElementById('exportBtn');
  const exportModal = document.getElementById('exportModal');
  const cancelExport = document.getElementById('cancelExport');
  const confirmExport = document.getElementById('confirmExport');
  const durationSlider = document.getElementById('durationSlider');
  const durationValue = document.getElementById('durationValue');
  const formatSelect = document.getElementById('formatSelect');
  const songInfo = document.getElementById('songInfo');

  // Generate Song button
  generateBtn.addEventListener('click', () => {
    const genre = genreSelect.value;
    currentSong = generator.generate(genre);
    
    // Display song info
    songInfo.innerHTML = `
      <strong>Generated:</strong> ${genre.charAt(0).toUpperCase() + genre.slice(1)} in ${currentSong.key} ${currentSong.scale}
      <br><strong>BPM:</strong> ${currentSong.bpm} | <strong>Bars:</strong> ${currentSong.bars}
      <br><strong>Chords:</strong> ${currentSong.progression.map(i => {
        const notes = ['I','II','III','IV','V','VI','VII'];
        return notes[i] || i;
      }).join(' - ')}
    `;
    songInfo.classList.add('has-content');
    
    playBtn.disabled = false;
    exportBtn.disabled = false;
  });

  // Play
  playBtn.addEventListener('click', async () => {
    if (!currentSong) { alert('Generate a song first!'); return; }
    if (!await ensureEngine()) { alert('Click page first!'); return; }
    
    engine.stop();
    engine.playSong(currentSong);
    isPlaying = true;
    playBtn.disabled = true;
    stopBtn.disabled = false;
  });

  // Stop
  stopBtn.addEventListener('click', () => {
    if (engine) engine.stop();
    isPlaying = false;
    playBtn.disabled = false;
    stopBtn.disabled = true;
  });

  // Export
  exportBtn.addEventListener('click', () => {
    if (!currentSong) { alert('Generate a song first!'); return; }
    exportModal.classList.remove('hidden');
  });

  cancelExport.addEventListener('click', () => exportModal.classList.add('hidden'));

  confirmExport.addEventListener('click', async () => {
    const duration = parseInt(durationSlider.value);
    const format = formatSelect.value;
    
    modal.classList.add('hidden');
    confirmExport.disabled = true;
    confirmExport.textContent = 'Recording...';

    try {
      await ensureEngine();
      const blob = await ExportEngine.export(currentSong, format, duration);
      download(blob, `tonalscript-${currentSong.key}-${Date.now()}.${format}`);
    } catch (err) {
      console.error('Export error:', err);
      alert('Export failed: ' + err.message);
    } finally {
      confirmExport.disabled = false;
      confirmExport.textContent = 'Download';
    }
  });

  durationSlider.addEventListener('input', () => {
    durationValue.textContent = durationSlider.value;
  });

  exportModal.addEventListener('click', (e) => {
    if (e.target === exportModal) exportModal.classList.add('hidden');
  });
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
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
  const songInfo = document.getElementById('songInfo');

  btn.onclick = async () => {
    const text = prompt.value.trim();
    const key = localStorage.getItem('openrouter-api-key') || '';
    if (!text) { error.textContent = 'Enter description'; return; }
    if (!key) { error.textContent = 'Set API key first'; return; }

    btn.disabled = true;
    btn.textContent = 'Generating...';
    error.textContent = '';

    try {
      const result = await callAPI(key, text, genre.value);
      currentSong = generator.generate(genre.value);
      
      songInfo.innerHTML = `
        <strong>AI Generated:</strong> ${genre.value.charAt(0).toUpperCase() + genre.value.slice(1)} in ${currentSong.key} ${currentSong.scale}
        <br><strong>BPM:</strong> ${currentSong.bpm} | <strong>Bars:</strong> ${currentSong.bars}
      `;
      songInfo.classList.add('has-content');
      
      document.getElementById('playBtn').disabled = false;
      document.getElementById('exportBtn').disabled = false;
    } catch (err) {
      error.textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Generate Song';
    }
  };
}

async function callAPI(apiKey, prompt, genre) {
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
        { role: 'system', content: 'You are a music generator. Return a JSON with key, scale, tempo settings.' },
        { role: 'user', content: `Generate ${genre} music: ${prompt}` }
      ],
      temperature: 0.7,
      max_tokens: 100
    })
  });
  if (!res.ok) throw new Error('API failed');
  const data = await res.json();
  return data.choices[0]?.message?.content;
}

function updateAIStatus() {
  const status = document.getElementById('aiStatus');
  const btn = document.getElementById('aiGenerateBtn');
  const hasKey = !!localStorage.getItem('openrouter-api-key');
  if (status) { status.textContent = hasKey ? 'API Set ✓' : 'No API Key'; status.classList.toggle('active', hasKey); }
  if (btn) btn.disabled = !hasKey;
}

updateAIStatus();
