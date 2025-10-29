import { Locale, useTranslations } from "next-intl";

/**
 * Hook to translate jersey types
 * Usage: const jerseyType = useJerseyTypeTranslation();
 *        jerseyType('HOME') // returns "Domicile" in FR, "Home" in EN, etc.
 */
export function useJerseyTypeTranslation() {
  const t = useTranslations("JerseyType");
  return (type: string) => t(type as Locale);
}

/**
 * Hook to translate sizes
 * Usage: const size = useSizeTranslation();
 *        size('M') // returns "M"
 */
export function useSizeTranslation() {
  const t = useTranslations("Size");
  return (size: string) => t(size as Locale);
}

/**
 * Hook to translate conditions
 * Usage: const condition = useConditionTranslation();
 *        condition('MINT') // returns "Neuf" in FR, "Mint" in EN, etc.
 */
export function useConditionTranslation() {
  const t = useTranslations("Condition");
  return (condition: string) => t(condition as Locale);
}
