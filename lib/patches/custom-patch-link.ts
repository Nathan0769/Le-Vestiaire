import type { Patch, PatchVersion } from "@prisma/client";
import { isJerseySeasonInPatchPeriod } from "./season-format";
import { findActiveVersion } from "./find-active-version";

interface LinkOccurrence {
  id: string;
  userJerseyId: string;
  existingPatchIds: string[];
}

/**
 * Répartit les patchs perso à rattacher entre mise à jour et suppression :
 * l'unique (userJerseyId, patchId) interdit deux lignes de la même cible sur un maillot.
 */
export function planCustomPatchLink(
  occurrences: LinkOccurrence[],
  targetPatchId: string
): { toUpdate: string[]; toDelete: string[] } {
  const servedJerseys = new Set(
    occurrences
      .filter((o) => o.existingPatchIds.includes(targetPatchId))
      .map((o) => o.userJerseyId)
  );
  const toUpdate: string[] = [];
  const toDelete: string[] = [];
  for (const o of occurrences) {
    if (servedJerseys.has(o.userJerseyId)) {
      toDelete.push(o.id);
    } else {
      servedJerseys.add(o.userJerseyId);
      toUpdate.push(o.id);
    }
  }
  return { toUpdate, toDelete };
}

/**
 * Calcule les clubs à ajouter pour que le patch rattaché reste visible (et décochable)
 * dans le formulaire utilisateur. Même règle que isClubEligible : la liste de la
 * version active prime si elle est non vide. Une liste vide signifie "tous les clubs",
 * on ne la touche jamais sous peine de restreindre le patch.
 */
export function computeEligibilityAdditions(
  patch: Patch & { versions: PatchVersion[] },
  occurrences: { clubId: string; season: string }[]
): {
  patchClubIds: string[] | null;
  versionUpdates: { versionId: string; clubIds: string[] }[];
} {
  const patchList = [...patch.eligibleClubIds];
  let patchChanged = false;
  const versionLists = new Map<string, string[]>();

  for (const { clubId, season } of occurrences) {
    // La version propre au club prime (badges par club), sinon la première de la saison.
    const activeVersion =
      findActiveVersion(patch.versions, season, clubId) ??
      patch.versions.find((v) =>
        isJerseySeasonInPatchPeriod(season, v.seasonStart, v.seasonEnd)
      );
    if (activeVersion && activeVersion.eligibleClubIds.length > 0) {
      const list =
        versionLists.get(activeVersion.id) ?? [...activeVersion.eligibleClubIds];
      if (!list.includes(clubId)) list.push(clubId);
      versionLists.set(activeVersion.id, list);
    } else if (patchList.length > 0 && !patchList.includes(clubId)) {
      patchList.push(clubId);
      patchChanged = true;
    }
  }

  const versionUpdates = patch.versions
    .filter((v) => {
      const list = versionLists.get(v.id);
      return list !== undefined && list.length > v.eligibleClubIds.length;
    })
    .map((v) => ({ versionId: v.id, clubIds: versionLists.get(v.id)! }));

  return { patchClubIds: patchChanged ? patchList : null, versionUpdates };
}
