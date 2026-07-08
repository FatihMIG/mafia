import { useGame } from "../../state/GameContext";
import { Icon } from "./Icon";

export function ErrorBanner() {
  const { state, dispatch } = useGame();
  if (!state.lastError) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center p-4">
      <div className="nes-container is-dark is-rounded flex items-center gap-3 border-mafia-accent px-4 py-2 font-pixel text-sm text-red-100 shadow-lg">
        <span>{state.lastError}</span>
        <button
          onClick={() => dispatch({ type: "CLEAR_ERROR" })}
          className="text-red-300 hover:text-white"
          aria-label="Dismiss"
        >
          <Icon name="times" />
        </button>
      </div>
    </div>
  );
}
