export function pickRandomTarget<T extends { id: string }>(candidates: T[], excludeId?: string): string | null {
  const pool = excludeId ? candidates.filter((c) => c.id !== excludeId) : candidates;
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)].id;
}

export function randomDelayMs(minSec: number, maxSec: number): number {
  return (minSec + Math.random() * (maxSec - minSec)) * 1000;
}

const BOT_CHAT_LINES = [
  "I've got a bad feeling about someone here...",
  "Let's think about this carefully before we vote.",
  "Anyone acting suspicious to you?",
  "I trust the process. Let's vote wisely.",
  "Something feels off tonight.",
];

export function pickBotChatLine(): string {
  return BOT_CHAT_LINES[Math.floor(Math.random() * BOT_CHAT_LINES.length)];
}
