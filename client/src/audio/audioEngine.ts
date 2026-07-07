/**
 * Procedurally-generated audio via the Web Audio API — no external sound
 * files. The background track is a looping noir-jazz walking bassline in D
 * minor (Dm7 → Bbmaj7 → Gm7 → A7) with syncopated dissonant "stab" chords and
 * brushed-hi-hat noise ticks for tension, scheduled with a standard lookahead
 * scheduler so timing stays tight regardless of setInterval jitter.
 */

const BPM = 92;
const SWING_RATIO = 0.66;
const SCHEDULE_AHEAD_SEC = 0.2;
const SCHEDULER_INTERVAL_MS = 50;

// D3 F3 A3 C4 (Dm7) → Bb2 D3 F3 A3 (Bbmaj7) → G2 Bb2 D3 F3 (Gm7) → A2 C#3 E3 G3 (A7, tension before resolving to i)
const BASS_PATTERN_HZ = [
  146.83, 174.61, 220.0, 261.63,
  116.54, 146.83, 174.61, 220.0,
  98.0, 116.54, 146.83, 174.61,
  110.0, 138.59, 164.81, 196.0,
];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private schedulerTimer: number | null = null;
  private nextNoteTime = 0;
  private step = 0;
  private musicPlaying = false;
  private gunshotCount = 0;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const ctx = new AudioContext();
      const musicGain = ctx.createGain();
      musicGain.gain.value = 0.18;
      musicGain.connect(ctx.destination);
      this.ctx = ctx;
      this.musicGain = musicGain;
      this.noiseBuffer = this.createNoiseBuffer(ctx);
    }
    return this.ctx;
  }

  async resume(): Promise<void> {
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") await ctx.resume();
  }

  startMusic(): void {
    if (this.musicPlaying) return;
    const ctx = this.ensureContext();
    this.musicPlaying = true;
    this.step = 0;
    this.nextNoteTime = ctx.currentTime + 0.1;
    this.schedulerTimer = window.setInterval(() => this.scheduleTick(), SCHEDULER_INTERVAL_MS);
    this.scheduleTick();
  }

  stopMusic(): void {
    this.musicPlaying = false;
    if (this.schedulerTimer !== null) {
      window.clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  isMusicPlaying(): boolean {
    return this.musicPlaying;
  }

  /** Diagnostic only (e.g. surfaced via a debug global for E2E tests) — not used by app logic. */
  getDebugState(): { contextState: AudioContextState | "none"; musicPlaying: boolean; gunshotCount: number } {
    return {
      contextState: this.ctx?.state ?? "none",
      musicPlaying: this.musicPlaying,
      gunshotCount: this.gunshotCount,
    };
  }

  playGunshot(): void {
    this.gunshotCount++;
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    if (this.noiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1800;
      filter.Q.value = 4;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(now);
      src.stop(now + 0.3);
    }

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private scheduleTick(): void {
    if (!this.musicPlaying || !this.ctx) return;
    const ctx = this.ctx;
    const beatSec = 60 / BPM;

    while (this.nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_SEC) {
      const idx = this.step % BASS_PATTERN_HZ.length;
      const freq = BASS_PATTERN_HZ[idx];
      this.playBassNote(freq, this.nextNoteTime, beatSec * 0.9);

      if (idx % 4 === 2) {
        this.playStab(this.nextNoteTime + beatSec * 0.5, freq * 2);
      }
      this.playHat(this.nextNoteTime + beatSec * SWING_RATIO);

      this.step++;
      this.nextNoteTime += beatSec;
    }
  }

  private playBassNote(freq: number, time: number, duration: number): void {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.14, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  /** Dissonant minor-third + tritone-ish stab for tension, staccato. */
  private playStab(time: number, baseFreq: number): void {
    if (!this.ctx || !this.musicGain) return;
    const ctx = this.ctx;
    const musicGain = this.musicGain;
    const intervals = [1, 1.1892, 1.4983];
    for (const mult of intervals) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = baseFreq * mult;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.05, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);
      osc.connect(gain);
      gain.connect(musicGain);
      osc.start(time);
      osc.stop(time + 0.3);
    }
  }

  /** Brushed-hi-hat-ish filtered noise tick on the swung upbeat. */
  private playHat(time: number): void {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 6000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.04, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    src.start(time);
    src.stop(time + 0.05);
  }
}

export const audioEngine = new AudioEngine();

declare global {
  interface Window {
    /** Diagnostic-only hook for E2E tests to inspect real audio engine state; unused by app logic. */
    __wolfAudioDebug?: () => { contextState: AudioContextState | "none"; musicPlaying: boolean; gunshotCount: number };
  }
}
window.__wolfAudioDebug = () => audioEngine.getDebugState();
