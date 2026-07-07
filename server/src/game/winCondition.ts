import { Role, Winner } from "@wolf/shared";
import type { Player } from "../rooms/Player.js";

export function checkWinCondition(players: Map<string, Player>): Winner | null {
  const alive = [...players.values()].filter((p) => p.isAlive);
  const mafiaAlive = alive.filter((p) => p.role === Role.MAFIA).length;
  const townAlive = alive.length - mafiaAlive;

  if (mafiaAlive === 0) return Winner.TOWN;
  if (mafiaAlive >= townAlive) return Winner.MAFIA;
  return null;
}
