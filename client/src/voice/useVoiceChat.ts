import { useCallback, useEffect, useRef, useState } from "react";
import { GamePhase, type VoiceSignalRelayPayload } from "@wolf/shared";
import { useGame } from "../state/GameContext";
import { socket } from "../socket/socket";
import { PeerConnectionManager } from "./PeerConnectionManager";

export type MicPermissionState = "idle" | "requesting" | "granted" | "denied";

declare global {
  interface Window {
    /** Diagnostic-only hooks for E2E tests to inspect real WebRTC state; unused by app logic. */
    __wolfVoiceStates?: () => Record<string, RTCPeerConnectionState>;
    __wolfVoiceLocalEnabled?: () => boolean | null;
    __wolfVoiceIceError?: () => string | null;
  }
}

export function useVoiceChat() {
  const { state } = useGame();
  const [micPermission, setMicPermission] = useState<MicPermissionState>("idle");
  const [micError, setMicError] = useState<string | null>(null);
  const [selfMuted, setSelfMuted] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [peerConnectionStates, setPeerConnectionStates] = useState<Record<string, RTCPeerConnectionState>>({});
  const [lastIceError, setLastIceError] = useState<string | null>(null);
  const managerRef = useRef<PeerConnectionManager | null>(null);
  const wasConnected = useRef<Record<string, boolean>>({});

  const myPlayerId = state.playerId;
  const phase = state.game?.phase;
  const myPlayer = state.players.find((p) => p.id === myPlayerId);
  const isVoiceActivePhase = phase === GamePhase.DAY || phase === GamePhase.VOTING;
  const shouldTransmit = isVoiceActivePhase && !!myPlayer?.isAlive && !selfMuted && micPermission === "granted";

  // One manager per room session.
  useEffect(() => {
    if (!myPlayerId) return;
    const manager = new PeerConnectionManager(myPlayerId, (peerId, stream) => {
      setRemoteStreams((prev) => {
        const next = { ...prev };
        if (stream) next[peerId] = stream;
        else delete next[peerId];
        return next;
      });
    });
    managerRef.current = manager;
    window.__wolfVoiceStates = () => manager.getConnectionStates();
    window.__wolfVoiceLocalEnabled = () => manager.isLocalTrackEnabled();
    window.__wolfVoiceIceError = () => manager.getLastIceError();
    return () => {
      manager.destroy();
      managerRef.current = null;
      window.__wolfVoiceStates = undefined;
      window.__wolfVoiceLocalEnabled = undefined;
      window.__wolfVoiceIceError = undefined;
    };
  }, [myPlayerId]);

  // Relay incoming signaling to the manager.
  useEffect(() => {
    const onSignal = (payload: VoiceSignalRelayPayload) => {
      managerRef.current?.handleSignal(payload.fromPlayerId, payload.signal);
    };
    socket.on("voice_signal", onSignal);
    return () => {
      socket.off("voice_signal", onSignal);
    };
  }, []);

  // Keep the mesh in sync with the current human roster.
  useEffect(() => {
    const humanIds = state.players.filter((p) => !p.isBot).map((p) => p.id);
    managerRef.current?.syncPeers(humanIds);
  }, [state.players]);

  // Secondary nudge: re-check (not unconditionally rebuild) a peer's connection when they reconnect.
  useEffect(() => {
    for (const p of state.players) {
      const previouslyConnected = wasConnected.current[p.id];
      if (previouslyConnected === false && p.isConnected && p.id !== myPlayerId && !p.isBot) {
        managerRef.current?.checkAndRebuildIfUnhealthy(p.id);
      }
      wasConnected.current[p.id] = p.isConnected;
    }
  }, [state.players, myPlayerId]);

  // The only phase-gating mechanism: toggle the local outgoing track, never renegotiate.
  useEffect(() => {
    managerRef.current?.setMicEnabled(shouldTransmit);
  }, [shouldTransmit]);

  // Poll real connection states so the UI can show something more useful than
  // a binary on/off when a peer is stuck negotiating or has failed to connect.
  useEffect(() => {
    const interval = setInterval(() => {
      setPeerConnectionStates(managerRef.current?.getConnectionStates() ?? {});
      setLastIceError(managerRef.current?.getLastIceError() ?? null);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const requestMic = useCallback(async () => {
    if (micPermission === "granted" || micPermission === "requesting") return;
    setMicPermission("requesting");
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getAudioTracks().forEach((t) => (t.enabled = false));
      managerRef.current?.setLocalStream(stream);
      setMicPermission("granted");
    } catch (err) {
      setMicError(err instanceof Error ? err.name : "Unknown error");
      setMicPermission("denied");
    }
  }, [micPermission]);

  return {
    micPermission,
    micError,
    requestMic,
    isVoiceActivePhase,
    selfMuted,
    setSelfMuted,
    isTransmitting: shouldTransmit,
    remoteStreams,
    peerConnectionStates,
    lastIceError,
  };
}
