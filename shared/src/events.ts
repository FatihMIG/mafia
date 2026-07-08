import type { Role, Alignment } from "./roles.js";
import type { PlayerPublic, PlayerRevealed, RoomSettings, RoomSummary } from "./room.js";
import type { GamePhase, GameState, ChatMessage, VoteUpdate, VoteResult, Winner } from "./game.js";

export interface AckError {
  ok: false;
  error: string;
}

export interface CreateRoomPayload {
  nickname: string;
  isPublic: boolean;
  settings?: Partial<RoomSettings>;
}

export interface CreateRoomAck {
  ok: true;
  roomCode: string;
  sessionToken: string;
  playerId: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  nickname: string;
}

export interface JoinRoomAck {
  ok: true;
  sessionToken: string;
  playerId: string;
}

export interface RejoinRoomPayload {
  roomCode: string;
  sessionToken: string;
}

export interface RejoinRoomAck {
  ok: true;
  playerId: string;
  settings: RoomSettings;
  hostPlayerId: string;
  gameState: GameState;
  myRole: Role | null;
  investigationResults: InvestigationResultPayload[];
}

export interface KickPlayerPayload {
  targetPlayerId: string;
}

export interface UpdateSettingsPayload {
  settings: Partial<RoomSettings>;
}

export interface SubmitNightActionPayload {
  targetPlayerId: string;
}

export interface CastVotePayload {
  targetPlayerId: string | null;
}

export interface SendChatMessagePayload {
  text: string;
}

export interface RoomUpdatePayload {
  players: PlayerPublic[];
  settings: RoomSettings;
  hostPlayerId: string;
}

export interface PhaseChangedPayload {
  phase: GamePhase;
  phaseEndsAt: number | null;
  round: number;
}

export interface RoleAssignedPayload {
  role: Role;
}

export interface NightResultPayload {
  killedPlayerId: string | null;
}

export interface InvestigationResultPayload {
  targetPlayerId: string;
  alignment: Alignment;
}

export interface GameOverPayload {
  winner: Winner;
  players: PlayerRevealed[];
}

export interface PlayerConnectionPayload {
  playerId: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
}

export interface ClientToServerEvents {
  create_room: (payload: CreateRoomPayload, ack: (res: CreateRoomAck | AckError) => void) => void;
  join_room: (payload: JoinRoomPayload, ack: (res: JoinRoomAck | AckError) => void) => void;
  rejoin_room: (payload: RejoinRoomPayload, ack: (res: RejoinRoomAck | AckError) => void) => void;
  leave_room: () => void;
  kick_player: (payload: KickPlayerPayload) => void;
  update_settings: (payload: UpdateSettingsPayload) => void;
  start_game: () => void;
  submit_night_action: (payload: SubmitNightActionPayload) => void;
  cast_vote: (payload: CastVotePayload) => void;
  send_chat_message: (payload: SendChatMessagePayload) => void;
  list_public_rooms: (ack: (res: RoomSummary[]) => void) => void;
  add_bot: () => void;
  terminate_room: () => void;
  play_again: () => void;
}

export interface ServerToClientEvents {
  room_update: (payload: RoomUpdatePayload) => void;
  game_started: () => void;
  role_assigned: (payload: RoleAssignedPayload) => void;
  phase_changed: (payload: PhaseChangedPayload) => void;
  night_result: (payload: NightResultPayload) => void;
  investigation_result: (payload: InvestigationResultPayload) => void;
  chat_message: (payload: ChatMessage) => void;
  vote_update: (payload: VoteUpdate) => void;
  vote_result: (payload: VoteResult) => void;
  game_over: (payload: GameOverPayload) => void;
  player_disconnected: (payload: PlayerConnectionPayload) => void;
  player_reconnected: (payload: PlayerConnectionPayload) => void;
  error: (payload: ErrorPayload) => void;
  room_terminated: () => void;
}
