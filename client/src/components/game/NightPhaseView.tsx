import { useState } from "react";
import { Role } from "@wolf/shared";
import { useGame, useMyPlayer } from "../../state/GameContext";
import { submitNightAction } from "../../state/actions";
import { Button } from "../ui/Button";

const ACTING_ROLES: Role[] = [Role.MAFIA, Role.DOCTOR, Role.DETECTIVE];

function roleInstruction(role: Role): string {
  switch (role) {
    case Role.MAFIA:
      return "Choose a player to eliminate.";
    case Role.DOCTOR:
      return "Choose a player to protect tonight.";
    case Role.DETECTIVE:
      return "Choose a player to investigate.";
    default:
      return "";
  }
}

export function NightPhaseView() {
  const { state } = useGame();
  const myPlayer = useMyPlayer();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!myPlayer || !state.myRole) return null;

  const alivePlayers = state.players.filter((p) => p.isAlive);
  const canAct = myPlayer.isAlive && ACTING_ROLES.includes(state.myRole);
  const selectablePlayers =
    state.myRole === Role.DOCTOR ? alivePlayers : alivePlayers.filter((p) => p.id !== myPlayer.id);

  function handleSubmit() {
    if (!selected) return;
    submitNightAction(selected);
    setSubmitted(true);
  }

  const lastVote = state.game?.lastVoteResult;
  const eliminatedNickname = lastVote?.eliminatedPlayerId
    ? state.players.find((p) => p.id === lastVote.eliminatedPlayerId)?.nickname
    : null;

  return (
    <div className="space-y-4 text-center">
      <h2 className="font-display text-2xl text-mafia-accent2">Night falls over the town…</h2>

      {lastVote && (
        <p className="text-sm text-mafia-muted">
          {lastVote.tied ? "The vote was tied — no one was eliminated." : eliminatedNickname ? `${eliminatedNickname} was voted out.` : "No one was eliminated."}
        </p>
      )}

      {!myPlayer.isAlive ? (
        <p className="text-mafia-muted">You have been eliminated. Watch in silence.</p>
      ) : !canAct ? (
        <p className="text-mafia-muted">The town sleeps. Mafia, Doctor and Detective are making their move.</p>
      ) : submitted ? (
        <div className="space-y-2">
          <p className="text-mafia-muted">
            Choice locked in{selected ? `: ${selectablePlayers.find((p) => p.id === selected)?.nickname ?? ""}` : ""}.
            Waiting for the others…
          </p>
          <Button variant="ghost" onClick={() => setSubmitted(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <p className="text-mafia-muted">{roleInstruction(state.myRole)}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {selectablePlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`rounded-md border px-3 py-2 text-sm ${
                  selected === p.id ? "border-mafia-accent bg-mafia-accent/20" : "border-mafia-panel2 bg-mafia-panel2"
                }`}
              >
                {p.nickname}
              </button>
            ))}
          </div>
          <Button disabled={!selected} onClick={handleSubmit}>
            Confirm
          </Button>
        </>
      )}
    </div>
  );
}
