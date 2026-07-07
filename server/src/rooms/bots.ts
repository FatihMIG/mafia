import crypto from "node:crypto";
import { Player } from "./Player.js";

const BOT_NAME_POOL = ["Rossi", "Vinnie", "Salvatore", "Nunzio", "Carmine", "Dino", "Enzo", "Marco"];

function pickBotName(existingNicknames: string[]): string {
  const available = BOT_NAME_POOL.filter((name) => !existingNicknames.includes(`🤖 ${name}`));
  const pool = available.length > 0 ? available : BOT_NAME_POOL;
  const name = pool[Math.floor(Math.random() * pool.length)];
  return `🤖 ${name}`;
}

export function createBotPlayer(existingNicknames: string[]): Player {
  const nickname = pickBotName(existingNicknames);
  const socketId = `bot:${crypto.randomUUID()}`;
  return new Player(nickname, socketId, false, true);
}
