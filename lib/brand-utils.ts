export const SUPPORTED_BRAND_SLUGS = ["nike", "adidas", "puma"] as const;

export type SupportedBrandSlug = (typeof SUPPORTED_BRAND_SLUGS)[number];

const CANONICAL_BRAND_BY_SLUG: Record<SupportedBrandSlug, string> = {
  nike: "Nike",
  adidas: "Adidas",
  puma: "Puma",
};

const BRAND_VARIANTS_BY_SLUG: Record<SupportedBrandSlug, string[]> = {
  nike: ["Nike", "NIKE", "nike"],
  adidas: ["Adidas", "ADIDAS", "adidas"],
  puma: ["Puma", "PUMA", "puma"],
};

export function normalizeBrand(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function brandToSlug(brand: string): string {
  return brand
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

export function isSupportedBrand(slug: string): slug is SupportedBrandSlug {
  return (SUPPORTED_BRAND_SLUGS as readonly string[]).includes(slug);
}

export function slugToBrand(slug: string): string | null {
  if (!isSupportedBrand(slug)) return null;
  return CANONICAL_BRAND_BY_SLUG[slug];
}

export function getBrandVariants(slug: string): string[] {
  if (!isSupportedBrand(slug)) return [];
  return BRAND_VARIANTS_BY_SLUG[slug];
}
