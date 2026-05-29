import { Locale, useTranslations } from "next-intl";
import { jerseyTypeLabel } from "@/lib/jersey-utils";

/**
 * Hook to translate jersey types
 * Usage: const jerseyType = useJerseyTypeTranslation();
 *        jerseyType('HOME') // returns "Domicile"
 *        jerseyType('GOALKEEPER', 2) // returns "Gardien 2"
 */
export function useJerseyTypeTranslation() {
  const t = useTranslations("JerseyType");
  return (type: string, variant: number = 1) =>
    jerseyTypeLabel(t(type as Locale), type, variant);
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
