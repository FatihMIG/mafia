/**
 * Procedurally-generated gunshot SFX via the Web Audio API — no external
 * sound file needed for this one (a filtered noise burst + a low sine
 * "thump"). Background music is real mp3s, handled separately in musicPlayer.ts.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private gunshotCount = 0;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const ctx = new AudioContext();
      this.ctx = ctx;
      this.noiseBuffer = this.createNoiseBuffer(ctx);
    }
    return this.ctx;
  }

  async resume(): Promise<void> {
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") await ctx.resume();
  }

  /** Diagnostic only (e.g. surfaced via a debug global for E2E tests) — not used by app logic. */
  getDebugState(): { contextState: AudioContextState | "none"; gunshotCount: number } {
    return { contextState: this.ctx?.state ?? "none", gunshotCount: this.gunshotCount };
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
}

export const audioEngine = new AudioEngine();

declare global {
  interface Window {
    /** Diagnostic-only hook for E2E tests to inspect real audio engine state; unused by app logic. */
    __wolfAudioDebug?: () => { contextState: AudioContextState | "none"; gunshotCount: number };
  }
}
window.__wolfAudioDebug = () => audioEngine.getDebugState();
