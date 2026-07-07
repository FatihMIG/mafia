export interface VoteOutcome {
  eliminatedPlayerId: string | null;
  tally: Record<string, number>;
  tied: boolean;
}

export function resolveVotes(votes: Map<string, string | null>): VoteOutcome {
  const tally: Record<string, number> = {};
  for (const targetId of votes.values()) {
    if (!targetId) continue;
    tally[targetId] = (tally[targetId] ?? 0) + 1;
  }

  const entries = Object.entries(tally);
  if (entries.length === 0) return { eliminatedPlayerId: null, tally, tied: false };

  const maxVotes = Math.max(...entries.map(([, count]) => count));
  const topCandidates = entries.filter(([, count]) => count === maxVotes);

  if (topCandidates.length > 1) {
    return { eliminatedPlayerId: null, tally, tied: true };
  }
  return { eliminatedPlayerId: topCandidates[0][0], tally, tied: false };
}
