/**
 * TonalScript - Main Application Entry Point
 */

import { UIController } from './uiController.js';

document.addEventListener('DOMContentLoaded', () => {
  // These work immediately, no need to wait for Tone.js
  initSettingsModal();
  initAIGenerate();
  
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
      
      // Trigger input event for validation
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

  // Clean the notation
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

async function initApp() {
  try {
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
