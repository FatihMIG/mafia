import { Role } from "@wolf/shared";

export const ROLE_INFO: Record<Role, { icon: string; title: string; description: string }> = {
  [Role.MAFIA]: { icon: "fire", title: "Mafia", description: "Eliminate the town, one night at a time." },
  [Role.DETECTIVE]: { icon: "glasses", title: "Detective", description: "Investigate one player each night." },
  [Role.DOCTOR]: { icon: "plus", title: "Doctor", description: "Protect one player each night." },
  [Role.VILLAGER]: { icon: "user", title: "Villager", description: "Find and vote out the mafia." },
};
