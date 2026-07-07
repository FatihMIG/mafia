import type { PlayerPublic } from "@wolf/shared";

interface Props {
  player: PlayerPublic;
  highlight?: boolean;
}

export function PlayerAvatar({ player, highlight }: Props) {
  return (
    <div data-player-id={player.id} className={`flex flex-col items-center gap-1 ${!player.isAlive ? "opacity-40" : ""}`}>
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-lg font-bold ${
          highlight ? "border-mafia-accent2 text-mafia-accent2" : "border-mafia-panel2 text-mafia-text"
        } ${!player.isConnected ? "border-dashed" : ""}`}
      >
        {player.nickname.slice(0, 2).toUpperCase()}
      </div>
      <span className="max-w-[4rem] truncate text-xs text-mafia-muted">{player.nickname}</span>
      {!player.isAlive && <span className="text-[10px] text-red-400">eliminated</span>}
    </div>
  );
}
