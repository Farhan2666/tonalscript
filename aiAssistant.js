/**
 * TonalScript - AI Assistant with OpenRouter
 * Actually generates music from text prompts
 */

const AI_URL = 'https://openrouter.ai/api/v1/chat/completions';

const MUSIC_PROMPT = `You are a music composer AI. Given a description, return ONLY a JSON object with these fields:

{
  "key": "C",
  "scale": "major",
  "bpm": 120,
  "mood": "happy",
  "chords": [
    {"notes": ["C4","E4","G4"], "duration": "2n"},
    {"notes": ["F3","A3","C4"], "duration": "2n"}
  ],
  "bass": [
    {"note": "C2", "duration": "4n"},
    {"note": "F2", "duration": "4n"}
  ],
  "melodyScale": ["C4","D4","E4","F4","G4","A4","B4"],
  "drumPattern": "basic"
}

Rules:
- key: C, D, E, F, G, A, B (with optional # or b)
- scale: major, minor, pentatonic, blues, dorian, mixolydian
- bpm: 60-180
- chords: 4-8 chord progressions, each with notes array and duration (2n or 4n)
- bass: simple bass line matching chords
- melodyScale: notes that fit the mood
- drumPattern: basic, rock, hiphop, electronic, ballad, or minimal

Mood mapping:
- happy, sad, dark, bright, chill, aggressive, romantic, epic, mysterious
- Energetic = higher bpm, shorter durations
- Chill = lower bpm, longer durations
- Dark = minor scale
- Bright = major scale

Return ONLY the JSON, no other text.`;

export async function generateFromPrompt(prompt, apiKey, model = 'google/gemma-4-26b-a4b-it:free') {
  if (!apiKey) throw new Error('API key required');
  
  const res = await fetch(AI_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'TonalScript'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: MUSIC_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 1000
    })
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error: ${res.status}`);
  }
  
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI returned invalid format');
  
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error('Failed to parse AI response');
  }
}

// Convert AI response to our song format
export function aiToSong(aiResponse, genre) {
  const r = aiResponse;
  
  return {
    key: r.key || 'C',
    scale: r.scale || 'major',
    bpm: r.bpm || 120,
    genre: genre || 'custom',
    instrument: 'piano',
    
    melody: (r.melodyScale || ['C4','D4','E4','F4','G4']).map((note, i) => ({
      note: note,
      duration: '4n',
      velocity: 0.7 + Math.random() * 0.2,
      time: i * 0.25
    })),
    
    chords: (r.chords || []).flatMap((c, i) => [{
      notes: c.notes || ['C4','E4','G4'],
      duration: c.duration || '2n',
      velocity: 0.6,
      time: i * (c.duration === '2n' ? 1 : 0.5)
    }]),
    
    bass: (r.bass || []).flatMap((b, i) => [{
      note: b.note || 'C2',
      duration: b.duration || '4n',
      velocity: 0.8,
      time: i * 0.5
    }]),
    
    drums: r.drumPattern === 'rock' ? 
      {kick:[1,0,0,0,1,0,1,0,1,0,0,0,1,0,1,0], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hihat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0]} :
      r.drumPattern === 'hiphop' ?
      {kick:[1,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hihat:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]} :
      r.drumPattern === 'electronic' ?
      {kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hihat:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0]} :
      r.drumPattern === 'ballad' ?
      {kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], snare:[0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0], hihat:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0]} :
      r.drumPattern === 'minimal' ?
      {kick:[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], snare:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], hihat:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0]} :
      {kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hihat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0]},
    
    bars: 8
  };
}
