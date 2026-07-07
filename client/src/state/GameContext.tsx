import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import { gameReducer, initialAppState, type AppState, type AppAction } from "./gameReducer";
import { getStoredNickname } from "./session";

interface GameContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => ({
    ...initialAppState,
    nickname: getStoredNickname(),
  }));

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameStateProvider");
  return ctx;
}

export function useIsHost(): boolean {
  const { state } = useGame();
  return !!state.playerId && state.playerId === state.hostPlayerId;
}

export function useMyPlayer() {
  const { state } = useGame();
  return state.players.find((p) => p.id === state.playerId) ?? null;
}
