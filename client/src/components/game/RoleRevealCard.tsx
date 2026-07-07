import { Role } from "@wolf/shared";
import { useGame } from "../../state/GameContext";
import { useGsapContext } from "../../animations/gsapContext";
import { flipRevealTimeline } from "../../animations/timelines";

const ROLE_INFO: Record<Role, { title: string; description: string }> = {
  [Role.MAFIA]: { title: "Mafia", description: "Eliminate the town, one night at a time." },
  [Role.DETECTIVE]: { title: "Detective", description: "Investigate one player each night." },
  [Role.DOCTOR]: { title: "Doctor", description: "Protect one player each night." },
  [Role.VILLAGER]: { title: "Villager", description: "Find and vote out the mafia." },
};

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
        <span className="font-display text-3xl text-mafia-accent2">{info.title}</span>
      </div>
      <p className="max-w-xs text-mafia-muted">{info.description}</p>
    </div>
  );
}
