import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GamePhase } from "@wolf/shared";
import { useGame, useIsHost } from "../state/GameContext";
import { leaveRoom, kickPlayer, addBot } from "../state/actions";
import { PlayerList } from "../components/lobby/PlayerList";
import { RoomCodeBadge } from "../components/lobby/RoomCodeBadge";
import { HostSettingsPanel } from "../components/lobby/HostSettingsPanel";
import { StartGameButton } from "../components/lobby/StartGameButton";
import { TerminateRoomButton } from "../components/lobby/TerminateRoomButton";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export function LobbyPage() {
  const { code } = useParams<{ code: string }>();
  const { state, dispatch } = useGame();
  const isHost = useIsHost();
  const navigate = useNavigate();

  const joined = state.bootstrapped && state.roomCode === code?.toUpperCase();
  const inGame = !!state.game && state.game.phase !== GamePhase.LOBBY;

  useEffect(() => {
    if (!state.bootstrapped) return;
    if (!joined) {
      navigate(`/?code=${code}`, { replace: true });
      return;
    }
    if (inGame) {
      navigate(`/room/${code}/game`, { replace: true });
    }
  }, [state.bootstrapped, joined, inGame, code, navigate]);

  if (!joined || !state.settings) return null;

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-6 text-mafia-text sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-mafia-accent">Lobby</h1>
        <RoomCodeBadge roomCode={code!.toUpperCase()} />
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-mafia-muted">Players ({state.players.length})</h2>
          {isHost && (
            <button
              onClick={() => addBot()}
              disabled={state.players.length >= state.settings.maxPlayers}
              className="text-xs text-mafia-muted hover:text-mafia-accent2 disabled:opacity-40"
            >
              🤖 + Add Bot
            </button>
          )}
        </div>
        <PlayerList players={state.players} canKick={isHost} onKick={kickPlayer} />
      </Card>

      {isHost && <HostSettingsPanel settings={state.settings} />}

      <div className="flex gap-3">
        {isHost ? (
          <div className="flex-1">
            <StartGameButton playerCount={state.players.length} />
          </div>
        ) : (
          <p className="flex-1 text-center text-sm text-mafia-muted">Waiting for the host to start…</p>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            leaveRoom(dispatch);
            navigate("/");
          }}
        >
          🚪 Leave
        </Button>
      </div>

      {isHost && (
        <div className="flex justify-center">
          <TerminateRoomButton />
        </div>
      )}
    </div>
  );
}
