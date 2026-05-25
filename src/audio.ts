// Chiptune-style SFX via Web Audio. Sounds are procedural — squares
// and noise bursts shaped by a small ADSR-ish envelope — so we ship
// zero audio files.
//
// initAudio() must be called from a user gesture (browser autoplay
// policy). We wire it to the first keydown / pointerdown via the
// input layer.

import { loadSettings } from './settings';

let ctx: AudioContext | null = null;

export function initAudio(): void {
  if (ctx) return;
  const Ctor = (window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  if (!Ctor) return;
  try {
    ctx = new Ctor();
  } catch {
    /* user agent denied or unsupported */
  }
}

interface ToneParams {
  type: OscillatorType;
  freq: number;
  freqEnd?: number;       // exponential ramp end (slide)
  duration: number;       // seconds
  gain?: number;          // peak gain (0..1)
  attack?: number;        // seconds
  delay?: number;         // seconds before start (for sequenced notes)
}

interface NoiseParams {
  duration: number;
  gain?: number;
  delay?: number;
  // Filter cutoff sweep makes it more "tonal"
  cutoffStart?: number;
  cutoffEnd?: number;
}

function tone(p: ToneParams): void {
  if (!ctx) return;
  if (!loadSettings().sfxEnabled) return;
  const start = ctx.currentTime + (p.delay ?? 0);
  const dur = p.duration;
  const peak = p.gain ?? 0.1;
  const attack = p.attack ?? 0.005;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(peak, start + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  g.connect(ctx.destination);

  const osc = ctx.createOscillator();
  osc.type = p.type;
  osc.frequency.setValueAtTime(p.freq, start);
  if (p.freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(p.freqEnd, start + dur);
  }
  osc.connect(g);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function noise(p: NoiseParams): void {
  if (!ctx) return;
  if (!loadSettings().sfxEnabled) return;
  const start = ctx.currentTime + (p.delay ?? 0);
  const dur = p.duration;
  const peak = p.gain ?? 0.06;

  const bufSize = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(p.cutoffStart ?? 4000, start);
  if (p.cutoffEnd !== undefined) {
    filter.frequency.exponentialRampToValueAtTime(p.cutoffEnd, start + dur);
  }

  const g = ctx.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(peak, start + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

  src.connect(filter); filter.connect(g); g.connect(ctx.destination);
  src.start(start); src.stop(start + dur + 0.02);
}

export const sfx = {
  click:   () => tone({ type: 'square', freq: 1200, duration: 0.03, gain: 0.04 }),
  cursor:  () => tone({ type: 'square', freq: 660,  duration: 0.04, gain: 0.05 }),
  confirm: () => tone({ type: 'square', freq: 660, freqEnd: 990, duration: 0.10 }),
  cancel:  () => tone({ type: 'square', freq: 440, freqEnd: 220, duration: 0.10 }),
  plant:   () => tone({ type: 'triangle', freq: 440, freqEnd: 550, duration: 0.10, gain: 0.10 }),
  harvest: () => {
    tone({ type: 'triangle', freq: 880, duration: 0.07, gain: 0.10 });
    tone({ type: 'triangle', freq: 1320, duration: 0.10, gain: 0.10, delay: 0.06 });
  },
  water:   () => noise({ duration: 0.12, gain: 0.05, cutoffStart: 2000, cutoffEnd: 400 }),
  brew:    () => {
    tone({ type: 'square', freq: 220, freqEnd: 660, duration: 0.14, gain: 0.08 });
    tone({ type: 'square', freq: 330, freqEnd: 770, duration: 0.14, gain: 0.08, delay: 0.10 });
    tone({ type: 'square', freq: 440, freqEnd: 990, duration: 0.18, gain: 0.08, delay: 0.20 });
  },
  puzzleCorrect: () => {
    tone({ type: 'square', freq: 523, duration: 0.12 });
    tone({ type: 'square', freq: 659, duration: 0.12, delay: 0.10 });
    tone({ type: 'square', freq: 784, duration: 0.18, delay: 0.20 });
  },
  puzzleWrong:   () => {
    tone({ type: 'square', freq: 277, duration: 0.10, gain: 0.10 });
    tone({ type: 'square', freq: 220, freqEnd: 110, duration: 0.30, gain: 0.10, delay: 0.08 });
  },
  meteor:  () => noise({ duration: 0.45, gain: 0.04, cutoffStart: 3000, cutoffEnd: 600 }),
  threat:  () => {
    tone({ type: 'square', freq: 110, freqEnd: 55, duration: 0.50, gain: 0.10 });
    noise({ duration: 0.40, gain: 0.05, cutoffStart: 800, cutoffEnd: 200, delay: 0.05 });
  },
  wonder:  () => {
    tone({ type: 'triangle', freq: 880,  duration: 0.10, gain: 0.06 });
    tone({ type: 'triangle', freq: 1320, duration: 0.10, gain: 0.06, delay: 0.08 });
    tone({ type: 'triangle', freq: 1760, duration: 0.12, gain: 0.06, delay: 0.16 });
  },
  death:   () => {
    tone({ type: 'square', freq: 220, freqEnd: 55, duration: 0.9, gain: 0.12 });
  },
  warn:    () => tone({ type: 'square', freq: 220, duration: 0.06, gain: 0.05 }),
};
