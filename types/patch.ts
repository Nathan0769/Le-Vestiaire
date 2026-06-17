import type { PatchFamily as PrismaPatchFamily } from "@prisma/client";

export type PatchFamily = PrismaPatchFamily;

export type Confederation = "UEFA" | "CONMEBOL" | "CONCACAF" | "AFC" | "CAF" | "OFC";

export interface PatchVersionData {
  id: string;
  seasonStart: string;
  seasonEnd: string | null;
  imageUrl: string | null;
}

export interface PatchData {
  id: string;
  name: string;
  family: PatchFamily;
  leagueId: string | null;
  isActive: boolean;
  notes: string | null;
  versions: PatchVersionData[];
}

export interface ApplicablePatch {
  patch: Omit<PatchData, "versions" | "notes">;
  activeVersion: PatchVersionData | null;
}

export interface UserJerseyPatchInput {
  patchId?: string;
  customLabel?: string;
}

export interface UserJerseyPatchData {
  id: string;
  patchId: string | null;
  customLabel: string | null;
  patch: {
    id: string;
    name: string;
    family: PatchFamily;
    versions: PatchVersionData[];
  } | null;
}

export const PATCH_FAMILY_LABELS_FR: Record<PatchFamily, string> = {
  UEFA_COMPETITION: "Compétitions UEFA",
  CONFED_CLUB_COMPETITION: "Compétitions continentales clubs",
  FIFA_CLUB_COMPETITION: "Compétitions FIFA clubs",
  DOMESTIC_LEAGUE_BADGE: "Badge de ligue",
  DOMESTIC_CHAMPION: "Champion en titre",
  DOMESTIC_CUP: "Coupe nationale",
  DOMESTIC_SUPERCUP: "Supercoupe nationale",
  NATIONAL_TEAM_COMPETITION: "Compétitions sélections nationales",
  CUSTOM: "Personnalisé",
};

export const PATCH_FAMILY_ORDER: PatchFamily[] = [
  "DOMESTIC_LEAGUE_BADGE",
  "UEFA_COMPETITION",
  "DOMESTIC_CHAMPION",
  "DOMESTIC_CUP",
  "DOMESTIC_SUPERCUP",
  "CONFED_CLUB_COMPETITION",
  "FIFA_CLUB_COMPETITION",
  "NATIONAL_TEAM_COMPETITION",
  "CUSTOM",
];
