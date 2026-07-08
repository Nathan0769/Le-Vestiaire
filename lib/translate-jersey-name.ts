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
 * Traduit le nom d'un maillot selon la locale.
 * FR utilise le nom de la DB (deja en francais). Les autres locales
 * generent un nom SEO-friendly avec la convention locale du mot maillot.
 */
export function translateJerseyName({
  jersey,
  locale,
  typeTranslation,
}: TranslateJerseyNameOptions): string {
  switch (locale) {
    case "fr":
      return jersey.name;
    case "en":
      return `${jersey.clubShortName} ${typeTranslation} Jersey ${jersey.season}`;
    case "es":
      return `Camiseta ${typeTranslation} ${jersey.clubShortName} ${jersey.season}`;
    case "de":
      return `${jersey.clubShortName} ${typeTranslation} Trikot ${jersey.season}`;
    case "it":
      return `Maglia ${typeTranslation} ${jersey.clubShortName} ${jersey.season}`;
    case "nl":
      return `${jersey.clubShortName} ${typeTranslation} Shirt ${jersey.season}`;
    case "pt":
      return `Camisola ${typeTranslation} ${jersey.clubShortName} ${jersey.season}`;
    default:
      return jersey.name;
  }
}
