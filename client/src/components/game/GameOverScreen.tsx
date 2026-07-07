import { useNavigate } from "react-router-dom";
import { useGame, useIsHost } from "../../state/GameContext";
import { leaveRoom, playAgain } from "../../state/actions";
import { Button } from "../ui/Button";

export function GameOverScreen() {
  const { state, dispatch } = useGame();
  const isHost = useIsHost();
  const navigate = useNavigate();
  if (!state.game?.winner || !state.revealedPlayers) return null;

  return (
    <div className="space-y-6 text-center">
      <h2 className="title-3d-gold font-display text-4xl">
        {state.game.winner === "MAFIA" ? "The Mafia wins" : "The Town wins"}
      </h2>
      <div className="mx-auto max-w-sm space-y-1">
        {state.revealedPlayers.map((p) => (
          <div key={p.id} className="flex justify-between text-sm">
            <span className={p.isAlive ? "" : "text-mafia-muted line-through"}>{p.nickname}</span>
            <span className="text-mafia-accent2">{p.role}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-3">
        {isHost ? (
          <Button onClick={() => playAgain()}>🔁 Play Again</Button>
        ) : (
          <p className="text-sm text-mafia-muted">Waiting for the host to start a new round…</p>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            leaveRoom(dispatch);
            navigate("/");
          }}
        >
          🚪 Back to Landing
        </Button>
      </div>
    </div>
  );
}
