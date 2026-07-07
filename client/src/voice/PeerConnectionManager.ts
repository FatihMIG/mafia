import type { VoiceSignal } from "@wolf/shared";
import { socket } from "../socket/socket";

// STUN alone frequently fails to connect two peers across different real-world
// networks (symmetric NATs, mobile carrier NAT, restrictive firewalls) — it
// only helps peers discover their public address, it can't relay media when a
// direct path isn't possible. A TURN relay is the fallback for that case.
//
// The Open Relay Project's plain openrelayproject/openrelayproject demo
// credentials are deprecated — they now require either a signed-up API key,
// or (no signup needed) their documented "static auth" TURN REST API scheme:
// ephemeral username/credential pairs derived from a shared secret via
// HMAC-SHA1, the same mechanism Nextcloud/Matrix use against this service.
// Best-effort, no uptime SLA — if this ever needs to be rock-solid, swap in a
// paid/self-hosted TURN server instead.
const TURN_HOST = "staticauth.openrelay.metered.ca";
const TURN_SHARED_SECRET = "openrelayprojectsecret";
const TURN_CREDENTIAL_TTL_SEC = 3600;

// staticauth.openrelay.metered.ca only answers TURN allocate requests, not plain
// STUN binding requests — adding it as a `stun:` entry produces a "701 STUN host
// lookup received error" for that candidate (harmless — Google's STUN server
// still covers reflexive-candidate discovery — but noisy, so it's omitted).
const STATIC_ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

async function computeTurnCredential(): Promise<{ username: string; credential: string }> {
  const username = String(Math.floor(Date.now() / 1000) + TURN_CREDENTIAL_TTL_SEC);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(TURN_SHARED_SECRET),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(username));
  const credential = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return { username, credential };
}

async function buildIceServers(): Promise<RTCIceServer[]> {
  try {
    const { username, credential } = await computeTurnCredential();
    return [
      ...STATIC_ICE_SERVERS,
      { urls: `turn:${TURN_HOST}:80`, username, credential },
      { urls: `turn:${TURN_HOST}:80?transport=tcp`, username, credential },
      { urls: `turns:${TURN_HOST}:443?transport=tcp`, username, credential },
    ];
  } catch (err) {
    console.warn("[voice] TURN credential computation failed, falling back to STUN-only", err);
    return STATIC_ICE_SERVERS;
  }
}

const MAX_REBUILD_ATTEMPTS = 5;

interface PeerEntry {
  pc: RTCPeerConnection;
  isInitiator: boolean;
}

/**
 * Plain (non-React) WebRTC mesh manager: one RTCPeerConnection per human peer,
 * signaling relayed through the existing Socket.IO connection. Deterministic
 * lexicographic tie-break decides who initiates each pair's offer, so no
 * coordination is needed to avoid double-offer glare.
 */
export class PeerConnectionManager {
  private peers = new Map<string, PeerEntry>();
  private localStream: MediaStream | null = null;
  private rebuildAttempts = new Map<string, number>();
  private destroyed = false;
  private lastIceError: string | null = null;
  // Starts STUN-only; upgraded in place once the TURN credential HMAC resolves
  // (a same-thread crypto computation, no network round-trip — this reliably
  // completes well before any real peer connection gets created in practice,
  // so no caller needs to await it directly).
  private iceServers: RTCIceServer[] = STATIC_ICE_SERVERS;

  constructor(
    private myPlayerId: string,
    private onRemoteStream: (peerId: string, stream: MediaStream | null) => void,
  ) {
    buildIceServers().then((servers) => {
      this.iceServers = servers;
    });
  }

  setLocalStream(stream: MediaStream): void {
    this.localStream = stream;
    for (const { pc } of this.peers.values()) this.syncLocalTrack(pc);
  }

  setMicEnabled(enabled: boolean): void {
    this.localStream?.getAudioTracks().forEach((t) => (t.enabled = enabled));
  }

  /** Ensure exactly one connection per id in humanPeerIds (excluding self); close any no longer present. */
  syncPeers(humanPeerIds: string[]): void {
    if (this.destroyed) return;
    const wanted = new Set(humanPeerIds.filter((id) => id !== this.myPlayerId));

    for (const peerId of [...this.peers.keys()]) {
      if (!wanted.has(peerId)) this.closePeer(peerId);
    }
    for (const peerId of wanted) {
      if (!this.peers.has(peerId)) this.createPeer(peerId, this.myPlayerId < peerId);
    }
  }

  handleSignal(fromPlayerId: string, signal: VoiceSignal): void {
    if (this.destroyed) return;

    if (signal.type === "offer") {
      let entry = this.peers.get(fromPlayerId);
      if (!entry) {
        entry = this.createPeer(fromPlayerId, false);
      } else if (entry.isInitiator && entry.pc.signalingState === "have-local-offer") {
        // Polite-peer fallback: we thought we were the initiator but they also offered.
        // Yield — accept theirs instead of asserting a broken invariant.
        entry.isInitiator = false;
      }
      this.acceptOffer(fromPlayerId, entry, signal.sdp);
    } else if (signal.type === "answer") {
      this.peers.get(fromPlayerId)?.pc.setRemoteDescription({ type: "answer", sdp: signal.sdp }).catch(() => {});
    } else if (signal.type === "ice-candidate") {
      this.peers.get(fromPlayerId)?.pc.addIceCandidate(signal.candidate).catch(() => {});
    }
  }

  closePeer(peerId: string): void {
    const entry = this.peers.get(peerId);
    if (!entry) return;
    entry.pc.close();
    this.peers.delete(peerId);
    this.onRemoteStream(peerId, null);
  }

  /** Force a fresh connection to this peer (e.g. after connectionState hits failed/disconnected). */
  rebuildPeer(peerId: string): void {
    if (this.destroyed) return;
    const attempts = this.rebuildAttempts.get(peerId) ?? 0;
    if (attempts >= MAX_REBUILD_ATTEMPTS) return;
    this.rebuildAttempts.set(peerId, attempts + 1);

    this.closePeer(peerId);
    this.createPeer(peerId, this.myPlayerId < peerId);
  }

  /** Secondary nudge (e.g. on player_reconnected) — only rebuilds if the connection looks unhealthy. */
  checkAndRebuildIfUnhealthy(peerId: string): void {
    const entry = this.peers.get(peerId);
    if (!entry) {
      this.rebuildPeer(peerId);
      return;
    }
    const state = entry.pc.connectionState;
    if (state !== "connected" && state !== "connecting" && state !== "new") {
      this.rebuildPeer(peerId);
    }
  }

  /** Diagnostic only (e.g. surfaced via a debug global for E2E tests) — not used by app logic. */
  getConnectionStates(): Record<string, RTCPeerConnectionState> {
    return Object.fromEntries([...this.peers.entries()].map(([id, entry]) => [id, entry.pc.connectionState]));
  }

  /** Diagnostic only — most recent ICE candidate-gathering error across any peer, if any. */
  getLastIceError(): string | null {
    return this.lastIceError;
  }

  /** Diagnostic only — whether the local mic track is currently enabled (transmitting). */
  isLocalTrackEnabled(): boolean | null {
    return this.localStream?.getAudioTracks()[0]?.enabled ?? null;
  }

  destroy(): void {
    this.destroyed = true;
    for (const peerId of [...this.peers.keys()]) this.closePeer(peerId);
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
  }

  private createPeer(peerId: string, isInitiator: boolean): PeerEntry {
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    const entry: PeerEntry = { pc, isInitiator };
    this.peers.set(peerId, entry);

    // Always add an audio transceiver up front, even with no local track yet, so
    // the offer/answer always has a valid media line (a track-less offer can
    // otherwise sit at connectionState "new" forever with nothing to negotiate).
    // The real track is swapped in later via replaceTrack — no renegotiation needed.
    pc.addTransceiver("audio", { direction: "sendrecv" });
    this.syncLocalTrack(pc);

    pc.ontrack = (e) => this.onRemoteStream(peerId, e.streams[0] ?? null);
    pc.onicecandidateerror = (e) => {
      const err = e as RTCPeerConnectionIceErrorEvent;
      this.lastIceError = `${err.errorCode} ${err.errorText} (${err.url})`;
      console.warn(`[voice] ICE candidate error for ${peerId}:`, this.lastIceError);
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("voice_signal", {
          toPlayerId: peerId,
          signal: { type: "ice-candidate", candidate: e.candidate.toJSON() },
        });
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") this.rebuildAttempts.delete(peerId);
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") this.rebuildPeer(peerId);
    };

    if (isInitiator) this.makeOffer(peerId, entry);
    return entry;
  }

  private syncLocalTrack(pc: RTCPeerConnection): void {
    const track = this.localStream?.getAudioTracks()[0] ?? null;
    const sender = pc.getTransceivers()[0]?.sender;
    sender?.replaceTrack(track).catch(() => {});
  }

  private async makeOffer(peerId: string, entry: PeerEntry): Promise<void> {
    try {
      const offer = await entry.pc.createOffer();
      await entry.pc.setLocalDescription(offer);
      socket.emit("voice_signal", { toPlayerId: peerId, signal: { type: "offer", sdp: offer.sdp ?? "" } });
    } catch (err) {
      // A connectionstatechange-triggered rebuild will retry if this peer never comes up.
      console.warn("[voice] failed to create offer for", peerId, err);
    }
  }

  private async acceptOffer(peerId: string, entry: PeerEntry, sdp: string): Promise<void> {
    try {
      await entry.pc.setRemoteDescription({ type: "offer", sdp });
      const answer = await entry.pc.createAnswer();
      await entry.pc.setLocalDescription(answer);
      socket.emit("voice_signal", { toPlayerId: peerId, signal: { type: "answer", sdp: answer.sdp ?? "" } });
    } catch (err) {
      // ignore — a rebuild will retry
      console.warn("[voice] failed to accept offer from", peerId, err);
    }
  }
}
