/**
 * Procedurally-generated audio via the Web Audio API — no external sound
 * files. Each track is a looping noir-jazz walking bassline with syncopated
 * dissonant "stab" chords and brushed-hi-hat noise ticks for tension,
 * scheduled with a standard lookahead scheduler so timing stays tight
 * regardless of setInterval jitter.
 */

interface Track {
  name: string;
  bpm: number;
  swingRatio: number;
  /** Walking bassline in Hz, one full 4-chord progression (4 notes/chord). */
  bassPatternHz: number[];
  /** Multipliers above the stab's base frequency — voicing/dissonance character. */
  stabIntervals: number[];
}

const TRACKS: Track[] = [
  {
    // Dm7 → Bbmaj7 → Gm7 → A7
    name: "Smoky Room",
    bpm: 92,
    swingRatio: 0.66,
    bassPatternHz: [
      146.83, 174.61, 220.0, 261.63,
      116.54, 146.83, 174.61, 220.0,
      98.0, 116.54, 146.83, 174.61,
      110.0, 138.59, 164.81, 196.0,
    ],
    stabIntervals: [1, 1.1892, 1.4983],
  },
  {
    // Cm7 → Abmaj7 → Fm7 → G7, faster and more syncopated
    name: "Back Alley",
    bpm: 104,
    swingRatio: 0.62,
    bassPatternHz: [
      130.81, 155.56, 196.0, 233.08,
      103.83, 130.81, 155.56, 196.0,
      87.31, 103.83, 130.81, 155.56,
      98.0, 123.47, 146.83, 174.61,
    ],
    stabIntervals: [1, 1.2, 1.5],
  },
  {
    // Am7 → Fmaj7 → Dm7 → E7, slower and moodier
    name: "Velvet Shadow",
    bpm: 76,
    swingRatio: 0.68,
    bassPatternHz: [
      110.0, 130.81, 164.81, 196.0,
      87.31, 110.0, 130.81, 164.81,
      73.42, 87.31, 110.0, 130.81,
      82.41, 103.83, 123.47, 146.83,
    ],
    stabIntervals: [1, 1.5],
  },
  {
    // Em7 → Cmaj7 → Am7 → B7, tightest dissonance (minor 2nd in the stab)
    name: "Double Cross",
    bpm: 98,
    swingRatio: 0.64,
    bassPatternHz: [
      82.41, 98.0, 123.47, 146.83,
      65.41, 82.41, 98.0, 123.47,
      110.0, 130.81, 164.81, 196.0,
      123.47, 155.56, 185.0, 220.0,
    ],
    stabIntervals: [1, 1.0595, 1.4983],
  },
];

const SCHEDULE_AHEAD_SEC = 0.2;
const SCHEDULER_INTERVAL_MS = 50;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private schedulerTimer: number | null = null;
  private nextNoteTime = 0;
  private step = 0;
  private musicPlaying = false;
  private gunshotCount = 0;
  private trackIndex = 0;

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

  /** Shuffle to a different track than the current one (always changes, matching "shuffle through"). */
  shuffleTrack(): string {
    if (TRACKS.length > 1) {
      let next = this.trackIndex;
      while (next === this.trackIndex) next = Math.floor(Math.random() * TRACKS.length);
      this.trackIndex = next;
    }
    this.step = 0;
    return TRACKS[this.trackIndex].name;
  }

  getCurrentTrackName(): string {
    return TRACKS[this.trackIndex].name;
  }

  getTrackNames(): string[] {
    return TRACKS.map((t) => t.name);
  }

  /** Diagnostic only (e.g. surfaced via a debug global for E2E tests) — not used by app logic. */
  getDebugState(): {
    contextState: AudioContextState | "none";
    musicPlaying: boolean;
    gunshotCount: number;
    trackName: string;
  } {
    return {
      contextState: this.ctx?.state ?? "none",
      musicPlaying: this.musicPlaying,
      gunshotCount: this.gunshotCount,
      trackName: this.getCurrentTrackName(),
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
    const track = TRACKS[this.trackIndex];
    const beatSec = 60 / track.bpm;

    while (this.nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_SEC) {
      const idx = this.step % track.bassPatternHz.length;
      const freq = track.bassPatternHz[idx];
      this.playBassNote(freq, this.nextNoteTime, beatSec * 0.9);

      if (idx % 4 === 2) {
        this.playStab(this.nextNoteTime + beatSec * 0.5, freq * 2, track.stabIntervals);
      }
      this.playHat(this.nextNoteTime + beatSec * track.swingRatio);

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

  /** Dissonant stab chord for tension, staccato — voicing varies per track. */
  private playStab(time: number, baseFreq: number, intervals: number[]): void {
    if (!this.ctx || !this.musicGain) return;
    const ctx = this.ctx;
    const musicGain = this.musicGain;
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
    __wolfAudioDebug?: () => {
      contextState: AudioContextState | "none";
      musicPlaying: boolean;
      gunshotCount: number;
      trackName: string;
    };
  }
}
window.__wolfAudioDebug = () => audioEngine.getDebugState();
