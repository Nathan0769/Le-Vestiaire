import type { Patch, PatchVersion, Jersey, Club, League } from "@prisma/client";
import type { ApplicablePatch, Confederation } from "@/types/patch";
import {
  CONFEDERATION_BY_LEAGUE_ID,
  isNationalTeamLeague,
} from "./confederation-by-league";
import { findActiveVersion } from "./find-active-version";
import { isJerseySeasonInPatchPeriod } from "./season-format";
import { pickTopUefaBadgeId } from "./uefa-badge-precedence";

type PatchWithVersions = Patch & { versions: PatchVersion[] };
type JerseyContext = Jersey & { club: Club & { league: League } };

// Ligues où le badge "champion en titre" remplace le badge de ligue normal.
// Restreint volontairement à ces ligues pour l'instant.
const CHAMPION_REPLACES_LEAGUE_BADGE_LEAGUE_IDS = new Set([
  "ligue-1",
  "bundesliga",
  "premier-league",
  "mls",
  "j1-league",
  "liga-mx",
]);

// Ligues dont les patchs n'existent que sur les saisons et clubs couverts par une
// version : pas de version active = patch non proposé (ex. maillots NASL rangés en MLS).
const STRICT_VERSION_LEAGUE_IDS = new Set(["mls"]);

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
    .filter((p) =>
      isPatchEligible(p, resolvedLeagueId, isNational, clubConfederation)
    )
    .map((p) => ({
      patch: p,
      activeVersion: findActiveVersion(p.versions, jersey.season, jersey.clubId),
      hasSeasonVersion: p.versions.some((v) =>
        isJerseySeasonInPatchPeriod(jersey.season, v.seasonStart, v.seasonEnd)
      ),
    }))
    .filter(
      ({ patch, activeVersion }) =>
        activeVersion !== null ||
        patch.leagueId === null ||
        !STRICT_VERSION_LEAGUE_IDS.has(patch.leagueId)
    )
    .filter(({ patch, activeVersion, hasSeasonVersion }) =>
      isClubEligible(patch, activeVersion, hasSeasonVersion, jersey.clubId)
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

  // Collapse des badges de manche LDC : un maillot n'en porte qu'un seul.
  // Précédence tenant > honour > starball. Ne concerne que les patchs porteurs
  // d'un variant ; les patchs UEFA legacy (variant null) passent inchangés.
  const badgeItems = filtered.filter(({ patch }) => patch.variant !== null);
  const topUefaBadgeId =
    badgeItems.length > 0
      ? pickTopUefaBadgeId(
          badgeItems.map(({ patch, activeVersion }) => ({
            id: patch.id,
            variant: patch.variant,
            hasActiveVersion: activeVersion !== null,
          }))
        )
      : null;

  const collapsed = filtered.filter(({ patch }) => {
    if (patch.variant === null) return true;
    return patch.id === topUefaBadgeId;
  });

  return collapsed.map(({ patch, activeVersion }) => ({
    patch: {
      id: patch.id,
      name: patch.name,
      family: patch.family,
      variant: patch.variant,
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

    // Patchs propres à un club (titres, anniversaires) : seule la liste de clubs
    // décide, quelle que soit la ligue (voir isClubEligible).
    case "CUSTOM":
      return true;

    default:
      return false;
  }
}

function isClubEligible(
  patch: PatchWithVersions,
  activeVersion: PatchVersion | null,
  hasSeasonVersion: boolean,
  clubId: string
): boolean {
  // Des versions couvrent la saison mais aucune ne cite le club : il en est exclu.
  if (!activeVersion && hasSeasonVersion) return false;
  const effective =
    activeVersion && activeVersion.eligibleClubIds.length > 0
      ? activeVersion.eligibleClubIds
      : patch.eligibleClubIds;
  // Un patch CUSTOM sans club n'est qu'une cible de rattachement admin : caché.
  if (effective.length === 0) return patch.family !== "CUSTOM";
  return effective.includes(clubId);
}
