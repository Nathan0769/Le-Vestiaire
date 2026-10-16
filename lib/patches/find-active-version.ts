import { isJerseySeasonInPatchPeriod } from "./season-format";

type ClubScoped = { eligibleClubIds: string[] };
type VersionLike = ClubScoped & {
  seasonStart: string;
  seasonEnd: string | null;
};

function coversClub(version: ClubScoped, clubId: string): boolean {
  return (
    version.eligibleClubIds.length === 0 ||
    version.eligibleClubIds.includes(clubId)
  );
}

/**
 * Version active d'un patch pour un maillot : saison couverte et club éligible
 * (liste vide = tous les clubs). Plusieurs versions peuvent couvrir la même
 * saison quand l'image change selon le club (badge MLS aux couleurs du club).
 */
export function findActiveVersion<V extends VersionLike>(
  versions: V[],
  season: string,
  clubId: string
): V | null {
  return (
    versions.find(
      (v) =>
        isJerseySeasonInPatchPeriod(season, v.seasonStart, v.seasonEnd) &&
        coversClub(v, clubId)
    ) ?? null
  );
}

export function versionsForClub<V extends ClubScoped>(
  versions: V[],
  clubId: string
): V[] {
  return versions.filter((v) => coversClub(v, clubId));
}

/**
 * Restreint les versions renvoyées avec une collection à celles du club du
 * maillot : les clients (web, app iOS) choisissent la version sur la saison seule.
 */
export function scopePatchVersionsToClub<
  V extends ClubScoped,
  P extends { versions: V[] },
  U extends { patch: P | null },
>(userPatches: U[], clubId: string) {
  return userPatches.map((up) => ({
    ...up,
    patch: up.patch
      ? {
          ...up.patch,
          versions: versionsForClub(up.patch.versions, clubId).map(
            ({ eligibleClubIds: _eligibleClubIds, ...rest }) => rest
          ),
        }
      : null,
  }));
}
