import type { Patch, PatchVersion, Jersey, Club, League } from "@prisma/client";
import type { ApplicablePatch, Confederation, PatchVersionData } from "@/types/patch";
import {
  CONFEDERATION_BY_LEAGUE_ID,
  isNationalTeamLeague,
} from "./confederation-by-league";
import { isJerseySeasonInPatchPeriod } from "./season-format";

type PatchWithVersions = Patch & { versions: PatchVersion[] };
type JerseyContext = Jersey & { club: Club & { league: League } };

export function filterApplicablePatches(
  allPatches: PatchWithVersions[],
  jersey: JerseyContext,
  resolvedLeagueId: string
): ApplicablePatch[] {
  const isNational = isNationalTeamLeague(resolvedLeagueId);
  const clubConfederation: Confederation | null = isNational
    ? null
    : CONFEDERATION_BY_LEAGUE_ID[resolvedLeagueId] ?? null;

  return allPatches
    .filter((p) => p.isActive)
    .filter((p) => p.family !== "CUSTOM")
    .filter((p) =>
      isPatchEligible(p, resolvedLeagueId, isNational, clubConfederation)
    )
    .filter((p) => isClubEligible(p, jersey.clubId))
    .map((p) => ({
      patch: {
        id: p.id,
        name: p.name,
        family: p.family,
        leagueId: p.leagueId,
        isActive: p.isActive,
      },
      activeVersion: pickActiveVersion(p.versions, jersey.season),
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

function isClubEligible(patch: PatchWithVersions, clubId: string): boolean {
  if (patch.eligibleClubIds.length === 0) return true;
  return patch.eligibleClubIds.includes(clubId);
}

function pickActiveVersion(
  versions: PatchVersion[],
  season: string
): PatchVersionData | null {
  const match = versions.find((v) =>
    isJerseySeasonInPatchPeriod(season, v.seasonStart, v.seasonEnd)
  );

  if (!match) return null;

  return {
    id: match.id,
    seasonStart: match.seasonStart,
    seasonEnd: match.seasonEnd,
    imageUrl: match.imageUrl,
  };
}
