import type {
  RoomSettings,
  PlayerPublic,
  PlayerRevealed,
  GameState,
  Role,
  ChatMessage,
  VoteUpdate,
  VoteResult,
  NightResultPayload,
  InvestigationResultPayload,
  GameOverPayload,
  PhaseChangedPayload,
} from "@wolf/shared";

export interface AppState {
  nickname: string;
  roomCode: string | null;
  playerId: string | null;
  sessionToken: string | null;
  hostPlayerId: string | null;
  settings: RoomSettings | null;
  players: PlayerPublic[];
  game: GameState | null;
  myRole: Role | null;
  investigationResults: InvestigationResultPayload[];
  voteTally: VoteUpdate | null;
  revealedPlayers: PlayerRevealed[] | null;
  lastError: string | null;
  bootstrapped: boolean;
}

export const initialAppState: AppState = {
  nickname: "",
  roomCode: null,
  playerId: null,
  sessionToken: null,
  hostPlayerId: null,
  settings: null,
  players: [],
  game: null,
  myRole: null,
  investigationResults: [],
  voteTally: null,
  revealedPlayers: null,
  lastError: null,
  bootstrapped: false,
};

export type AppAction =
  | { type: "SET_NICKNAME"; nickname: string }
  | {
      type: "ROOM_JOINED";
      roomCode: string;
      playerId: string;
      sessionToken: string;
      hostPlayerId?: string;
      settings?: RoomSettings;
      game?: GameState;
      myRole?: Role | null;
      investigationResults?: InvestigationResultPayload[];
    }
  | { type: "ROOM_UPDATE"; players: PlayerPublic[]; settings: RoomSettings; hostPlayerId: string }
  | { type: "GAME_STARTED" }
  | { type: "ROLE_ASSIGNED"; role: Role }
  | { type: "PHASE_CHANGED"; payload: PhaseChangedPayload }
  | { type: "NIGHT_RESULT"; payload: NightResultPayload }
  | { type: "INVESTIGATION_RESULT"; payload: InvestigationResultPayload }
  | { type: "CHAT_MESSAGE"; message: ChatMessage }
  | { type: "VOTE_UPDATE"; payload: VoteUpdate }
  | { type: "VOTE_RESULT"; payload: VoteResult }
  | { type: "GAME_OVER"; payload: GameOverPayload }
  | { type: "PLAYER_CONNECTION"; playerId: string; isConnected: boolean }
  | { type: "ERROR"; message: string }
  | { type: "CLEAR_ERROR" }
  | { type: "LEFT_ROOM" }
  | { type: "BOOTSTRAPPED" };

export function gameReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_NICKNAME":
      return { ...state, nickname: action.nickname };

    case "ROOM_JOINED":
      return {
        ...state,
        roomCode: action.roomCode,
        playerId: action.playerId,
        sessionToken: action.sessionToken,
        hostPlayerId: action.hostPlayerId ?? state.hostPlayerId,
        settings: action.settings ?? state.settings,
        game: action.game ?? state.game,
        players: action.game?.players ?? state.players,
        myRole: action.myRole !== undefined ? action.myRole : state.myRole,
        investigationResults: action.investigationResults ?? state.investigationResults,
      };

    case "ROOM_UPDATE":
      return {
        ...state,
        players: action.players,
        settings: action.settings,
        hostPlayerId: action.hostPlayerId,
        game: state.game ? { ...state.game, players: action.players } : state.game,
      };

    case "GAME_STARTED":
      return state;

    case "ROLE_ASSIGNED":
      return { ...state, myRole: action.role };

    case "PHASE_CHANGED": {
      const base: GameState =
        state.game ??
        ({
          phase: action.payload.phase,
          round: action.payload.round,
          phaseEndsAt: action.payload.phaseEndsAt,
          players: state.players,
          deadPlayerIds: [],
          lastNightResult: null,
          lastVoteResult: null,
          chatLog: [],
          winner: null,
        } satisfies GameState);
      return {
        ...state,
        game: {
          ...base,
          phase: action.payload.phase,
          phaseEndsAt: action.payload.phaseEndsAt,
          round: action.payload.round,
          chatLog: action.payload.phase === "DAY" ? [] : base.chatLog,
        },
        voteTally: action.payload.phase === "VOTING" ? state.voteTally : null,
      };
    }

    case "NIGHT_RESULT":
      if (!state.game) return state;
      return { ...state, game: { ...state.game, lastNightResult: action.payload } };

    case "INVESTIGATION_RESULT":
      return { ...state, investigationResults: [...state.investigationResults, action.payload] };

    case "CHAT_MESSAGE":
      if (!state.game) return state;
      return { ...state, game: { ...state.game, chatLog: [...state.game.chatLog, action.message] } };

    case "VOTE_UPDATE":
      return { ...state, voteTally: action.payload };

    case "VOTE_RESULT":
      if (!state.game) return state;
      return { ...state, game: { ...state.game, lastVoteResult: action.payload }, voteTally: null };

    case "GAME_OVER":
      if (!state.game) return state;
      return {
        ...state,
        game: { ...state.game, phase: "GAME_OVER", winner: action.payload.winner, players: action.payload.players },
        players: action.payload.players,
        revealedPlayers: action.payload.players,
      };

    case "PLAYER_CONNECTION":
      return {
        ...state,
        players: state.players.map((p) => (p.id === action.playerId ? { ...p, isConnected: action.isConnected } : p)),
      };

    case "ERROR":
      return { ...state, lastError: action.message };

    case "CLEAR_ERROR":
      return { ...state, lastError: null };

    case "LEFT_ROOM":
      return { ...initialAppState, nickname: state.nickname, bootstrapped: true };

    case "BOOTSTRAPPED":
      return { ...state, bootstrapped: true };

    default:
      return state;
  }
}
