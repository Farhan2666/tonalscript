/**
 * Audio Engine module for TonalScript
 * Handles audio synthesis and playback using Tone.js
 */

const PRESETS = {
  gamelan: {
    synth: {
      oscillator: { type: "metal" },
      envelope: { attack: 0.1, decay: 0.3, sustain: 0.2, release: 0.5 }
    },
    effects: {
      reverb: { decay: 3, wet: 0.5 },
      delay: { delayTime: "8n.", feedback: 0.4, wet: 0.3 }
    }
  },
  koto: {
    synth: {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.1, release: 0.4 }
    },
    effects: {
      reverb: { decay: 2.5, wet: 0.4 },
      delay: { delayTime: "8n", feedback: 0.3, wet: 0.25 }
    }
  },
  shamisen: {
    synth: {
      oscillator: { type: "square" },
      envelope: { attack: 0.02, decay: 0.15, sustain: 0.1, release: 0.3 }
    },
    effects: {
      reverb: { decay: 2, wet: 0.35 },
      delay: { delayTime: "16n", feedback: 0.25, wet: 0.2 }
    }
  },
  ambient: {
    synth: {
      oscillator: { type: "sine" },
      envelope: { attack: 0.5, decay: 0.3, sustain: 0.4, release: 1 }
    },
    effects: {
      reverb: { decay: 4, wet: 0.6 },
      delay: { delayTime: "4n", feedback: 0.5, wet: 0.4 }
    }
  },
  cinematic: {
    synth: {
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.3, decay: 0.4, sustain: 0.3, release: 0.8 }
    },
    effects: {
      reverb: { decay: 3.5, wet: 0.55 },
      delay: { delayTime: "8n", feedback: 0.35, wet: 0.3 }
    }
  },
  lofi: {
    synth: {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.2, decay: 0.25, sustain: 0.35, release: 0.6 }
    },
    effects: {
      reverb: { decay: 2, wet: 0.3 },
      delay: { delayTime: "8n.", feedback: 0.4, wet: 0.35 }
    }
  },
  electronic: {
    synth: {
      oscillator: { type: "square" },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.3, release: 0.4 }
    },
    effects: {
      reverb: { decay: 2.5, wet: 0.45 },
      delay: { delayTime: "16n", feedback: 0.3, wet: 0.25 }
    }
  },
  traditional: {
    synth: {
      oscillator: { type: "sine" },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.25, release: 0.5 }
    },
    effects: {
      reverb: { decay: 2, wet: 0.35 },
      delay: { delayTime: "8n", feedback: 0.25, wet: 0.2 }
    }
  }
};

export class AudioEngine {
  constructor() {
    this.synth = null;
    this.reverb = null;
    this.delay = null;
    this.recorder = null;
    this.currentPreset = 'gamelan';
    this.isPlaying = false;
    this.scheduledEvents = [];
  }

  async init() {
    await Tone.start();

    this.synth = new Tone.Synth(PRESETS[this.currentPreset].synth).toDestination();
    this.reverb = new Tone.Reverb(PRESETS[this.currentPreset].effects.reverb).toDestination();
    this.delay = new Tone.FeedbackDelay(
      PRESETS[this.currentPreset].effects.delay.delayTime,
      PRESETS[this.currentPreset].effects.delay.feedback
    ).toDestination();

    this.synth.chain(this.delay, this.reverb, Tone.Destination);

    this.recorder = new Tone.Recorder();
    this.synth.connect(this.recorder);
  }

  setPreset(presetName) {
    if (!PRESETS[presetName]) {
      console.warn(`Preset "${presetName}" not found`);
      return;
    }

    this.currentPreset = presetName;
    const preset = PRESETS[presetName];

    if (this.synth) {
      this.synth.oscillator.type = preset.synth.oscillator.type;
      this.synth.envelope.attack = preset.synth.envelope.attack;
      this.synth.envelope.decay = preset.synth.envelope.decay;
      this.synth.envelope.sustain = preset.synth.envelope.sustain;
      this.synth.envelope.release = preset.synth.envelope.release;
    }

    if (this.reverb) {
      this.reverb.decay = preset.effects.reverb.decay;
      this.reverb.wet.value = preset.effects.reverb.wet;
    }

    if (this.delay) {
      this.delay.delayTime.value = preset.effects.delay.delayTime;
      this.delay.feedback.value = preset.effects.delay.feedback;
      this.delay.wet.value = preset.effects.delay.wet;
    }
  }

  playNotes(notes, bpm) {
    if (!this.synth) {
      console.error('AudioEngine not initialized');
      return;
    }

    this.stop();
    Tone.Transport.bpm.value = bpm;

    notes.forEach(({ note, duration }, i) => {
      const eventId = Tone.Transport.scheduleOnce((time) => {
        this.synth.triggerAttackRelease(note, duration, time);
      }, `+${i * 0.5}`);
      this.scheduledEvents.push(eventId);
    });

    Tone.Transport.start();
    this.isPlaying = true;
  }

  pause() {
    if (this.isPlaying) {
      Tone.Transport.pause();
      this.isPlaying = false;
    }
  }

  resume() {
    if (!this.isPlaying && Tone.Transport.state === 'paused') {
      Tone.Transport.start();
      this.isPlaying = true;
    }
  }

  stop() {
    this.scheduledEvents.forEach(id => {
      Tone.Transport.clear(id);
    });
    this.scheduledEvents = [];
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    this.isPlaying = false;
  }

  async startRecording() {
    if (this.recorder) {
      await this.recorder.start();
    }
  }

  async stopRecording() {
    if (this.recorder) {
      const recording = await this.recorder.stop();
      return recording;
    }
    return null;
  }

  exportWAV() {
    return this.recorder ? this.recorder.stop() : null;
  }
}

export { PRESETS };
