/**
 * AI Module for TonalScript
 * Uses OpenRouter API with BYOK (Bring Your Own Key)
 * Default model: DeepSeek Chat (free)
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'deepseek/deepseek-chat:free';

const SYSTEM_PROMPT = `You are a music notation assistant for TonalScript. Users will describe music they want, and you generate notation in TonalScript format.

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

export class AIAssistant {
  constructor() {
    this.apiKey = this.loadApiKey();
    this.model = DEFAULT_MODEL;
  }

  loadApiKey() {
    return localStorage.getItem('openrouter-api-key') || '';
  }

  saveApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('openrouter-api-key', key);
  }

  hasApiKey() {
    return this.apiKey.length > 0;
  }

  async generateNotation(prompt, genre = 'ambient') {
    if (!this.hasApiKey()) {
      throw new Error('API key not set. Please add your OpenRouter API key in Settings.');
    }

    const genreContext = this.getGenreContext(genre);
    const userMessage = `Genre: ${genre}\nDescription: ${prompt}\n\nGenerate notation based on this description. Return ONLY the notation string.`;

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'TonalScript'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT + '\n\n' + genreContext },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 200
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      const data = await response.json();
      const notation = data.choices[0]?.message?.content?.trim();

      if (!notation) {
        throw new Error('No notation generated');
      }

      return this.cleanNotation(notation);
    } catch (err) {
      console.error('AI generation failed:', err);
      throw err;
    }
  }

  cleanNotation(raw) {
    let cleaned = raw.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
    cleaned = cleaned.replace(/^[^A-Z0-9]/im, '');
    const lines = cleaned.split('\n');
    return lines[0] || cleaned;
  }

  getGenreContext(genre) {
    const contexts = {
      ambient: 'Create slow, atmospheric ambient music. Use longer notes and create a dreamy, spacious feel.',
      gamelan: 'Create traditional Indonesian Gamelan music. Use metallic, percussive sounds with cyclical patterns.',
      koto: 'Create traditional Japanese Koto music. Use pentatonic scales with graceful, flowing melodies.',
      shamisen: 'Create traditional Japanese Shamisen music. Use rhythmic, percussive patterns.',
      cinematic: 'Create epic cinematic music. Use dramatic builds and emotional progressions.',
      lofi: 'Create chill lofi beats. Use relaxed, mellow patterns with swing feel.',
      electronic: 'Create electronic/ambient music. Use repetitive, hypnotic patterns.',
      traditional: 'Create traditional folk music. Use simple, memorable melodies.'
    };
    return contexts[genre] || contexts.ambient;
  }

  getAvailableModels() {
    return [
      { id: 'deepseek/deepseek-chat:free', name: 'DeepSeek Chat (Free)', free: true },
      { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Free)', free: true },
      { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B (Free)', free: true },
      { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (Free)', free: true },
      { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', free: false }
    ];
  }

  setModel(modelId) {
    this.model = modelId;
  }
}
