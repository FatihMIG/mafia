import { alignmentOf, type Alignment } from "@wolf/shared";
import type { Player } from "../rooms/Player.js";

export interface NightSubmissions {
  mafiaTargetId: string | null;
  doctorTargetId: string | null;
  detectiveTargetId: string | null;
}

export interface NightOutcome {
  killedPlayerId: string | null;
  investigation: { targetPlayerId: string; alignment: Alignment } | null;
}

export function resolveNight(players: Map<string, Player>, submissions: NightSubmissions): NightOutcome {
  const killedPlayerId =
    submissions.mafiaTargetId && submissions.mafiaTargetId !== submissions.doctorTargetId
      ? submissions.mafiaTargetId
      : null;

  let investigation: NightOutcome["investigation"] = null;
  if (submissions.detectiveTargetId) {
    const target = players.get(submissions.detectiveTargetId);
    if (target?.role) {
      investigation = { targetPlayerId: target.id, alignment: alignmentOf(target.role) };
    }
  }

  return { killedPlayerId, investigation };
}
