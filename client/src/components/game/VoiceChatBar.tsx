import { useEffect, useRef } from "react";
import { useVoiceChat } from "../../voice/useVoiceChat";

function RemoteAudio({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);

  return <audio ref={ref} autoPlay playsInline />;
}

export function VoiceChatBar() {
  const { micPermission, requestMic, isVoiceActivePhase, selfMuted, setSelfMuted, isTransmitting, remoteStreams } =
    useVoiceChat();

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-mafia-panel2 bg-mafia-panel px-4 py-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-mafia-muted">Voice chat:</span>
        {micPermission === "granted" ? (
          <span className={isTransmitting ? "font-medium text-green-400" : "text-mafia-muted"}>
            {isTransmitting ? "Live" : isVoiceActivePhase ? "Muted" : "Silent (night)"}
          </span>
        ) : (
          <button onClick={requestMic} className="text-mafia-accent2 hover:underline">
            {micPermission === "requesting"
              ? "Requesting mic…"
              : micPermission === "denied"
                ? "Mic blocked — click to retry"
                : "Enable microphone"}
          </button>
        )}
      </div>

      {micPermission === "granted" && (
        <button
          onClick={() => setSelfMuted((m) => !m)}
          className="rounded-md border border-mafia-panel2 px-3 py-1 text-xs hover:border-mafia-accent"
        >
          {selfMuted ? "Unmute" : "Mute"}
        </button>
      )}

      {Object.entries(remoteStreams).map(([peerId, stream]) => (
        <RemoteAudio key={peerId} stream={stream} />
      ))}
    </div>
  );
}
