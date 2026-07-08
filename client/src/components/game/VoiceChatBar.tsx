import { useEffect, useRef } from "react";
import { useGame } from "../../state/GameContext";
import { useVoiceChat } from "../../voice/useVoiceChat";
import { Icon } from "../ui/Icon";

function RemoteAudio({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);

  return <audio ref={ref} autoPlay playsInline />;
}

function peerStatusLabel(
  connectionState: RTCPeerConnectionState | undefined,
): { text: string; className: string; dotColor: string } {
  switch (connectionState) {
    case "connected":
      return { text: "connected", className: "text-green-400", dotColor: "bg-green-500" };
    case "new":
    case "connecting":
      return { text: "connecting…", className: "text-mafia-muted", dotColor: "bg-yellow-400" };
    case "failed":
    case "disconnected":
    case "closed":
      return { text: "connection issue", className: "text-red-400", dotColor: "bg-red-500" };
    default:
      return { text: "not connected", className: "text-mafia-muted", dotColor: "bg-mafia-muted" };
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
    lastIceError,
  } = useVoiceChat();

  const otherHumans = state.players.filter((p) => !p.isBot && p.id !== state.playerId);
  const anyUnhealthy = otherHumans.some((p) => peerConnectionStates[p.id] !== "connected");

  return (
    <div className="nes-container is-rounded space-y-2 bg-mafia-panel text-sm text-mafia-text">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-mafia-muted">
            <Icon name="user-headset" /> Voice chat:
          </span>
          {micPermission === "granted" ? (
            <span className={isTransmitting ? "font-medium text-green-400" : "text-mafia-muted"}>
              {isTransmitting ? "Live" : isVoiceActivePhase ? "Muted" : "Silent (night)"}
            </span>
          ) : (
            <button
              onClick={requestMic}
              disabled={micPermission === "requesting"}
              className={`nes-btn text-xs ${micPermission === "denied" ? "is-error" : "is-primary"} ${
                micPermission === "requesting" ? "is-disabled" : ""
              }`}
            >
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
            className="nes-btn text-xs"
          >
            <Icon name={selfMuted ? "sound-mute" : "sound-on"} /> {selfMuted ? "Unmute" : "Mute"}
          </button>
        )}
      </div>

      {otherHumans.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs">
          {otherHumans.map((p) => {
            const status = peerStatusLabel(peerConnectionStates[p.id]);
            return (
              <span key={p.id} className={`flex items-center gap-1.5 ${status.className}`}>
                <span className={`h-2 w-2 rounded-full ${status.dotColor}`} />
                {p.nickname}: {status.text}
              </span>
            );
          })}
        </div>
      )}

      {anyUnhealthy && lastIceError && (
        <p
          className="flex items-center gap-1.5 text-xs text-red-400"
          title="Diagnostic info — helps figure out why a connection isn't going through"
        >
          <Icon name="exclamation-triangle" /> network relay issue: {lastIceError}
        </p>
      )}

      {Object.entries(remoteStreams).map(([peerId, stream]) => (
        <RemoteAudio key={peerId} stream={stream} />
      ))}
    </div>
  );
}
