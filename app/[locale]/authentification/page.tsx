import { Shield } from "lucide-react";
import { BrandGrid } from "@/components/authentification/brand-grid";
import { getBrands } from "@/lib/authentication-content";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Authentication");

  return {
    title: t("title"),
    description: t("subtitle"),
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
      url: "https://le-vestiaire-foot.fr/authentification",
      siteName: "Le Vestiaire Foot",
      type: "website",
      images: [
        {
          url: "https://le-vestiaire-foot.fr/icon.png",
          width: 1200,
          height: 630,
          alt: t("title"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("subtitle"),
    },
    alternates: {
      canonical: "https://le-vestiaire-foot.fr/authentification",
    },
  };
}

export default async function AuthentificationPage() {
  const t = await getTranslations("Authentication");
  const tPage = await getTranslations("Authentication.page");
  const brands = await getBrands();

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">{t("title")}</h1>
        </div>
        <p className="text-md text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {tPage("protectInvestment.title")}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {tPage("protectInvestment.description")}
            </p>
          </div>
        </div>
      </div>

      <BrandGrid brands={brands} />

      <div className="bg-muted/50 rounded-lg p-6 space-y-3">
        <h2 className="font-semibold text-lg">
          {tPage("whyImportant.title")}
        </h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>{tPage("whyImportant.reason1")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>{tPage("whyImportant.reason2")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>{tPage("whyImportant.reason3")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>{tPage("whyImportant.reason4")}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
