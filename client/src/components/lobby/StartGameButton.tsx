import { MIN_PLAYERS } from "@wolf/shared";
import { startGame } from "../../state/actions";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

interface Props {
  playerCount: number;
}

export function StartGameButton({ playerCount }: Props) {
  const canStart = playerCount >= MIN_PLAYERS;

  return (
    <div className="space-y-1">
      <Button className="w-full" disabled={!canStart} onClick={() => startGame()}>
        <Icon name="play" /> Start Game
      </Button>
      {!canStart && (
        <p className="text-center text-xs text-mafia-onDarkMuted">
          Need at least {MIN_PLAYERS} players ({playerCount}/{MIN_PLAYERS})
        </p>
      )}
    </div>
  );
}
