import type { UserPlan } from "@prisma/client";

/**
 * Source de vérité de l'état "Supporter".
 * Un utilisateur est supporter si et seulement si son plan est PRO.
 * (La valeur d'enum reste PRO en base pour éviter un rename cassant ; le libellé
 * "Supporter" est purement présentationnel côté UI.)
 * Les cosmétiques ne doivent être rendus que si cette fonction retourne true,
 * ce qui masque automatiquement les cosmétiques après un downgrade.
 */
export function isSupporter(
  user: { plan: UserPlan } | null | undefined
): boolean {
  return user?.plan === "PRO";
}
