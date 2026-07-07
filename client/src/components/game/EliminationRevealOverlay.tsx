import { useEffect, useRef, type RefObject } from "react";
import { useGame } from "../../state/GameContext";
import { eliminationHighlightTimeline } from "../../animations/timelines";
import { audioEngine } from "../../audio/audioEngine";

interface Props {
  containerRef: RefObject<HTMLElement | null>;
}

/**
 * Headless: flashes the just-eliminated player's avatar and plays a gunshot,
 * once per player, ever (a player only dies once, so dedup is keyed purely
 * on player id — not round — since lastNightResult/lastVoteResult can each
 * still hold a previous round's value for a beat after `round` itself has
 * already advanced via a separate phase_changed event).
 * Night-kills and vote-outs are tracked as two independent signals so a
 * round with both doesn't let one silently swallow the other.
 */
export function EliminationRevealOverlay({ containerRef }: Props) {
  const { state } = useGame();
  const handledIds = useRef<Set<string>>(new Set());

  const killedId = state.game?.lastNightResult?.killedPlayerId ?? null;
  const votedOutId = state.game?.lastVoteResult?.eliminatedPlayerId ?? null;

  useEffect(() => {
    if (!killedId || handledIds.current.has(killedId)) return;
    handledIds.current.add(killedId);
    audioEngine.playGunshot();

    const el = containerRef.current?.querySelector<HTMLElement>(`[data-player-id="${killedId}"]`);
    if (!el) return;
    const tl = eliminationHighlightTimeline(el);
    return () => {
      tl.kill();
    };
  }, [killedId, containerRef]);

  useEffect(() => {
    if (!votedOutId || handledIds.current.has(votedOutId)) return;
    handledIds.current.add(votedOutId);
    audioEngine.playGunshot();

    const el = containerRef.current?.querySelector<HTMLElement>(`[data-player-id="${votedOutId}"]`);
    if (!el) return;
    const tl = eliminationHighlightTimeline(el);
    return () => {
      tl.kill();
    };
  }, [votedOutId, containerRef]);

  return null;
}
