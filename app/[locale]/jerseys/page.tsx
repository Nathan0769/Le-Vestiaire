import prisma from "@/lib/prisma";
import { LeaguesPageClient } from "@/components/jerseys/leagues/leagues-page-client";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { getTranslations, getLocale } from "next-intl/server";
import type { Metadata } from "next";

export const revalidate = 300;

const SUPPORTED_LOCALES = ["fr", "en", "es", "de", "pt", "nl", "it"];

const OG_LOCALES: Record<string, string> = {
  fr: "fr_FR",
  en: "en_US",
  es: "es_ES",
  de: "de_DE",
  pt: "pt_PT",
  nl: "nl_NL",
  it: "it_IT",
};

function buildCatalogueLanguageAlternates() {
  const base = `https://le-vestiaire-foot.fr`;
  return SUPPORTED_LOCALES.reduce<Record<string, string>>((acc, l) => {
    acc[l] = l === "fr" ? `${base}/jerseys` : `${base}/${l}/jerseys`;
    return acc;
  }, {});
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const tMeta = await getTranslations("CatalogueMetadata");

  const title = tMeta("title");
  const description = tMeta("description");
  const ogTitle = tMeta("ogTitle");

  const canonicalUrl =
    locale === "fr"
      ? "https://le-vestiaire-foot.fr/jerseys"
      : `https://le-vestiaire-foot.fr/${locale}/jerseys`;

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description,
      url: canonicalUrl,
      siteName: "Le Vestiaire Foot",
      type: "website",
      locale: OG_LOCALES[locale] ?? "fr_FR",
      images: [
        {
          url: "https://le-vestiaire-foot.fr/icon.png",
          width: 1200,
          height: 630,
          alt: "Le Vestiaire Foot",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: ["https://le-vestiaire-foot.fr/icon.png"],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: buildCatalogueLanguageAlternates(),
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

export default async function MaillotsPage() {
  const [leagues, tBreadcrumb] = await Promise.all([
    prisma.league.findMany({
      orderBy: [{ tier: "asc" }, { name: "asc" }],
    }),
    getTranslations("BreadcrumbLabels"),
  ]);

  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: tBreadcrumb("jerseys"),
            url: "https://le-vestiaire-foot.fr/jerseys",
          },
        ]}
      />
      <LeaguesPageClient leagues={leagues} />
    </>
  );
}
