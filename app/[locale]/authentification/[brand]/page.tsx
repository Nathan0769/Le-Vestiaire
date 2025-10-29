import { notFound } from "next/navigation";
import Link from "next/link";
import { BrandGuideComponent } from "@/components/authentification/brand-guide";
import { ScanPlaceholder } from "@/components/authentification/scan-placeholder";
import { SchemaMarkup } from "@/components/authentification/schema-markup";
import { getBrandGuide, getBrandInfo } from "@/lib/authentication-content";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { Metadata } from "next";

interface BrandPageProps {
  params: Promise<{
    brand: string;
  }>;
}

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { brand } = await params;
  const brandInfo = getBrandInfo(brand);

  if (!brandInfo) {
    return {
      title: "Marque introuvable - Le Vestiaire",
    };
  }

  const brandDescriptions: Record<string, string> = {
    adidas:
      "Guide complet pour authentifier un maillot Adidas. Vérifiez le code produit, l'étiquette boutique, le code-barres et repérez les signes de contrefaçon. Méthode détaillée avec exemples visuels.",
    nike: "Apprenez à reconnaître un vrai maillot Nike : code produit, code de production, étiquette boutique, swing tag et étiquette de sécurité. Guide complet anti-contrefaçon avec photos comparatives.",
    puma: "Authentification maillot Puma : code produit, date de production, QR code, étiquette de sécurité. Reconnaissez le 'Fat Cat' et autres signes de faux maillot Puma.",
    hummel:
      "Guide d'authentification pour maillots Hummel : chevrons caractéristiques, étiquettes, qualité textile et finitions. Évitez les contrefaçons.",
  };

  const brandKeywords: Record<string, string[]> = {
    adidas: [
      "authentification maillot adidas",
      "code produit adidas",
      "faux maillot adidas",
      "vérifier maillot adidas",
      "étiquette adidas authentique",
      "code barres maillot adidas",
      "contrefaçon adidas",
    ],
    nike: [
      "authentification maillot nike",
      "code produit nike",
      "faux maillot nike",
      "swing tag nike",
      "vérifier maillot nike",
      "étiquette de sécurité nike",
      "code de production nike",
    ],
    puma: [
      "authentification maillot puma",
      "code produit puma",
      "faux maillot puma",
      "fat cat puma",
      "QR code maillot puma",
      "vérifier maillot puma",
      "étiquette puma",
    ],
    hummel: [
      "authentification maillot hummel",
      "chevrons hummel",
      "faux maillot hummel",
      "vérifier maillot hummel",
    ],
  };

  return {
    title: `Authentifier un Maillot ${brandInfo.name} - Guide Complet`,
    description:
      brandDescriptions[brand] ||
      `Guide complet pour vérifier l'authenticité d'un maillot ${brandInfo.name}. Critères détaillés et conseils d'experts.`,
    keywords: brandKeywords[brand] || [],

    openGraph: {
      title: `Guide Authentification Maillot ${brandInfo.name}`,
      description:
        brandDescriptions[brand] ||
        `Apprenez à reconnaître un vrai maillot ${brandInfo.name} d'une contrefaçon`,
      url: `https://le-vestiaire-foot.fr/authentification/${brand}`,
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

    // ✅ SEO : Twitter Card
    twitter: {
      card: "summary_large_image",
      title: `Comment Authentifier un Maillot ${brandInfo.name}`,
      description:
        brandDescriptions[brand]?.slice(0, 150) ||
        `Guide complet ${brandInfo.name}`,
    },

    // ✅ SEO : Canonical URL
    alternates: {
      canonical: `https://le-vestiaire-foot.fr/authentification/${brand}`,
    },
  };
}

export default async function BrandAuthPage({ params }: BrandPageProps) {
  const { brand } = await params;
  const guide = getBrandGuide(brand);
  const brandInfo = getBrandInfo(brand);

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
                <Link href="/authentification">Authentification</Link>
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

        <div className="max-w-full overflow-hidden">
          <BrandGuideComponent guide={guide} />
        </div>

        {guide.scanAvailable && (
          <div className="pt-8 max-w-full overflow-hidden">
            <ScanPlaceholder brand={brandInfo.name} />
          </div>
        )}
      </div>
    </>
  );
}
