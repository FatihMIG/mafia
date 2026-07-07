import type { Role } from "./roles.js";

export interface RoomSettings {
  isPublic: boolean;
  maxPlayers: number;
  nightDurationSec: number;
  dayDurationSec: number;
  votingDurationSec: number;
  mafiaCountOverride?: number;
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  isPublic: true,
  maxPlayers: 15,
  nightDurationSec: 45,
  dayDurationSec: 90,
  votingDurationSec: 45,
};

export interface PlayerPublic {
  id: string;
  nickname: string;
  isHost: boolean;
  isAlive: boolean;
  isConnected: boolean;
  isBot: boolean;
}

/** Public player info with role revealed — used for end-of-game reveals. Never carries sessionToken. */
export interface PlayerRevealed extends PlayerPublic {
  role: Role | null;
}

export type GamePhaseSummary = "LOBBY" | "IN_PROGRESS";

export interface RoomSummary {
  code: string;
  hostNickname: string;
  playerCount: number;
  maxPlayers: number;
  phase: GamePhaseSummary;
}
