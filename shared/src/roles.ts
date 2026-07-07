export const Role = {
  MAFIA: "MAFIA",
  DETECTIVE: "DETECTIVE",
  DOCTOR: "DOCTOR",
  VILLAGER: "VILLAGER",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const Alignment = {
  TOWN: "TOWN",
  MAFIA: "MAFIA",
} as const;

export type Alignment = (typeof Alignment)[keyof typeof Alignment];

export const ROLE_ALIGNMENT: Record<Role, Alignment> = {
  MAFIA: Alignment.MAFIA,
  DETECTIVE: Alignment.TOWN,
  DOCTOR: Alignment.TOWN,
  VILLAGER: Alignment.TOWN,
};

export function alignmentOf(role: Role): Alignment {
  return ROLE_ALIGNMENT[role];
}

export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 15;

/**
 * Mafia/Detective/Doctor counts scale with player count; remaining players are Villagers.
 * Index by the largest threshold <= playerCount.
 */
const ROLE_SCALE: Array<{ minPlayers: number; mafia: number; detective: number; doctor: number }> = [
  { minPlayers: 5, mafia: 1, detective: 1, doctor: 1 },
  { minPlayers: 7, mafia: 2, detective: 1, doctor: 1 },
  { minPlayers: 10, mafia: 3, detective: 1, doctor: 1 },
  { minPlayers: 13, mafia: 4, detective: 1, doctor: 1 },
];

export interface RoleCounts {
  mafia: number;
  detective: number;
  doctor: number;
  villager: number;
}

export function computeRoleCounts(playerCount: number, mafiaCountOverride?: number): RoleCounts {
  const tier = [...ROLE_SCALE].reverse().find((t) => playerCount >= t.minPlayers) ?? ROLE_SCALE[0];
  const detective = tier.detective;
  const doctor = tier.doctor;
  // Cap mafia so at least one town-aligned player (beyond detective/doctor) always remains.
  const maxMafia = Math.max(1, playerCount - detective - doctor - 1);
  const mafia =
    mafiaCountOverride && mafiaCountOverride > 0 ? Math.min(mafiaCountOverride, maxMafia) : tier.mafia;
  const villager = Math.max(0, playerCount - mafia - detective - doctor);
  return { mafia, detective, doctor, villager };
}
