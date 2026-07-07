import { useEffect, useState } from "react";
import { audioEngine } from "../../audio/audioEngine";

export function MusicToggle() {
  const [enabled, setEnabled] = useState(true);
  const [trackName, setTrackName] = useState(audioEngine.getCurrentTrackName());

  // Start once per GamePage mount; the user has already interacted with the
  // page by this point (clicked Create/Join/Start earlier), which is enough
  // to satisfy autoplay policy for resuming the shared AudioContext.
  useEffect(() => {
    audioEngine.resume().then(() => {
      if (enabled) audioEngine.startMusic();
    });
    return () => {
      audioEngine.stopMusic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle() {
    setEnabled((prev) => {
      const next = !prev;
      if (next) audioEngine.resume().then(() => audioEngine.startMusic());
      else audioEngine.stopMusic();
      return next;
    });
  }

  function shuffle() {
    setTrackName(audioEngine.shuffleTrack());
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={toggle}
        className="leather-surface rounded-md bg-mafia-panel2 px-3 py-1 text-xs text-mafia-text hover:brightness-110"
      >
        {enabled ? `🎵 ${trackName}` : "🔇 Music Off"}
      </button>
      {enabled && (
        <button
          onClick={shuffle}
          title="Shuffle track"
          aria-label="Shuffle track"
          className="leather-surface rounded-md bg-mafia-panel2 px-2 py-1 text-xs text-mafia-text hover:brightness-110"
        >
          🔀
        </button>
      )}
    </div>
  );
}
