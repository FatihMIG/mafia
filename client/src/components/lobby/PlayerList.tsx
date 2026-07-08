import type { PlayerPublic } from "@wolf/shared";
import { useGame } from "../../state/GameContext";

interface Props {
  players: PlayerPublic[];
  onKick?: (playerId: string) => void;
  canKick?: boolean;
}

export function PlayerList({ players, onKick, canKick }: Props) {
  const { state } = useGame();

  return (
    <ul className="space-y-2">
      {players.map((player) => (
        <li
          key={player.id}
          className="flex items-center justify-between rounded-md bg-mafia-panel2 px-4 py-2"
        >
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${player.isConnected ? "bg-green-500" : "bg-mafia-muted"}`} />
            <span className={player.id === state.playerId ? "font-semibold text-mafia-primary" : ""}>
              {player.nickname}
            </span>
            {player.isHost && (
              <span className="rounded bg-mafia-primary px-1.5 py-0.5 text-xs font-bold text-white">HOST</span>
            )}
            {player.isBot && (
              <span className="rounded bg-mafia-text px-1.5 py-0.5 text-xs font-bold text-white">BOT</span>
            )}
            {!player.isAlive && <span className="text-xs text-mafia-muted">(eliminated)</span>}
          </div>
          {canKick && player.id !== state.playerId && (
            <button
              onClick={() => onKick?.(player.id)}
              className="text-xs text-mafia-muted hover:text-red-400"
            >
              👋 Kick
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
