import frMessages from "@/messages/fr.json";
import { resolveAchievementI18n } from "./render";
import { getBadgeUrl } from "./badge-url";

type Json = Record<string, unknown>;

function getNested(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, k) => {
    if (acc && typeof acc === "object") return (acc as Json)[k];
    return undefined;
  }, obj);
}

function interpolate(
  template: string,
  params: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] != null ? String(params[k]) : `{${k}}`,
  );
}

/**
 * Résout le titre + description FR d'un succès (pour l'app mobile, FR only).
 * Le web garde sa résolution client-side par locale ; ces champs sont ajoutés
 * au payload feed et ignorés par le web.
 */
export function resolveAchievementText(
  key: string,
  metadata?: Record<string, unknown> | null,
): { title: string; description: string; badgeUrl: string | null } {
  const { i18nKey, params } = resolveAchievementI18n(key, metadata, "fr");
  const node = getNested(frMessages, i18nKey) as Json | undefined;
  const rawTitle = typeof node?.title === "string" ? node.title : key;
  const rawDesc = typeof node?.description === "string" ? node.description : "";
  return {
    title: interpolate(rawTitle, params),
    description: interpolate(rawDesc, params),
    badgeUrl: getBadgeUrl(key),
  };
}
