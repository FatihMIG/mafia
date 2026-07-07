import { useEffect, useRef } from "react";
import { useGame } from "../../state/GameContext";
import { useVoiceChat } from "../../voice/useVoiceChat";

function RemoteAudio({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);

  return <audio ref={ref} autoPlay playsInline />;
}

function peerStatusLabel(connectionState: RTCPeerConnectionState | undefined): { text: string; className: string } {
  switch (connectionState) {
    case "connected":
      return { text: "🟢 connected", className: "text-green-400" };
    case "new":
    case "connecting":
      return { text: "🟡 connecting…", className: "text-mafia-muted" };
    case "failed":
    case "disconnected":
    case "closed":
      return { text: "🔴 connection issue", className: "text-red-400" };
    default:
      return { text: "⚪ not connected", className: "text-mafia-muted" };
  }
}

export function VoiceChatBar() {
  const { state } = useGame();
  const {
    micPermission,
    micError,
    requestMic,
    isVoiceActivePhase,
    selfMuted,
    setSelfMuted,
    isTransmitting,
    remoteStreams,
    peerConnectionStates,
  } = useVoiceChat();

  const otherHumans = state.players.filter((p) => !p.isBot && p.id !== state.playerId);

  return (
    <div className="space-y-2 rounded-lg border border-mafia-panel2 bg-mafia-panel px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-mafia-muted">🎙️ Voice chat:</span>
          {micPermission === "granted" ? (
            <span className={isTransmitting ? "font-medium text-green-400" : "text-mafia-muted"}>
              {isTransmitting ? "Live" : isVoiceActivePhase ? "Muted" : "Silent (night)"}
            </span>
          ) : (
            <button onClick={requestMic} className="text-mafia-accent2 hover:underline">
              {micPermission === "requesting"
                ? "Requesting mic…"
                : micPermission === "denied"
                  ? `Mic blocked${micError ? ` (${micError})` : ""} — click to retry`
                  : "Enable microphone"}
            </button>
          )}
        </div>

        {micPermission === "granted" && (
          <button
            onClick={() => setSelfMuted((m) => !m)}
            className="leather-surface rounded-md bg-mafia-panel2 px-3 py-1 text-xs text-mafia-text hover:brightness-110"
          >
            {selfMuted ? "🔇 Unmute" : "🔊 Mute"}
          </button>
        )}
      </div>

      {otherHumans.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs">
          {otherHumans.map((p) => {
            const status = peerStatusLabel(peerConnectionStates[p.id]);
            return (
              <span key={p.id} className={status.className}>
                {p.nickname}: {status.text}
              </span>
            );
          })}
        </div>
      )}

      {Object.entries(remoteStreams).map(([peerId, stream]) => (
        <RemoteAudio key={peerId} stream={stream} />
      ))}
    </div>
  );
}
