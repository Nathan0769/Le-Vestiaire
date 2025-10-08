import { notFound } from "next/navigation";
import Link from "next/link";
//import { ArrowLeft } from "lucide-react";
//import { Button } from "@/components/ui/button";
import { BrandGuideComponent } from "@/components/authentification/brand-guide";
import { ScanPlaceholder } from "@/components/authentification/scan-placeholder";
import { getBrandGuide, getBrandInfo } from "@/lib/authentication-content";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BrandPageProps {
  params: Promise<{
    brand: string;
  }>;
}

export async function generateMetadata({ params }: BrandPageProps) {
  const { brand } = await params;
  const brandInfo = getBrandInfo(brand);

  if (!brandInfo) {
    return {
      title: "Marque introuvable - Le Vestiaire",
    };
  }

  return {
    title: `Authentification ${brandInfo.name} - Le Vestiaire`,
    description: `Guide complet pour vérifier l'authenticité d'un maillot ${brandInfo.name}. Critères détaillés et conseils d'experts.`,
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
    <div className="p-6 space-y-8 overflow-x-hidden max-w-full">
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

      {/* Bouton retour 
      <Button variant="ghost" asChild>
        <Link href="/authentification" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Retour aux marques
        </Link>
      </Button>*/}

      <div className="max-w-full overflow-hidden">
        <BrandGuideComponent guide={guide} />
      </div>

      {guide.scanAvailable && (
        <div className="pt-8 max-w-full overflow-hidden">
          <ScanPlaceholder brand={brandInfo.name} />
        </div>
      )}
    </div>
  );
}
