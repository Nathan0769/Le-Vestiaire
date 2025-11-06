import type { JerseyType } from "@/types/jersey";

interface JerseyNameData {
  name: string;
  type: JerseyType;
  season: string;
  clubShortName: string;
}

interface TranslateJerseyNameOptions {
  jersey: JerseyNameData;
  locale: string;
  typeTranslation: string;
}

/**
 * Traduit le nom d'un maillot selon la locale
 * FR : Utilise le nom de la DB (déjà en français)
 * EN : Génère "PSG Home Jersey 2024-25"
 * ES : Génère "Camiseta Local PSG 2024-25"
 */
export function translateJerseyName({
  jersey,
  locale,
  typeTranslation,
}: TranslateJerseyNameOptions): string {
  if (locale === "fr") {
    return jersey.name;
  }

  if (locale === "en") {
    return `${jersey.clubShortName} ${typeTranslation} Jersey ${jersey.season}`;
  }

  if (locale === "es") {
    return `Camiseta ${typeTranslation} ${jersey.clubShortName} ${jersey.season}`;
  }

  return jersey.name;
}
