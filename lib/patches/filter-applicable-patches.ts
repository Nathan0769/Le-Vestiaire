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
  "liga-portugal",
  "eredivisie",
  "jupiler-pro-league",
  "scottish-premiership",
  "allsvenskan",
  "saudi-pro-league",
  "primera-division-argentina",
]);

// Ligues dont les patchs n'existent que sur les saisons et clubs couverts par une
// version : pas de version active = patch non proposé (ex. maillots NASL rangés en MLS).
const STRICT_VERSION_LEAGUE_IDS = new Set(["mls"]);

// Patchs de campagne versionnés sans trou de leur création à leur fin : hors de leurs années
// ils n'existaient pas (Ligue des Nations avant 2018, Respect après 2020, badge des anciens
// vainqueurs propre à 2026).
const STRICT_VERSION_PATCH_NAMES = new Set([
  "Ligue des Nations UEFA",
  "Ligue des Nations Concacaf",
  "Qualifications UEFA",
  "Respect UEFA",
  "UEFA Foundation",
  "Coupe du Monde FIFA champion clair",
  "Coupe du Monde FIFA champion foncé",
  "Coupe de la Ligue",
  "FA Cup - tenant du titre",
  "EFL Cup",
  "EFL Cup - tenant du titre",
  "DFB-Pokal - tenant du titre",
  "Sky Bet - jeu responsable",
  "Not Today or Any Day",
  "EFL Together",
  "Roshn Saudi League",
  "Primera División (Argentine)",
]);

// Familles versionnées saison par saison sans trou dans ces ligues : une saison sans
// version n'a pas de patch. Ailleurs les données ont des trous (un champion sans
// version doit rester proposé), on n'y ajoute une ligue qu'une fois complète.
const STRICT_VERSION_FAMILIES_BY_LEAGUE: Record<string, ReadonlySet<string>> = {
  "liga-portugal": new Set(["DOMESTIC_CHAMPION", "DOMESTIC_SUPERCUP"]),
  eredivisie: new Set(["DOMESTIC_CHAMPION", "DOMESTIC_SUPERCUP"]),
  "jupiler-pro-league": new Set(["DOMESTIC_CHAMPION", "DOMESTIC_SUPERCUP"]),
  "scottish-premiership": new Set(["DOMESTIC_CHAMPION"]),
  "j1-league": new Set(["DOMESTIC_CHAMPION"]),
  "liga-mx": new Set(["DOMESTIC_CHAMPION"]),
  "ligue-1": new Set(["DOMESTIC_SUPERCUP"]),
  "premier-league": new Set(["DOMESTIC_SUPERCUP"]),
  allsvenskan: new Set(["DOMESTIC_CHAMPION"]),
  "saudi-pro-league": new Set(["DOMESTIC_CHAMPION"]),
  "primera-division-argentina": new Set(["DOMESTIC_CHAMPION"]),
};

// Le modèle Patch ne porte pas de confédération : sans cette table, un club CONMEBOL se
// verrait proposer les compétitions CAF, Concacaf et AFC. Un patch absent reste ouvert à
// toute confédération hors UEFA.
const CONFEDERATION_BY_CONFED_PATCH_NAME: Record<string, Confederation> = {
  "Copa Libertadores": "CONMEBOL",
  "Titres Copa Libertadores": "CONMEBOL",
  "Champion Copa Libertadores": "CONMEBOL",
  "Champion Copa Sudamericana": "CONMEBOL",
  "Copa Sudamericana": "CONMEBOL",
  "Recopa Sudamericana": "CONMEBOL",
  "Coupe des Champions Concacaf": "CONCACAF",
  "Ligue des Champions AFC Elite": "AFC",
  "Ligue des Champions AFC Two": "AFC",
  "Ligue des Champions CAF": "CAF",
  "Coupe de la Confédération CAF": "CAF",
  "Supercoupe CAF": "CAF",
};

// Coupes nationales réservées à certaines divisions (la Coupe de la Ligue n'était ouverte qu'aux
// clubs professionnels), au lieu de toutes les ligues du pays.
const LEAGUES_BY_CUP_PATCH_NAME: Record<string, ReadonlySet<string>> = {
  "Coupe de la Ligue": new Set(["ligue-1", "ligue-2"]),
};

export function filterApplicablePatches(
  allPatches: PatchWithVersions[],
  jersey: JerseyContext,
  resolvedLeagueId: string,
  countryByLeagueId: ReadonlyMap<string, string> = new Map()
): ApplicablePatch[] {
  const isNational = isNationalTeamLeague(resolvedLeagueId);
  const clubConfederation: Confederation | null = isNational
    ? null
    : CONFEDERATION_BY_LEAGUE_ID[resolvedLeagueId] ?? null;

  const applicable = allPatches
    .filter((p) => p.isActive)
    .filter((p) =>
      isPatchEligible(p, resolvedLeagueId, isNational, clubConfederation, countryByLeagueId)
    )
    .map((p) => ({
      patch: p,
      activeVersion: findActiveVersion(p.versions, jersey.season, jersey.clubId),
      hasSeasonVersion: p.versions.some((v) =>
        isJerseySeasonInPatchPeriod(jersey.season, v.seasonStart, v.seasonEnd)
      ),
    }))
    .filter(({ patch, activeVersion }) => activeVersion !== null || !isVersionStrict(patch))
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

// Les compétitions UEFA sont versionnées saison par saison avec leurs participants :
// une saison sans version (avant la création du patch, après sa disparition) n'a pas
// de patch. Un patch encore sans aucune version reste proposé à tous.
function isVersionStrict(patch: PatchWithVersions): boolean {
  if (patch.leagueId !== null && STRICT_VERSION_LEAGUE_IDS.has(patch.leagueId)) return true;
  if (patch.versions.length === 0) return false;
  if (STRICT_VERSION_PATCH_NAMES.has(patch.name)) return true;
  if (patch.family === "UEFA_COMPETITION") return true;
  // Compétition versionnée par participants (Libertadores, Coupe du monde des clubs) : seuls
  // les clubs d'une édition l'ont. Les patchs sans liste de clubs restent ouverts.
  if (patch.family === "CONFED_CLUB_COMPETITION" || patch.family === "FIFA_CLUB_COMPETITION") {
    return patch.versions.some((v) => v.eligibleClubIds.length > 0);
  }
  // Compétition de sélections versionnée par édition (Euro, CAN, Copa América avec ses invités) :
  // seules les sélections d'une édition l'ont, une année sans édition n'a pas de patch. Un patch qui
  // porte sa propre liste (Champion du Monde) garde ce repli hors de ses versions.
  if (patch.family === "NATIONAL_TEAM_COMPETITION" && patch.eligibleClubIds.length === 0) {
    return patch.versions.some((v) => v.eligibleClubIds.length > 0);
  }
  return patch.leagueId !== null && (STRICT_VERSION_FAMILIES_BY_LEAGUE[patch.leagueId]?.has(patch.family) ?? false);
}

function isPatchEligible(
  patch: PatchWithVersions,
  resolvedLeagueId: string,
  isNational: boolean,
  clubConfederation: Confederation | null,
  countryByLeagueId: ReadonlyMap<string, string>
): boolean {
  switch (patch.family) {
    case "UEFA_COMPETITION":
      return !isNational && clubConfederation === "UEFA";

    case "CONFED_CLUB_COMPETITION": {
      if (isNational || clubConfederation === null || clubConfederation === "UEFA") return false;
      const patchConfederation = CONFEDERATION_BY_CONFED_PATCH_NAME[patch.name];
      return patchConfederation === undefined || patchConfederation === clubConfederation;
    }

    case "FIFA_CLUB_COMPETITION":
      return !isNational;

    case "DOMESTIC_LEAGUE_BADGE":
    case "DOMESTIC_CHAMPION":
      return !isNational && patch.leagueId === resolvedLeagueId;

    // Coupe et supercoupe nationales ouvertes à toutes les divisions du pays
    // (ex. Taça de Portugal gagnée par un club de Liga 2).
    case "DOMESTIC_CUP":
    case "DOMESTIC_SUPERCUP": {
      if (isNational) return false;
      const leagues = LEAGUES_BY_CUP_PATCH_NAME[patch.name];
      if (leagues) return leagues.has(resolvedLeagueId);
      return isSameCountryLeague(patch.leagueId, resolvedLeagueId, countryByLeagueId);
    }

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

// La ligue "Autres" (country "Autres") regroupe des clubs de tous pays : pas de pays commun.
function isSameCountryLeague(
  patchLeagueId: string | null,
  resolvedLeagueId: string,
  countryByLeagueId: ReadonlyMap<string, string>
): boolean {
  if (patchLeagueId === resolvedLeagueId) return true;
  if (patchLeagueId === null) return false;
  const country = countryByLeagueId.get(patchLeagueId);
  return country !== undefined && country !== "Autres" && country === countryByLeagueId.get(resolvedLeagueId);
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
