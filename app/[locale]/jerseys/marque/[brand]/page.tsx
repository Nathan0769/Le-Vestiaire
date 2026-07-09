import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getTranslations, getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { BrandHubView } from "@/components/jerseys/brand/brand-hub-view";
import {
  SUPPORTED_BRAND_SLUGS,
  getBrandVariants,
  slugToBrand,
} from "@/lib/brand-utils";

export const revalidate = 3600;

const SUPPORTED_LOCALES = ["fr", "en", "es", "de", "pt", "nl", "it"];

function buildBrandLanguageAlternates(brandSlug: string) {
  const base = `https://le-vestiaire-foot.fr`;
  const path = `/jerseys/marque/${brandSlug}`;
  return SUPPORTED_LOCALES.reduce<Record<string, string>>((acc, l) => {
    acc[l] = l === "fr" ? `${base}${path}` : `${base}/${l}${path}`;
    return acc;
  }, {});
}

type Props = {
  params: Promise<{
    brand: string;
  }>;
};

const getCachedBrandData = cache(async (brandSlug: string) => {
  const canonical = slugToBrand(brandSlug);
  if (!canonical) return null;

  const variants = getBrandVariants(brandSlug);

  const jerseys = await prisma.jersey.findMany({
    where: { brand: { in: variants } },
    orderBy: [{ season: "desc" }, { clubId: "asc" }],
    select: {
      id: true,
      name: true,
      imageUrl: true,
      type: true,
      slug: true,
      season: true,
      variant: true,
      club: {
        select: {
          id: true,
          name: true,
          shortName: true,
          logoUrl: true,
          primaryColor: true,
          leagueId: true,
        },
      },
    },
  });

  const clubIds = new Set(jerseys.map((j) => j.club.id));
  const seasons = new Set(jerseys.map((j) => j.season));

  const jerseysBySeasonMap = new Map<string, typeof jerseys>();
  for (const jersey of jerseys) {
    const bucket = jerseysBySeasonMap.get(jersey.season) ?? [];
    bucket.push(jersey);
    jerseysBySeasonMap.set(jersey.season, bucket);
  }

  const jerseysBySeason = [...jerseysBySeasonMap.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([season, jerseys]) => ({ season, jerseys }));

  return {
    canonicalBrand: canonical,
    jerseyCount: jerseys.length,
    clubCount: clubIds.size,
    seasonCount: seasons.size,
    jerseysBySeason,
  };
});

export function generateStaticParams() {
  return SUPPORTED_BRAND_SLUGS.map((brand) => ({ brand }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand: brandSlug } = await params;
  const locale = await getLocale();
  const tMeta = await getTranslations("BrandPageMetadata");

  const data = await getCachedBrandData(brandSlug);

  if (!data) {
    return {
      title: tMeta("notFoundTitle"),
    };
  }

  const title = tMeta("title", { brand: data.canonicalBrand });
  const description = tMeta("description", {
    brand: data.canonicalBrand,
    jerseyCount: data.jerseyCount,
    clubCount: data.clubCount,
    seasonCount: data.seasonCount,
  });

  const canonicalPath = `/jerseys/marque/${brandSlug}`;
  const canonicalUrl =
    locale === "fr"
      ? `https://le-vestiaire-foot.fr${canonicalPath}`
      : `https://le-vestiaire-foot.fr/${locale}${canonicalPath}`;

  return {
    title,
    description,
    openGraph: {
      title: tMeta("ogTitle", { brand: data.canonicalBrand }),
      description,
      url: canonicalUrl,
      siteName: "Le Vestiaire Foot",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: tMeta("ogTitle", { brand: data.canonicalBrand }),
      description,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: buildBrandLanguageAlternates(brandSlug),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function BrandPage({ params }: Props) {
  const { brand: brandSlug } = await params;

  const data = await getCachedBrandData(brandSlug);

  if (!data) return notFound();

  const tBreadcrumb = await getTranslations("BreadcrumbLabels");

  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: tBreadcrumb("jerseys"),
            url: "https://le-vestiaire-foot.fr/jerseys",
          },
          {
            name: tBreadcrumb("brand"),
            url: "https://le-vestiaire-foot.fr/jerseys",
          },
          {
            name: data.canonicalBrand,
            url: `https://le-vestiaire-foot.fr/jerseys/marque/${brandSlug}`,
          },
        ]}
      />
      <BrandHubView
        brand={data.canonicalBrand}
        jerseyCount={data.jerseyCount}
        clubCount={data.clubCount}
        seasonCount={data.seasonCount}
        jerseysBySeason={data.jerseysBySeason}
      />
    </>
  );
}
