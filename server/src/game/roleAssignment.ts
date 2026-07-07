import { Role, computeRoleCounts } from "@wolf/shared";
import type { Player } from "../rooms/Player.js";

function shuffle<T>(items: T[]): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}

export function assignRoles(players: Player[], mafiaCountOverride?: number): void {
  const counts = computeRoleCounts(players.length, mafiaCountOverride);
  const roles: Role[] = [
    ...Array(counts.mafia).fill(Role.MAFIA),
    ...Array(counts.detective).fill(Role.DETECTIVE),
    ...Array(counts.doctor).fill(Role.DOCTOR),
    ...Array(counts.villager).fill(Role.VILLAGER),
  ];
  shuffle(roles);

  players.forEach((player, i) => {
    player.role = roles[i] ?? Role.VILLAGER;
    player.isAlive = true;
  });
}
