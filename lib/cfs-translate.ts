export const TRANSLATION_ORDER = [
  "Authentic Home Shirt",
  "Authentic Away Shirt",
  "Authentic Third Shirt",
  "Authentic Fourth Shirt",
  "Player Issue Home Shirt",
  "Player Issue Away Shirt",
  "Player Issue Third Shirt",
  "Home Shirt",
  "Away Shirt",
  "Third Shirt",
  "Fourth Shirt",
  "Anniversary Shirt",
  "Player Issue",
  "In Box",
  "L/S",
  "Authentic",
  "Anniversary",
  "Fourth",
  "Third",
  "Away",
  "Home",
  "Shirt",
] as const;

export type TermKey = (typeof TRANSLATION_ORDER)[number];

export function translateJerseyName(
  name: string,
  terms: Record<TermKey, string>
): string {
  let result = name;
  for (const key of TRANSLATION_ORDER) {
    const translated = terms[key];
    if (translated && translated !== key) {
      const escaped = key.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&");
      result = result.replace(new RegExp(`\\b${escaped}\\b`, "g"), translated);
    }
  }
  return result;
}
