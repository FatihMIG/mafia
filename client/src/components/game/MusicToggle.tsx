import { useEffect, useState } from "react";
import { audioEngine } from "../../audio/audioEngine";

export function MusicToggle() {
  const [enabled, setEnabled] = useState(true);

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

  return (
    <button
      onClick={toggle}
      className="rounded-md border border-mafia-panel2 px-3 py-1 text-xs text-mafia-muted hover:border-mafia-accent"
    >
      {enabled ? "🎵 Music On" : "🔇 Music Off"}
    </button>
  );
}
