import { useEffect, useState, type ChangeEvent } from "react";
import { musicPlayer } from "../../audio/musicPlayer";
import { Icon } from "../ui/Icon";

export function MusicToggle() {
  const [enabled, setEnabled] = useState(true);
  const [trackName, setTrackName] = useState(musicPlayer.getCurrentTrackName());
  const [volume, setVolume] = useState(musicPlayer.getVolume());

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

  function handleVolumeChange(e: ChangeEvent<HTMLInputElement>) {
    const next = Number(e.target.value);
    setVolume(next);
    musicPlayer.setVolume(next);
  }

  if (!musicPlayer.hasTracks()) return null;

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={toggle} className="nes-btn text-xs">
        <Icon name={enabled ? "music" : "sound-mute"} /> {enabled ? trackName : "Music Off"}
      </button>
      {enabled && (
        <>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 accent-mafia-primary"
            aria-label="Music volume"
            title="Music volume"
          />
          <button
            onClick={shuffle}
            title="Shuffle track"
            aria-label="Shuffle track"
            className="nes-btn text-xs"
          >
            <Icon name="shuffle" />
          </button>
        </>
      )}
    </div>
  );
}
