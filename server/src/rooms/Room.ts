import {
  DEFAULT_ROOM_SETTINGS,
  GamePhase,
  type RoomSettings,
  type RoomSummary,
  type PlayerPublic,
  type GameState,
} from "@wolf/shared";
import { Player } from "./Player.js";
import { GameEngine } from "../game/GameEngine.js";

export class Room {
  readonly code: string;
  settings: RoomSettings;
  players = new Map<string, Player>();
  hostPlayerId: string;
  gameEngine: GameEngine | null = null;
  createdAt = Date.now();
  lastActivityAt = Date.now();
  emptyAt: number | null = null;

  constructor(code: string, hostPlayer: Player, settings?: Partial<RoomSettings>) {
    this.code = code;
    this.settings = { ...DEFAULT_ROOM_SETTINGS, ...settings };
    this.hostPlayerId = hostPlayer.id;
    this.players.set(hostPlayer.id, hostPlayer);
  }

  touch(): void {
    this.lastActivityAt = Date.now();
  }

  addPlayer(player: Player): void {
    this.players.set(player.id, player);
    this.emptyAt = null;
    this.touch();
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);
    if (this.hostPlayerId === playerId) {
      const nextHuman = [...this.players.values()].find((p) => !p.isBot);
      if (nextHuman) this.reassignHost(nextHuman.id);
    }
    if (this.players.size === 0 || ![...this.players.values()].some((p) => !p.isBot)) {
      // Empty, or only bots remain — nothing/no one left that can host, so treat it as empty
      // rather than waiting on the multi-hour stale-room fallback to reap it.
      this.emptyAt = Date.now();
    }
    this.touch();
  }

  reassignHost(playerId: string): void {
    const prevHost = this.players.get(this.hostPlayerId);
    if (prevHost) prevHost.isHost = false;
    const nextHost = this.players.get(playerId);
    if (nextHost) nextHost.isHost = true;
    this.hostPlayerId = playerId;
  }

  getPlayerBySessionToken(sessionToken: string): Player | undefined {
    return [...this.players.values()].find((p) => p.sessionToken === sessionToken);
  }

  getPublicPlayers(): PlayerPublic[] {
    return [...this.players.values()].map((p) => p.toPublic());
  }

  isInLobby(): boolean {
    return this.gameEngine === null || this.gameEngine.phase === GamePhase.LOBBY;
  }

  getGameState(): GameState {
    if (this.gameEngine) return this.gameEngine.getState();
    return {
      phase: GamePhase.LOBBY,
      round: 0,
      phaseEndsAt: null,
      players: this.getPublicPlayers(),
      deadPlayerIds: [],
      lastNightResult: null,
      lastVoteResult: null,
      chatLog: [],
      winner: null,
    };
  }

  isFull(): boolean {
    return this.players.size >= this.settings.maxPlayers;
  }

  toSummary(): RoomSummary {
    const host = this.players.get(this.hostPlayerId);
    return {
      code: this.code,
      hostNickname: host?.nickname ?? "?",
      playerCount: this.players.size,
      maxPlayers: this.settings.maxPlayers,
      phase: this.isInLobby() ? "LOBBY" : "IN_PROGRESS",
    };
  }
}
