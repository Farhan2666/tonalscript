/**
 * TonalScript - Main Application Entry Point
 */

import { UIController } from './uiController.js';

document.addEventListener('DOMContentLoaded', () => {
  // Settings modal works immediately, no need to wait for Tone.js
  initSettingsModal();
  
  // Initialize audio engine (may fail if Tone.js not loaded)
  initApp();
});

function initSettingsModal() {
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const cancelSettings = document.getElementById('cancelSettings');
  const saveSettings = document.getElementById('saveSettings');
  const toggleKeyVisibility = document.getElementById('toggleKeyVisibility');
  const apiKeyInput = document.getElementById('apiKeyInput');

  // Load saved API key
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

  // Close modal on outside click
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.add('hidden');
    }
  });

  updateAIStatusUI();
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

async function initApp() {
  try {
    // Check if Tone.js is loaded
    if (typeof Tone !== 'undefined') {
      const controller = new UIController();
      window.tonalScriptController = controller;
    } else {
      console.warn('Tone.js not loaded, audio features disabled');
    }
  } catch (err) {
    console.error('Failed to initialize app:', err);
  }
}
