import { useEffect, useRef, type RefObject } from "react";
import { useGame } from "../../state/GameContext";
import { eliminationHighlightTimeline } from "../../animations/timelines";

interface Props {
  containerRef: RefObject<HTMLElement | null>;
}

/** Headless: flashes the just-eliminated player's avatar inside containerRef. Renders nothing itself. */
export function EliminationRevealOverlay({ containerRef }: Props) {
  const { state } = useGame();
  const lastHandledKey = useRef<string | null>(null);

  const killedId = state.game?.lastNightResult?.killedPlayerId;
  const votedOutId = state.game?.lastVoteResult?.eliminatedPlayerId;
  const targetId = killedId ?? votedOutId ?? null;
  const round = state.game?.round ?? 0;

  useEffect(() => {
    if (!targetId) return;
    const key = `${round}-${targetId}`;
    if (lastHandledKey.current === key) return;
    lastHandledKey.current = key;

    const el = containerRef.current?.querySelector<HTMLElement>(`[data-player-id="${targetId}"]`);
    if (!el) return;
    const tl = eliminationHighlightTimeline(el);
    return () => {
      tl.kill();
    };
  }, [targetId, round, containerRef]);

  return null;
}
