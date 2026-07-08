import Peer, { type MediaConnection } from "peerjs";
import { SERVER_URL } from "../socket/socket";

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

function peerServerOptions(): { host: string; port: number; secure: boolean; path: string } {
  const url = new URL(SERVER_URL);
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80,
    secure: url.protocol === "https:",
    path: "/peerjs",
  };
}

/**
 * A silent (no-op) audio track so an outgoing/incoming call always has a real
 * sender to negotiate against, even before the user has granted mic access —
 * mirrors the old addTransceiver-before-track trick. Once getUserMedia
 * resolves, the real track is swapped in via replaceTrack (see setLocalStream).
 */
function silentAudioTrack(): MediaStreamTrack {
  const ctx = new AudioContext();
  return ctx.createMediaStreamDestination().stream.getAudioTracks()[0];
}

const MAX_REBUILD_ATTEMPTS = 5;
const MAX_PEER_INIT_ATTEMPTS = 4;

interface PeerEntry {
  call: MediaConnection;
}

/**
 * Voice chat mesh built on PeerJS (self-hosted broker — see server/src/index.ts)
 * instead of hand-rolled WebRTC signaling. One MediaConnection per human peer.
 * Deterministic lexicographic tie-break decides who places the outgoing call
 * for each pair, so no coordination is needed to avoid double-call glare —
 * the other side just answers whatever call it receives.
 */
export class PeerConnectionManager {
  private peer: Peer | null = null;
  private readonly peerReady: Promise<void>;
  private peers = new Map<string, PeerEntry>();
  private expectedPeerIds = new Set<string>();
  private localStream: MediaStream;
  private rebuildAttempts = new Map<string, number>();
  private destroyed = false;
  private lastIceError: string | null = null;

  constructor(
    private myPlayerId: string,
    private onRemoteStream: (peerId: string, stream: MediaStream | null) => void,
  ) {
    this.localStream = new MediaStream([silentAudioTrack()]);
    this.peerReady = buildIceServers().then((iceServers) => this.initPeer(iceServers));
  }

  setLocalStream(stream: MediaStream): void {
    const track = stream.getAudioTracks()[0];
    if (!track) return;
    this.localStream = new MediaStream([track]);
    for (const { call } of this.peers.values()) {
      call.peerConnection?.getSenders()[0]?.replaceTrack(track).catch(() => {});
    }
  }

  setMicEnabled(enabled: boolean): void {
    this.localStream.getAudioTracks().forEach((t) => (t.enabled = enabled));
  }

  /** Ensure a call exists (or is expected) for every id in humanPeerIds (excluding self); close any no longer present. */
  syncPeers(humanPeerIds: string[]): void {
    if (this.destroyed) return;
    const wanted = new Set(humanPeerIds.filter((id) => id !== this.myPlayerId));
    this.expectedPeerIds = wanted;

    for (const peerId of [...this.peers.keys()]) {
      if (!wanted.has(peerId)) this.closePeer(peerId);
    }
    if (!this.peer) {
      this.peerReady.then(() => this.syncPeers(humanPeerIds));
      return;
    }
    // Only the lexicographically-smaller id places the outgoing call; the
    // other side just waits for it and answers via the "call" event.
    for (const peerId of wanted) {
      if (!this.peers.has(peerId) && this.myPlayerId < peerId) this.createOutgoingCall(peerId);
    }
  }

  closePeer(peerId: string): void {
    const entry = this.peers.get(peerId);
    if (!entry) return;
    entry.call.close();
    this.peers.delete(peerId);
    this.onRemoteStream(peerId, null);
  }

  /** Force a fresh call to this peer (e.g. after connectionState hits failed/disconnected). */
  rebuildPeer(peerId: string): void {
    if (this.destroyed) return;
    const attempts = this.rebuildAttempts.get(peerId) ?? 0;
    if (attempts >= MAX_REBUILD_ATTEMPTS) return;
    this.rebuildAttempts.set(peerId, attempts + 1);

    this.closePeer(peerId);
    // Only the initiating side re-places the call; the other side's own
    // connectionstatechange will fire the same way and it'll re-call us.
    if (this.myPlayerId < peerId) this.createOutgoingCall(peerId);
  }

  /** Secondary nudge (e.g. on player_reconnected) — only rebuilds if the connection looks unhealthy. */
  checkAndRebuildIfUnhealthy(peerId: string): void {
    const entry = this.peers.get(peerId);
    if (!entry) {
      if (this.myPlayerId < peerId) this.rebuildPeer(peerId);
      return;
    }
    const state = entry.call.peerConnection?.connectionState;
    if (state !== "connected" && state !== "connecting" && state !== "new") {
      this.rebuildPeer(peerId);
    }
  }

  /** Diagnostic only (e.g. surfaced via a debug global for E2E tests) — not used by app logic. */
  getConnectionStates(): Record<string, RTCPeerConnectionState> {
    const result: Record<string, RTCPeerConnectionState> = {};
    for (const id of this.expectedPeerIds) result[id] = "new";
    for (const [id, entry] of this.peers) result[id] = entry.call.peerConnection?.connectionState ?? "new";
    return result;
  }

  /** Diagnostic only — most recent ICE candidate-gathering error across any peer, if any. */
  getLastIceError(): string | null {
    return this.lastIceError;
  }

  /** Diagnostic only — whether the local mic track is currently enabled (transmitting). */
  isLocalTrackEnabled(): boolean | null {
    return this.localStream.getAudioTracks()[0]?.enabled ?? null;
  }

  destroy(): void {
    this.destroyed = true;
    for (const peerId of [...this.peers.keys()]) this.closePeer(peerId);
    this.localStream.getTracks().forEach((t) => t.stop());
    this.peer?.destroy();
    this.peer = null;
  }

  private async initPeer(iceServers: RTCIceServer[]): Promise<void> {
    for (let attempt = 0; attempt < MAX_PEER_INIT_ATTEMPTS && !this.destroyed; attempt++) {
      const peer = await this.tryCreatePeer(iceServers);
      if (peer) {
        this.peer = peer;
        this.wirePeer(peer);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  /** Resolves the connected Peer, or null if the id was taken (e.g. a stale registration from a just-reloaded tab hasn't expired yet — worth a retry) or another fatal error occurred. */
  private tryCreatePeer(iceServers: RTCIceServer[]): Promise<Peer | null> {
    return new Promise((resolve) => {
      const { host, port, secure, path } = peerServerOptions();
      const peer = new Peer(this.myPlayerId, { host, port, secure, path, config: { iceServers } });
      const onOpen = () => {
        cleanup();
        resolve(peer);
      };
      const onError = (err: { type?: string; message?: string }) => {
        cleanup();
        peer.destroy();
        if (err?.type !== "unavailable-id") console.warn("[voice] peerjs error", err);
        resolve(null);
      };
      function cleanup() {
        peer.off("open", onOpen);
        peer.off("error", onError);
      }
      peer.once("open", onOpen);
      peer.once("error", onError);
    });
  }

  private wirePeer(peer: Peer): void {
    peer.on("call", (call) => {
      call.answer(this.localStream);
      this.attachCall(call.peer, call);
    });
    // The broker (signaling) connection dropping doesn't mean media
    // connections died — just try to re-register with the same id.
    peer.on("disconnected", () => {
      if (!this.destroyed) peer.reconnect();
    });
    peer.on("error", (err) => console.warn("[voice] peerjs error", err));
  }

  private createOutgoingCall(peerId: string): void {
    if (!this.peer) return;
    const call = this.peer.call(peerId, this.localStream);
    this.attachCall(peerId, call);
  }

  private attachCall(peerId: string, call: MediaConnection): void {
    this.peers.set(peerId, { call });
    call.on("stream", (remoteStream) => this.onRemoteStream(peerId, remoteStream));
    call.on("close", () => {
      this.peers.delete(peerId);
      this.onRemoteStream(peerId, null);
    });
    call.on("error", (err) => console.warn(`[voice] call error for ${peerId}`, err));

    const pc = call.peerConnection;
    if (!pc) return;
    pc.onicecandidateerror = (e) => {
      const err = e as RTCPeerConnectionIceErrorEvent;
      this.lastIceError = `${err.errorCode} ${err.errorText} (${err.url})`;
      console.warn(`[voice] ICE candidate error for ${peerId}:`, this.lastIceError);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") this.rebuildAttempts.delete(peerId);
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") this.rebuildPeer(peerId);
    };
  }
}
