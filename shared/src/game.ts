import type { Alignment } from "./roles.js";
import type { PlayerPublic } from "./room.js";

export const GamePhase = {
  LOBBY: "LOBBY",
  ROLE_REVEAL: "ROLE_REVEAL",
  NIGHT: "NIGHT",
  DAY: "DAY",
  VOTING: "VOTING",
  GAME_OVER: "GAME_OVER",
} as const;

export type GamePhase = (typeof GamePhase)[keyof typeof GamePhase];

export const Winner = {
  TOWN: "TOWN",
  MAFIA: "MAFIA",
} as const;

export type Winner = (typeof Winner)[keyof typeof Winner];

export interface ChatMessage {
  id: string;
  playerId: string;
  nickname: string;
  text: string;
  timestamp: number;
}

export interface NightResult {
  killedPlayerId: string | null;
}

export interface InvestigationResult {
  targetPlayerId: string;
  alignment: Alignment;
}

export interface VoteResult {
  eliminatedPlayerId: string | null;
  tally: Record<string, number>;
  tied: boolean;
}

export interface VoteUpdate {
  tally: Record<string, number>;
  votedPlayerIds: string[];
}

export interface GameState {
  phase: GamePhase;
  round: number;
  phaseEndsAt: number | null;
  players: PlayerPublic[];
  deadPlayerIds: string[];
  lastNightResult: NightResult | null;
  lastVoteResult: VoteResult | null;
  chatLog: ChatMessage[];
  winner: Winner | null;
}
