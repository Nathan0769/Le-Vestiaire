import { getTranslations } from "next-intl/server";
import type { BrandInfo, BrandGuide, Brand } from "@/types/authentication";

const BRAND_STATIC_DATA: Record<
  Brand,
  { logo: string; logoDark: string; color: string; scanAvailable: boolean }
> = {
  adidas: {
    logo: "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/adidas/logo.png",
    logoDark:
      "https://pub-353e86db8bfc403e8d260aa85ded29c8.r2.dev/adidas/logo-white-2.webp",
    color: "#000000",
    scanAvailable: false,
  },
  nike: {
    logo: "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/nike/logo.png",
    logoDark:
      "https://pub-353e86db8bfc403e8d260aa85ded29c8.r2.dev/nike/logo-white.webp",
    color: "#FF3B00",
    scanAvailable: false,
  },
  puma: {
    logo: "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/puma/logo.png",
    logoDark:
      "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/puma/logo-white.png",
    color: "#000000",
    scanAvailable: false,
  },
  hummel: {
    logo: "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/hummel/logo.png",
    logoDark:
      "https://hioeyddfdoekpplonsxa.supabase.co/storage/v1/object/public/brand/hummel/logo-white.png",
    color: "#003DA5",
    scanAvailable: false,
  },
};

export const BRAND_IDS: Brand[] = ["adidas", "nike", "puma", "hummel"];

export async function getBrands(): Promise<BrandInfo[]> {
  const t = await getTranslations("Authentication.brands");

  return BRAND_IDS.map((brandId) => ({
    id: brandId,
    name: t(`${brandId}.name`),
    description: t(`${brandId}.description`),
    logo: BRAND_STATIC_DATA[brandId].logo,
    logoDark: BRAND_STATIC_DATA[brandId].logoDark,
    color: BRAND_STATIC_DATA[brandId].color,
  }));
}

export async function getBrandInfo(brand: string): Promise<BrandInfo | null> {
  if (!BRAND_IDS.includes(brand as Brand)) {
    return null;
  }

  const t = await getTranslations("Authentication.brands");

  return {
    id: brand as Brand,
    name: t(`${brand}.name`),
    description: t(`${brand}.description`),
    logo: BRAND_STATIC_DATA[brand as Brand].logo,
    logoDark: BRAND_STATIC_DATA[brand as Brand].logoDark,
    color: BRAND_STATIC_DATA[brand as Brand].color,
  };
}

export async function getBrandGuide(brand: string): Promise<BrandGuide | null> {
  if (!BRAND_IDS.includes(brand as Brand)) {
    return null;
  }

  const t = await getTranslations(`Authentication.${brand}`);

  const criteriaRaw = t.raw("criteria") as Record<
    string,
    {
      title: string;
      description: string;
      points: Record<string, string>;
    }
  >;

  const criteria = Object.keys(criteriaRaw)
    .sort((a, b) => {
      const numA = parseInt(a.replace("step", ""));
      const numB = parseInt(b.replace("step", ""));
      return numA - numB;
    })
    .map((stepKey) => {
      const step = criteriaRaw[stepKey];

      const points = Object.values(step.points);

      return {
        title: step.title,
        description: step.description,
        points,
      };
    });

  const commonFakesRaw = t.raw("commonFakes") as Record<string, string>;
  const commonFakes = Object.values(commonFakesRaw);

  const tipsRaw = t.raw("tips") as Record<string, string>;
  const tips = Object.values(tipsRaw);

  return {
    brand: brand as Brand,
    title: t("title"),
    description: t("description"),
    scanAvailable: BRAND_STATIC_DATA[brand as Brand].scanAvailable,
    criteria,
    commonFakes,
    tips,
  };
}

export async function getSupporterVsProGuide() {
  const t = await getTranslations("Authentication.supporterVsPro");

  const base = process.env.CLOUDFLARE_R2_GUIDES_PUBLIC_URL?.replace(/\/$/, "");
  const img = (path: string) => (base ? `${base}/${path}` : undefined);

  const images: Record<string, { supporter?: string; pro?: string }> = {
    logo: {
      supporter: img("supporter-vs-pro/logo/supporteur.jpeg"),
      pro: img("supporter-vs-pro/logo/pro.jpeg"),
    },
    marque: {
      supporter: img("supporter-vs-pro/marque/supporteur.jpeg"),
      pro: img("supporter-vs-pro/marque/pro.jpeg"),
    },
    technology1: {
      supporter: img("supporter-vs-pro/technology1/supporteur.jpeg"),
      pro: img("supporter-vs-pro/technology1/pro.jpeg"),
    },
    technology2: {
      supporter: img("supporter-vs-pro/technology2/supporteur.jpeg"),
      pro: img("supporter-vs-pro/technology2/pro.jpeg"),
    },
    detail1: {
      supporter: img("supporter-vs-pro/detail1/supporteur.jpeg"),
      pro: img("supporter-vs-pro/detail1/pro.jpeg"),
    },
    detail2: {
      supporter: img("supporter-vs-pro/detail2/supporteur.jpeg"),
      pro: img("supporter-vs-pro/detail2/pro.jpeg"),
    },
    detail3: {
      supporter: img("supporter-vs-pro/detail3/supporteur.jpeg"),
      pro: img("supporter-vs-pro/detail3/pro.jpeg"),
    },
  };

  const comparisonsRaw = t.raw("comparisons") as Record<
    string,
    { title: string; description?: string; supporter: string; pro: string }
  >;

  const comparisons = Object.entries(comparisonsRaw).map(([key, point]) => ({
    ...point,
    supporterImage: images[key]?.supporter,
    proImage: images[key]?.pro,
  }));

  return {
    title: t("title"),
    description: t("description"),
    context: t("context"),
    supporterFullImage: img("supporter-vs-pro/full/supporteur.jpeg"),
    proFullImage: img("supporter-vs-pro/full/pro.jpeg"),
    comparisons,
  };
}

export const BRANDS = BRAND_IDS.map((brandId) => ({
  id: brandId,
  name: brandId.charAt(0).toUpperCase() + brandId.slice(1),
  description: "",
  logo: BRAND_STATIC_DATA[brandId].logo,
  logoDark: BRAND_STATIC_DATA[brandId].logoDark,
  color: BRAND_STATIC_DATA[brandId].color,
}));
