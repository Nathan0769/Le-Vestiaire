import { notFound } from "next/navigation";
import Link from "next/link";
import { BrandGuideComponent } from "@/components/authentification/brand-guide";
import { ScanPlaceholder } from "@/components/authentification/scan-placeholder";
import { SchemaMarkup } from "@/components/authentification/schema-markup";
import { getBrandGuide, getBrandInfo } from "@/lib/authentication-content";
import { AdBanner } from "@/components/authentification/ad-banner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getTranslations, getLocale } from "next-intl/server";
import type { Metadata } from "next";

const SUPPORTED_LOCALES = ["fr", "en", "es", "de", "pt", "nl", "it"];

function buildBrandLanguageAlternates(brand: string) {
  const base = `https://le-vestiaire-foot.fr`;
  const path = `/authentification/${brand}`;
  return SUPPORTED_LOCALES.reduce<Record<string, string>>((acc, l) => {
    acc[l] = l === "fr" ? `${base}${path}` : `${base}/${l}${path}`;
    return acc;
  }, {});
}

interface BrandPageProps {
  params: Promise<{
    brand: string;
  }>;
}

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { brand } = await params;
  const brandInfo = await getBrandInfo(brand);
  const t = await getTranslations("Authentication.metadata");
  const locale = await getLocale();

  if (!brandInfo) {
    return {
      title: t("notFound"),
    };
  }

  const description = t(`${brand}.description`);
  const ogDescription = t(`${brand}.ogDescription`);
  const title = t.has(`${brand}.title`)
    ? t(`${brand}.title`)
    : t("titleTemplate", { brand: brandInfo.name });

  const canonicalPath = `/authentification/${brand}`;
  const canonicalUrl =
    locale === "fr"
      ? `https://le-vestiaire-foot.fr${canonicalPath}`
      : `https://le-vestiaire-foot.fr/${locale}${canonicalPath}`;

  return {
    title,
    description,

    openGraph: {
      title: t("ogTitleTemplate", { brand: brandInfo.name }),
      description: ogDescription,
      url: canonicalUrl,
      siteName: "Le Vestiaire Foot",
      type: "article",
      images: [
        {
          url: brandInfo.logo,
          width: 800,
          height: 600,
          alt: `Logo ${brandInfo.name}`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: t("twitterTitleTemplate", { brand: brandInfo.name }),
      description: description.slice(0, 150),
    },

    alternates: {
      canonical: canonicalUrl,
      languages: buildBrandLanguageAlternates(brand),
    },
  };
}

export default async function BrandAuthPage({ params }: BrandPageProps) {
  const { brand } = await params;
  const guide = await getBrandGuide(brand);
  const brandInfo = await getBrandInfo(brand);
  const t = await getTranslations("Authentication");

  if (!guide || !brandInfo) {
    notFound();
  }

  return (
    <>
      <SchemaMarkup guide={guide} brandName={brandInfo.name} />

      <div className="p-4 md:p-6 space-y-8 overflow-x-hidden max-w-full">
        <Breadcrumb>
          <BreadcrumbList className="flex-wrap">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/authentification">{t("title")}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate">
                {brandInfo.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <AdBanner slot="8589608513" />

        <div className="max-w-full overflow-hidden">
          <BrandGuideComponent guide={guide} />
        </div>

        <AdBanner slot="8589608513" />

        {guide.scanAvailable && (
          <div className="pt-8 max-w-full overflow-hidden">
            <ScanPlaceholder brand={brandInfo.name} />
          </div>
        )}

        <AdBanner slot="8589608513" />
      </div>
    </>
  );
}
