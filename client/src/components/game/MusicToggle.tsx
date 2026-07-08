import { useEffect, useState } from "react";
import { musicPlayer } from "../../audio/musicPlayer";

export function MusicToggle() {
  const [enabled, setEnabled] = useState(true);
  const [trackName, setTrackName] = useState(musicPlayer.getCurrentTrackName());

  // Auto-attempt on mount (works once the user has interacted with the page
  // at all this session — clicking this button itself always works too).
  useEffect(() => {
    if (enabled) musicPlayer.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle() {
    setEnabled((prev) => {
      const next = !prev;
      if (next) musicPlayer.play();
      else musicPlayer.pause();
      return next;
    });
  }

  async function shuffle() {
    setTrackName(await musicPlayer.shuffleTrack());
  }

  if (!musicPlayer.hasTracks()) return null;

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={toggle}
        className="nes-btn text-xs"
      >
        {enabled ? `🎵 ${trackName}` : "🔇 Music Off"}
      </button>
      {enabled && (
        <button
          onClick={shuffle}
          title="Shuffle track"
          aria-label="Shuffle track"
          className="nes-btn text-xs"
        >
          🔀
        </button>
      )}
    </div>
  );
}
