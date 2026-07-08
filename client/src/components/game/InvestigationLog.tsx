import { Role } from "@wolf/shared";
import { useGame } from "../../state/GameContext";

export function InvestigationLog() {
  const { state } = useGame();
  if (state.myRole !== Role.DETECTIVE || state.investigationResults.length === 0) return null;

  return (
    <div className="nes-container is-rounded space-y-1 bg-mafia-panel text-sm text-mafia-text">
      <h3 className="font-semibold text-mafia-text">Your investigations</h3>
      {state.investigationResults.map((r, i) => {
        const target = state.players.find((p) => p.id === r.targetPlayerId);
        return (
          <div key={i} className="text-mafia-muted">
            {target?.nickname ?? "Unknown"} is{" "}
            <span className={r.alignment === "MAFIA" ? "text-red-400" : "text-green-400"}>{r.alignment}</span>
          </div>
        );
      })}
    </div>
  );
}
