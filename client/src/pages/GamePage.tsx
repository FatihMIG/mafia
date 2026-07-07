import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GamePhase } from "@wolf/shared";
import { useGame } from "../state/GameContext";
import { PlayerAvatar } from "../components/game/PlayerAvatar";
import { RoleRevealCard } from "../components/game/RoleRevealCard";
import { NightPhaseView } from "../components/game/NightPhaseView";
import { DayPhaseView } from "../components/game/DayPhaseView";
import { VotingPhaseView } from "../components/game/VotingPhaseView";
import { GameOverScreen } from "../components/game/GameOverScreen";
import { InvestigationLog } from "../components/game/InvestigationLog";
import { PhaseTransitionOverlay } from "../components/game/PhaseTransitionOverlay";
import { EliminationRevealOverlay } from "../components/game/EliminationRevealOverlay";
import { VoiceChatBar } from "../components/game/VoiceChatBar";

function useCountdown(phaseEndsAt: number | null): number | null {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!phaseEndsAt) {
      setSecondsLeft(null);
      return;
    }
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((phaseEndsAt - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [phaseEndsAt]);

  return secondsLeft;
}

const PHASE_LABELS: Record<string, string> = {
  [GamePhase.ROLE_REVEAL]: "Role Reveal",
  [GamePhase.NIGHT]: "Night",
  [GamePhase.DAY]: "Day",
  [GamePhase.VOTING]: "Voting",
  [GamePhase.GAME_OVER]: "Game Over",
};

export function GamePage() {
  const { code } = useParams<{ code: string }>();
  const { state } = useGame();
  const navigate = useNavigate();
  const secondsLeft = useCountdown(state.game?.phaseEndsAt ?? null);
  const rosterRef = useRef<HTMLDivElement>(null);

  const joined = state.bootstrapped && state.roomCode === code?.toUpperCase();
  const gamePhase = state.game?.phase;

  useEffect(() => {
    if (!state.bootstrapped) return;
    if (!joined) {
      navigate(`/?code=${code}`, { replace: true });
      return;
    }
    if (!gamePhase || gamePhase === GamePhase.LOBBY) {
      navigate(`/room/${code}`, { replace: true });
    }
  }, [state.bootstrapped, joined, gamePhase, code, navigate]);

  if (!joined || !state.game) return null;

  return (
    <div className="min-h-screen bg-mafia-bg px-4 py-8 text-mafia-text">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl text-mafia-accent">{PHASE_LABELS[state.game.phase]}</h1>
            <p className="text-xs text-mafia-muted">Round {state.game.round}</p>
          </div>
          {secondsLeft !== null && (
            <div className="font-mono text-2xl text-mafia-accent2">{String(secondsLeft).padStart(2, "0")}s</div>
          )}
        </div>

        <div
          ref={rosterRef}
          className="flex flex-wrap justify-center gap-3 rounded-lg border border-mafia-panel2 bg-mafia-panel p-4"
        >
          {state.players.map((p) => (
            <PlayerAvatar key={p.id} player={p} highlight={p.id === state.playerId} />
          ))}
        </div>
        <EliminationRevealOverlay containerRef={rosterRef} />

        <VoiceChatBar />

        <div className="rounded-lg border border-mafia-panel2 bg-mafia-panel p-6">
          <PhaseTransitionOverlay phase={state.game.phase}>
            {(displayPhase) => <PhaseBody phase={displayPhase} />}
          </PhaseTransitionOverlay>
        </div>

        <InvestigationLog />
      </div>
    </div>
  );
}

function PhaseBody({ phase }: { phase: GamePhase }) {
  switch (phase) {
    case GamePhase.ROLE_REVEAL:
      return <RoleRevealCard />;
    case GamePhase.NIGHT:
      return <NightPhaseView />;
    case GamePhase.DAY:
      return <DayPhaseView />;
    case GamePhase.VOTING:
      return <VotingPhaseView />;
    case GamePhase.GAME_OVER:
      return <GameOverScreen />;
    default:
      return null;
  }
}
