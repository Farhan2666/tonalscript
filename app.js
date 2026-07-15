/**
 * TonalScript - Main App v4.1
 * AI actually generates music from prompts
 */

import { SongGenerator, MusicEngine, ExportEngine, GENRES } from './musicEngine.js';
import { generateFromPrompt, aiToSong } from './aiAssistant.js';

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
  if (engine && engine.synths) return true;
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

  generateBtn.addEventListener('click', () => {
    const genre = genreSelect.value;
    currentSong = generator.generate(genre);
    
    songInfo.innerHTML = `
      <strong>${genre.toUpperCase()}</strong> in ${currentSong.key} ${currentSong.scale} | ${currentSong.bpm} BPM
    `;
    songInfo.classList.add('has-content');
    playBtn.disabled = false;
    exportBtn.disabled = false;
    
    // Show tracks
    updateTracks(currentSong);
  });

  playBtn.addEventListener('click', async () => {
    if (!currentSong) return;
    if (!await ensureEngine()) { alert('Click page first!'); return; }
    engine.stop();
    engine.playSong(currentSong);
    isPlaying = true;
    playBtn.disabled = true;
    stopBtn.disabled = false;
  });

  stopBtn.addEventListener('click', () => {
    if (engine) engine.stop();
    isPlaying = false;
    playBtn.disabled = false;
    stopBtn.disabled = true;
  });

  exportBtn.addEventListener('click', () => {
    if (!currentSong) return;
    exportModal.classList.remove('hidden');
  });

  cancelExport.addEventListener('click', () => exportModal.classList.add('hidden'));

  confirmExport.addEventListener('click', async () => {
    const duration = parseInt(durationSlider.value);
    const format = formatSelect.value;
    exportModal.classList.add('hidden');
    confirmExport.disabled = true;
    confirmExport.textContent = 'Recording...';

    try {
      await ensureEngine();
      const blob = await ExportEngine.export(currentSong, format, duration);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tonalscript-${currentSong.genre}-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      confirmExport.disabled = false;
      confirmExport.textContent = 'Download';
    }
  });

  durationSlider.addEventListener('input', () => durationValue.textContent = durationSlider.value);
  exportModal.addEventListener('click', (e) => { if (e.target === exportModal) exportModal.classList.add('hidden'); });
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
  const playBtn = document.getElementById('playBtn');
  const exportBtn = document.getElementById('exportBtn');

  btn.onclick = async () => {
    const text = prompt.value.trim();
    const apiKey = localStorage.getItem('openrouter-api-key') || '';
    if (!text) { error.textContent = 'Describe what you want'; return; }
    if (!apiKey) { error.textContent = 'Set API key in Settings'; return; }

    btn.disabled = true;
    btn.textContent = 'AI Thinking...';
    error.textContent = '';

    try {
      // Call AI to generate music parameters
      const aiResponse = await generateFromPrompt(text, apiKey);
      
      // Convert to song format
      currentSong = aiToSong(aiResponse, genre.value);
      
      songInfo.innerHTML = `
        <strong>AI Generated</strong> | ${currentSong.key} ${currentSong.scale} | ${currentSong.bpm} BPM
        <br><small>Prompt: "${text}"</small>
      `;
      songInfo.classList.add('has-content');
      playBtn.disabled = false;
      exportBtn.disabled = false;
      
      // Show tracks
      updateTracks(currentSong);
      
    } catch (err) {
      error.textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Generate';
    }
  };
}

function updateTracks(song) {
  const melNotes = song.melody.slice(0, 16).map(n => n.note).join(' ');
  const chdNotes = song.chords.slice(0, 4).map(c => c.notes.join('-')).join(' | ');
  const basNotes = song.bass.slice(0, 16).map(n => n.note).join(' ');
  const drumPat = song.drums.kick.map((k,i) => {
    let s = '';
    if (k) s += 'K';
    if (song.drums.snare[i]) s += 'S';
    if (song.drums.hihat[i]) s += 'H';
    return s || '-';
  }).join(' ');
  
  document.getElementById('melodyTrack').textContent = melNotes || 'Empty';
  document.getElementById('chordsTrack').textContent = chdNotes || 'Empty';
  document.getElementById('bassTrack').textContent = basNotes || 'Empty';
  document.getElementById('drumsTrack').textContent = drumPat || 'Empty';
}

function updateAIStatus() {
  const status = document.getElementById('aiStatus');
  const btn = document.getElementById('aiGenerateBtn');
  const hasKey = !!localStorage.getItem('openrouter-api-key');
  if (status) { status.textContent = hasKey ? 'API Set ✓' : 'No API Key'; status.classList.toggle('active', hasKey); }
  if (btn) btn.disabled = !hasKey;
}

updateAIStatus();
