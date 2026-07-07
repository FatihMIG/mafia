import { useState } from "react";
import { useGame, useMyPlayer } from "../../state/GameContext";
import { castVote } from "../../state/actions";
import { AnimatedNumber } from "../ui/AnimatedNumber";

export function VotingPhaseView() {
  const { state } = useGame();
  const myPlayer = useMyPlayer();
  const [voted, setVoted] = useState(false);

  const alivePlayers = state.players.filter((p) => p.isAlive);

  function handleVote(targetId: string | null) {
    castVote(targetId);
    setVoted(true);
  }

  return (
    <div className="space-y-4 text-center">
      <h2 className="font-display text-2xl text-mafia-accent2">Time to vote</h2>

      {!myPlayer?.isAlive ? (
        <p className="text-mafia-muted">You are eliminated and cannot vote.</p>
      ) : voted ? (
        <p className="text-mafia-muted">Vote cast. Waiting for the others…</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          {alivePlayers
            .filter((p) => p.id !== myPlayer.id)
            .map((p) => (
              <button
                key={p.id}
                onClick={() => handleVote(p.id)}
                className="leather-surface rounded-md bg-mafia-panel2 px-3 py-2 text-sm text-mafia-text hover:brightness-110"
              >
                🗳️ {p.nickname}
                {state.voteTally?.tally[p.id] ? (
                  <>
                    {" ("}
                    <AnimatedNumber value={state.voteTally.tally[p.id]} />
                    {")"}
                  </>
                ) : null}
              </button>
            ))}
          <button
            onClick={() => handleVote(null)}
            className="rounded-md border border-mafia-panel2 bg-transparent px-3 py-2 text-sm text-mafia-muted hover:border-mafia-accent"
          >
            🤷 Abstain
          </button>
        </div>
      )}
    </div>
  );
}
