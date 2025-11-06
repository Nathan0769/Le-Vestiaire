import { useLocale, useTranslations } from "next-intl";
import { translateJerseyName } from "@/lib/translate-jersey-name";
import type { JerseyType } from "@/types/jersey";

interface JerseyData {
  name: string;
  type: JerseyType;
  season: string;
  club: {
    shortName: string;
  };
}

/**
 * Hook pour traduire un nom de maillot dans les client components
 * Utilise automatiquement la locale et les traductions actives
 */
export function useTranslatedJerseyName(jersey: JerseyData): string {
  const locale = useLocale();
  const tJerseyType = useTranslations("JerseyType");

  return translateJerseyName({
    jersey: {
      name: jersey.name,
      type: jersey.type,
      season: jersey.season,
      clubShortName: jersey.club.shortName,
    },
    locale,
    typeTranslation: tJerseyType(jersey.type),
  });
}
