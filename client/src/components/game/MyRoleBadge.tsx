import { useGame } from "../../state/GameContext";
import { ROLE_INFO } from "../../state/roleDisplay";

export function MyRoleBadge() {
  const { state } = useGame();
  if (!state.myRole) return null;
  const info = ROLE_INFO[state.myRole];

  return (
    <div
      className="flex items-center gap-2 border-2 border-mafia-text bg-mafia-panel2 px-3 py-1.5 text-sm text-mafia-text"
      title="Your role — visible only to you"
    >
      <span className="text-lg">{info.icon}</span>
      <span className="font-medium">{info.title}</span>
    </div>
  );
}
