/**
 * UI Controller module for TonalScript
 * Handles user interface interactions and state management
 */

import { parseNotation, validateNotation } from './parser.js';
import { AudioEngine } from './audioEngine.js';

export class UIController {
  constructor() {
    this.engine = new AudioEngine();
    this.playbackState = 'idle';
    this.bpm = 120;
    this.lastNotation = '';

    this.elements = {
      notationInput: document.getElementById('notationInput'),
      inputError: document.getElementById('inputError'),
      presetSelect: document.getElementById('presetSelect'),
      bpmSlider: document.getElementById('bpmSlider'),
      bpmValue: document.getElementById('bpmValue'),
      playBtn: document.getElementById('playBtn'),
      pauseBtn: document.getElementById('pauseBtn'),
      stopBtn: document.getElementById('stopBtn'),
      exportBtn: document.getElementById('exportBtn'),
      exportModal: document.getElementById('exportModal'),
      durationSlider: document.getElementById('durationSlider'),
      durationValue: document.getElementById('durationValue'),
      cancelExport: document.getElementById('cancelExport'),
      confirmExport: document.getElementById('confirmExport')
    };

    this.init();
  }

  async init() {
    await this.engine.init();
    this.loadState();
    this.bindEvents();
    this.updateUI();
  }

  bindEvents() {
    this.elements.notationInput.addEventListener('input', () => this.handleInputChange());
    this.elements.bpmSlider.addEventListener('input', (e) => this.handleBpmChange(e));
    this.elements.presetSelect.addEventListener('change', (e) => this.handlePresetChange(e));
    this.elements.playBtn.addEventListener('click', () => this.handlePlay());
    this.elements.pauseBtn.addEventListener('click', () => this.handlePause());
    this.elements.stopBtn.addEventListener('click', () => this.handleStop());
    this.elements.exportBtn.addEventListener('click', () => this.showExportModal());
    this.elements.cancelExport.addEventListener('click', () => this.hideExportModal());
    this.elements.confirmExport.addEventListener('click', () => this.handleExport());
    this.elements.durationSlider.addEventListener('input', (e) => {
      this.elements.durationValue.textContent = e.target.value;
    });

    document.addEventListener('click', () => {
      if (Tone.context.state !== 'running') {
        Tone.context.resume();
      }
    }, { once: true });

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (this.playbackState === 'playing') {
          this.handlePause();
        } else {
          this.handlePlay();
        }
      }
    });
  }

  handleInputChange() {
    const text = this.elements.notationInput.value;
    const { valid, errors } = validateNotation(text);

    if (text && !valid) {
      this.elements.inputError.textContent = errors[0];
      this.elements.playBtn.disabled = true;
    } else {
      this.elements.inputError.textContent = '';
      this.elements.playBtn.disabled = !text.trim();
    }

    this.lastNotation = text;
    this.saveState();
  }

  handleBpmChange(e) {
    this.bpm = parseInt(e.target.value, 10);
    this.elements.bpmValue.textContent = this.bpm;

    if (this.engine.isPlaying) {
      Tone.Transport.bpm.value = this.bpm;
    }

    this.saveState();
  }

  handlePresetChange(e) {
    this.engine.setPreset(e.target.value);
    this.saveState();
  }

  async handlePlay() {
    const text = this.elements.notationInput.value;
    if (!text.trim()) return;

    const notes = parseNotation(text);
    if (notes.length === 0) {
      this.elements.inputError.textContent = 'No valid notes found';
      return;
    }

    this.engine.playNotes(notes, this.bpm);
    this.playbackState = 'playing';
    this.updateUI();
  }

  handlePause() {
    if (this.playbackState === 'playing') {
      this.engine.pause();
      this.playbackState = 'paused';
    } else if (this.playbackState === 'paused') {
      this.engine.resume();
      this.playbackState = 'playing';
    }
    this.updateUI();
  }

  handleStop() {
    this.engine.stop();
    this.playbackState = 'idle';
    this.updateUI();
  }

  updateUI() {
    const isIdle = this.playbackState === 'idle';
    const isPlaying = this.playbackState === 'playing';

    this.elements.playBtn.disabled = isPlaying || !this.elements.notationInput.value.trim();
    this.elements.pauseBtn.disabled = isIdle;
    this.elements.stopBtn.disabled = isIdle;
    this.elements.notationInput.readOnly = isPlaying;

    this.elements.playBtn.textContent = isPlaying ? '⏸' : '▶';
    this.elements.pauseBtn.textContent = isPlaying ? '⏸' : '▶';
  }

  showExportModal() {
    this.elements.exportModal.classList.remove('hidden');
  }

  hideExportModal() {
    this.elements.exportModal.classList.add('hidden');
  }

  async handleExport() {
    const duration = parseInt(this.elements.durationSlider.value, 10);

    this.hideExportModal();
    this.elements.exportBtn.disabled = true;
    this.elements.exportBtn.textContent = 'Recording...';

    try {
      await this.engine.startRecording();

      const notes = parseNotation(this.lastNotation);
      this.engine.playNotes(notes, this.bpm);

      await new Promise(resolve => setTimeout(resolve, duration * 1000));

      this.engine.stop();
      const recording = await this.engine.stopRecording();

      if (recording) {
        const blob = new Blob([recording], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tonalscript-${Date.now()}.wav`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      this.elements.exportBtn.disabled = false;
      this.elements.exportBtn.textContent = '💾 Export';
      this.playbackState = 'idle';
      this.updateUI();
    }
  }

  saveState() {
    const state = {
      lastNotation: this.lastNotation,
      bpm: this.bpm,
      activePreset: this.elements.presetSelect.value
    };
    localStorage.setItem('tonalscript-state', JSON.stringify(state));
  }

  loadState() {
    try {
      const saved = localStorage.getItem('tonalscript-state');
      if (saved) {
        const state = JSON.parse(saved);
        this.elements.notationInput.value = state.lastNotation || '';
        this.bpm = state.bpm || 120;
        this.elements.bpmSlider.value = this.bpm;
        this.elements.bpmValue.textContent = this.bpm;
        this.elements.presetSelect.value = state.activePreset || 'gamelan';
        this.engine.setPreset(state.activePreset || 'gamelan');
        this.lastNotation = state.lastNotation || '';
      }
    } catch (err) {
      console.warn('Failed to load state:', err);
    }
  }
}
