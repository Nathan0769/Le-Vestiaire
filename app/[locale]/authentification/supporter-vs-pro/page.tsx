import Link from "next/link";
import { ComparisonGuide } from "@/components/authentification/comparison-guide";
import { getSupporterVsProGuide } from "@/lib/authentication-content";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const guide = await getSupporterVsProGuide();

  return {
    title: guide.title,
    description: guide.description,
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: "https://le-vestiaire-foot.fr/authentification/supporter-vs-pro",
      siteName: "Le Vestiaire Foot",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.description,
    },
    alternates: {
      canonical: "https://le-vestiaire-foot.fr/authentification/supporter-vs-pro",
    },
  };
}

export default async function SupporterVsProPage() {
  const guide = await getSupporterVsProGuide();
  const t = await getTranslations("Authentication");

  return (
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
            <BreadcrumbPage className="truncate">{guide.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="max-w-full overflow-hidden">
        <ComparisonGuide guide={guide} />
      </div>
    </div>
  );
}
