/**
 * Background music: real mp3 files dropped in src/music/, discovered
 * automatically via Vite's import.meta.glob (so adding another track later
 * needs no code change) and played through a single shared <audio> element.
 */

const trackUrls = import.meta.glob("../music/*.mp3", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

interface Track {
  name: string;
  url: string;
}

function fileNameToTitle(path: string): string {
  const fileName = path.split("/").pop() ?? "Unknown Track";
  return fileName
    .replace(/\.mp3$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

const TRACKS: Track[] = Object.entries(trackUrls)
  .map(([path, url]) => ({ name: fileNameToTitle(path), url }))
  .sort((a, b) => a.name.localeCompare(b.name));

// Starts quiet by default — background music shouldn't compete with voice
// chat or announce itself the moment the page loads. Remembered across
// sessions so a volume the player picked once sticks.
const DEFAULT_VOLUME = 0.15;
const VOLUME_STORAGE_KEY = "wolf-music-volume";

function loadStoredVolume(): number {
  const raw = localStorage.getItem(VOLUME_STORAGE_KEY);
  const parsed = raw === null ? NaN : Number(raw);
  return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : DEFAULT_VOLUME;
}

class MusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private trackIndex = 0;
  private playing = false;
  private volume = loadStoredVolume();

  hasTracks(): boolean {
    return TRACKS.length > 0;
  }

  getCurrentTrackName(): string {
    return TRACKS[this.trackIndex]?.name ?? "No music available";
  }

  isPlaying(): boolean {
    return this.playing;
  }

  getVolume(): number {
    return this.volume;
  }

  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    if (this.audio) this.audio.volume = this.volume;
    localStorage.setItem(VOLUME_STORAGE_KEY, String(this.volume));
  }

  async play(): Promise<void> {
    if (!this.hasTracks()) return;
    const audio = this.ensureAudio();
    if (!audio.src) audio.src = TRACKS[this.trackIndex].url;
    try {
      await audio.play();
      this.playing = true;
    } catch {
      // Blocked by autoplay policy until the next user gesture — the UI's
      // toggle button click always satisfies that.
      this.playing = false;
    }
  }

  pause(): void {
    this.audio?.pause();
    this.playing = false;
  }

  /** Shuffle to a different track than the current one (a no-op if there's only one). */
  async shuffleTrack(): Promise<string> {
    if (TRACKS.length > 1) {
      let next = this.trackIndex;
      while (next === this.trackIndex) next = Math.floor(Math.random() * TRACKS.length);
      this.trackIndex = next;
    }
    const audio = this.ensureAudio();
    const wasPlaying = this.playing;
    audio.src = TRACKS[this.trackIndex].url;
    if (wasPlaying) await this.play();
    return this.getCurrentTrackName();
  }

  private ensureAudio(): HTMLAudioElement {
    if (!this.audio) {
      const audio = new Audio();
      audio.loop = true;
      audio.volume = this.volume;
      audio.preload = "auto";
      this.audio = audio;
    }
    return this.audio;
  }
}

export const musicPlayer = new MusicPlayer();

declare global {
  interface Window {
    /** Diagnostic-only hook for E2E tests; unused by app logic. */
    __wolfMusicDebug?: () => { trackName: string; playing: boolean; trackCount: number; volume: number };
  }
}
window.__wolfMusicDebug = () => ({
  trackName: musicPlayer.getCurrentTrackName(),
  playing: musicPlayer.isPlaying(),
  trackCount: TRACKS.length,
  volume: musicPlayer.getVolume(),
});
