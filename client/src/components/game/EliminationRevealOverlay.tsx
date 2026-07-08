import { useEffect, useRef, type RefObject } from "react";
import { useGame } from "../../state/GameContext";
import { eliminationHighlightTimeline, bloodSplatterTimeline } from "../../animations/timelines";
import { audioEngine } from "../../audio/audioEngine";

interface Props {
  containerRef: RefObject<HTMLElement | null>;
}

const PARTICLE_COUNT = 28;
const BLOOD_COLORS = ["#7a0c0c", "#a91d1d", "#5c0808", "#c22727", "#3d0505"];

// Bursts pixel-square "blood" particles from (x, y) across the full viewport.
// Built with raw DOM nodes rather than React state — the particles are
// write-once/throw-away and never need to re-render, so mounting them through
// React would just add bookkeeping for no benefit.
function spawnBloodSplatter(x: number, y: number): () => void {
  const overlay = document.createElement("div");
  overlay.className = "pointer-events-none fixed inset-0 z-[60] overflow-hidden";
  document.body.appendChild(overlay);

  const flash = document.createElement("div");
  flash.className = "absolute inset-0 bg-red-900";
  overlay.appendChild(flash);

  const particles: HTMLElement[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const size = 3 + Math.round(Math.random() * 5);
    const particle = document.createElement("div");
    particle.style.position = "absolute";
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.backgroundColor = BLOOD_COLORS[Math.floor(Math.random() * BLOOD_COLORS.length)];
    overlay.appendChild(particle);
    particles.push(particle);
  }

  const tl = bloodSplatterTimeline(flash, particles);
  tl.eventCallback("onComplete", () => overlay.remove());

  return () => {
    tl.kill();
    overlay.remove();
  };
}

// Falls back to the viewport center when the avatar isn't mounted (e.g. the
// roster hasn't rendered yet), so the splatter always has somewhere to burst from.
function originOf(el: HTMLElement | null | undefined): { x: number; y: number } {
  if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/**
 * Headless: flashes the just-eliminated player's avatar, bursts a full-screen
 * pixel blood splatter from it, and plays a gunshot — once per player, ever
 * (a player only dies once, so dedup is keyed purely on player id — not round —
 * since lastNightResult/lastVoteResult can each still hold a previous round's
 * value for a beat after `round` itself has already advanced via a separate
 * phase_changed event).
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
    const { x, y } = originOf(el);
    const cleanupSplatter = spawnBloodSplatter(x, y);
    const tl = el ? eliminationHighlightTimeline(el) : null;
    return () => {
      tl?.kill();
      cleanupSplatter();
    };
  }, [killedId, containerRef]);

  useEffect(() => {
    if (!votedOutId || handledIds.current.has(votedOutId)) return;
    handledIds.current.add(votedOutId);
    audioEngine.playGunshot();

    const el = containerRef.current?.querySelector<HTMLElement>(`[data-player-id="${votedOutId}"]`);
    const { x, y } = originOf(el);
    const cleanupSplatter = spawnBloodSplatter(x, y);
    const tl = el ? eliminationHighlightTimeline(el) : null;
    return () => {
      tl?.kill();
      cleanupSplatter();
    };
  }, [votedOutId, containerRef]);

  return null;
}
