import { useCallback, useRef } from 'react';

type SoundName = 'correct' | 'wrong' | 'flip' | 'levelup' | 'achievement' | 'mission' | 'complete' | 'click';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playNote(ctx: AudioContext, freq: number, startTime: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

const SOUNDS: Record<SoundName, (ctx: AudioContext) => void> = {
  correct: (ctx) => {
    playNote(ctx, 523.25, ctx.currentTime, 0.15, 'sine', 0.12);
    playNote(ctx, 659.25, ctx.currentTime + 0.1, 0.15, 'sine', 0.12);
    playNote(ctx, 783.99, ctx.currentTime + 0.2, 0.25, 'sine', 0.12);
  },

  wrong: (ctx) => {
    playNote(ctx, 311.13, ctx.currentTime, 0.2, 'square', 0.08);
    playNote(ctx, 233.08, ctx.currentTime + 0.15, 0.3, 'square', 0.08);
  },

  flip: (ctx) => {
    const t = ctx.currentTime;
    playNote(ctx, 400, t, 0.08, 'sine', 0.06);
    playNote(ctx, 600, t + 0.04, 0.08, 'sine', 0.06);
  },

  levelup: (ctx) => {
    const t = ctx.currentTime;
    const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
    notes.forEach((f, i) => {
      playNote(ctx, f, t + i * 0.12, 0.2, 'sine', 0.1);
    });
    // Chord at the end
    playNote(ctx, 523.25, t + 0.72, 0.5, 'sine', 0.08);
    playNote(ctx, 659.25, t + 0.72, 0.5, 'sine', 0.08);
    playNote(ctx, 783.99, t + 0.72, 0.5, 'sine', 0.08);
  },

  achievement: (ctx) => {
    const t = ctx.currentTime;
    playNote(ctx, 880, t, 0.12, 'sine', 0.1);
    playNote(ctx, 1108.73, t + 0.08, 0.12, 'sine', 0.1);
    playNote(ctx, 1318.51, t + 0.16, 0.25, 'sine', 0.1);
    // Sparkle
    playNote(ctx, 1760, t + 0.2, 0.08, 'sine', 0.06);
    playNote(ctx, 2637.02, t + 0.24, 0.08, 'sine', 0.06);
  },

  mission: (ctx) => {
    const t = ctx.currentTime;
    playNote(ctx, 587.33, t, 0.15, 'triangle', 0.12);
    playNote(ctx, 739.99, t + 0.12, 0.15, 'triangle', 0.12);
    playNote(ctx, 880, t + 0.24, 0.15, 'triangle', 0.12);
    playNote(ctx, 1046.5, t + 0.36, 0.3, 'triangle', 0.12);
  },

  complete: (ctx) => {
    const t = ctx.currentTime;
    const notes = [392, 440, 493.88, 523.25, 587.33, 659.25];
    notes.forEach((f, i) => {
      playNote(ctx, f, t + i * 0.1, 0.18, 'sine', 0.1);
    });
  },

  click: (ctx) => {
    playNote(ctx, 800, ctx.currentTime, 0.04, 'sine', 0.04);
  },
};

export function useSound(enabled: boolean) {
  const lastPlayedRef = useRef<Record<string, number>>({});

  const playSound = useCallback((name: SoundName) => {
    if (!enabled) return;
    const now = Date.now();
    const last = lastPlayedRef.current[name] || 0;
    if (now - last < 80) return;
    lastPlayedRef.current[name] = now;

    try {
      const ctx = getAudioContext();
      SOUNDS[name](ctx);
    } catch {
      // Audio not available
    }
  }, [enabled]);

  return { playSound };
}

export type { SoundName };
