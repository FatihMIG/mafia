import { useGame } from "../../state/GameContext";
import { useGsapContext } from "../../animations/gsapContext";
import { flipRevealTimeline } from "../../animations/timelines";
import { ROLE_INFO } from "../../state/roleDisplay";

export function RoleRevealCard() {
  const { state } = useGame();
  const cardRef = useGsapContext<HTMLDivElement>((card) => flipRevealTimeline(card), [state.myRole]);

  if (!state.myRole) return null;
  const info = ROLE_INFO[state.myRole];

  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center" style={{ perspective: 1000 }}>
      <div
        ref={cardRef}
        className="flex h-48 w-36 flex-col items-center justify-center gap-2 rounded-xl border-2 border-mafia-accent bg-mafia-panel shadow-xl"
      >
        <span className="text-xs uppercase tracking-widest text-mafia-muted">Your role</span>
        <span className="text-4xl">{info.icon}</span>
        <span className="font-display text-3xl text-mafia-accent2">{info.title}</span>
      </div>
      <p className="max-w-xs text-mafia-muted">{info.description}</p>
    </div>
  );
}
