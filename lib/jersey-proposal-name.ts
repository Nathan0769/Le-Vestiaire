import type { JerseyType } from "@prisma/client";
import frMessages from "@/messages/fr.json";

interface FrenchJerseyNameInput {
  clubShortName: string;
  type: JerseyType;
  season: string;
  specialName?: string | null;
}

/**
 * Nom canonique d'un maillot, toujours en français.
 * Jersey.name est la version FR (translateJerseyName la renvoie telle quelle
 * en FR et régénère les autres langues) : le construire côté serveur évite
 * qu'une proposition faite en espagnol enregistre "Camiseta ...".
 */
export function buildFrenchJerseyName({
  clubShortName,
  type,
  season,
  specialName,
}: FrenchJerseyNameInput): string {
  const labels = frMessages.JerseyType as Record<string, string>;
  const typeLabel =
    type === "SPECIAL"
      ? specialName?.trim() || labels.SPECIAL
      : labels[type] ?? type;

  return `Maillot ${typeLabel} ${clubShortName} ${season}`;
}
