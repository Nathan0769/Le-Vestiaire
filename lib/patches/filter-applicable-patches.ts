import type { Patch, PatchVersion, Jersey, Club, League } from "@prisma/client";
import type { ApplicablePatch, Confederation } from "@/types/patch";
import {
  CONFEDERATION_BY_LEAGUE_ID,
  isNationalTeamLeague,
} from "./confederation-by-league";
import { isJerseySeasonInPatchPeriod } from "./season-format";

type PatchWithVersions = Patch & { versions: PatchVersion[] };
type JerseyContext = Jersey & { club: Club & { league: League } };

// Ligues où le badge "champion en titre" remplace le badge de ligue normal.
// Restreint volontairement à ces trois ligues pour l'instant.
const CHAMPION_REPLACES_LEAGUE_BADGE_LEAGUE_IDS = new Set([
  "ligue-1",
  "bundesliga",
  "premier-league",
]);

export function filterApplicablePatches(
  allPatches: PatchWithVersions[],
  jersey: JerseyContext,
  resolvedLeagueId: string
): ApplicablePatch[] {
  const isNational = isNationalTeamLeague(resolvedLeagueId);
  const clubConfederation: Confederation | null = isNational
    ? null
    : CONFEDERATION_BY_LEAGUE_ID[resolvedLeagueId] ?? null;

  const applicable = allPatches
    .filter((p) => p.isActive)
    .filter((p) => p.family !== "CUSTOM")
    .filter((p) =>
      isPatchEligible(p, resolvedLeagueId, isNational, clubConfederation)
    )
    .map((p) => ({
      patch: p,
      activeVersion: p.versions.find((v) =>
        isJerseySeasonInPatchPeriod(jersey.season, v.seasonStart, v.seasonEnd)
      ) ?? null,
    }))
    .filter(({ patch, activeVersion }) =>
      isClubEligible(patch, activeVersion, jersey.clubId)
    );

  // Si le club est champion en titre sur la saison du maillot (patch
  // DOMESTIC_CHAMPION applicable avec une version couvrant la saison), le badge
  // champion remplace le badge de ligue normal de la même ligue.
  const isChampionOnSeason =
    CHAMPION_REPLACES_LEAGUE_BADGE_LEAGUE_IDS.has(resolvedLeagueId) &&
    applicable.some(
      ({ patch, activeVersion }) =>
        patch.family === "DOMESTIC_CHAMPION" && activeVersion !== null
    );

  const filtered = isChampionOnSeason
    ? applicable.filter(({ patch }) => patch.family !== "DOMESTIC_LEAGUE_BADGE")
    : applicable;

  return filtered.map(({ patch, activeVersion }) => ({
    patch: {
      id: patch.id,
      name: patch.name,
      family: patch.family,
      leagueId: patch.leagueId,
      isActive: patch.isActive,
    },
    activeVersion: activeVersion
      ? {
          id: activeVersion.id,
          seasonStart: activeVersion.seasonStart,
          seasonEnd: activeVersion.seasonEnd,
          imageUrl: activeVersion.imageUrl,
        }
      : null,
  }));
}

function isPatchEligible(
  patch: PatchWithVersions,
  resolvedLeagueId: string,
  isNational: boolean,
  clubConfederation: Confederation | null
): boolean {
  switch (patch.family) {
    case "UEFA_COMPETITION":
      return !isNational && clubConfederation === "UEFA";

    case "CONFED_CLUB_COMPETITION":
      return !isNational && clubConfederation !== null && clubConfederation !== "UEFA";

    case "FIFA_CLUB_COMPETITION":
      return !isNational;

    case "DOMESTIC_LEAGUE_BADGE":
    case "DOMESTIC_CHAMPION":
    case "DOMESTIC_CUP":
    case "DOMESTIC_SUPERCUP":
      return !isNational && patch.leagueId === resolvedLeagueId;

    case "NATIONAL_TEAM_COMPETITION":
      if (!isNational) return false;
      if (patch.leagueId !== null && patch.leagueId !== resolvedLeagueId) return false;
      return true;

    case "CUSTOM":
      return false;

    default:
      return false;
  }
}

function isClubEligible(
  patch: PatchWithVersions,
  activeVersion: PatchVersion | null,
  clubId: string
): boolean {
  const effective =
    activeVersion && activeVersion.eligibleClubIds.length > 0
      ? activeVersion.eligibleClubIds
      : patch.eligibleClubIds;
  if (effective.length === 0) return true;
  return effective.includes(clubId);
}
