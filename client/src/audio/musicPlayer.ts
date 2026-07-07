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

class MusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private trackIndex = 0;
  private playing = false;

  hasTracks(): boolean {
    return TRACKS.length > 0;
  }

  getCurrentTrackName(): string {
    return TRACKS[this.trackIndex]?.name ?? "No music available";
  }

  isPlaying(): boolean {
    return this.playing;
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
      audio.volume = 0.35;
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
    __wolfMusicDebug?: () => { trackName: string; playing: boolean; trackCount: number };
  }
}
window.__wolfMusicDebug = () => ({
  trackName: musicPlayer.getCurrentTrackName(),
  playing: musicPlayer.isPlaying(),
  trackCount: TRACKS.length,
});
