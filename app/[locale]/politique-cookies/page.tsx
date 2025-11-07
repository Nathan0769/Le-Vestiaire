import { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getLegalContent } from "@/lib/legal-content";
import { MarkdownRenderer } from "@/components/legal/markdown-renderer";

export const metadata: Metadata = {
  title: "Politique de Cookies - Le Vestiaire Foot",
  description:
    "Découvrez comment Le Vestiaire utilise les cookies pour améliorer votre expérience.",
  robots: "noindex, follow",
};

interface PolitiqueCookiesPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function PolitiqueCookiesPage({
  params,
}: PolitiqueCookiesPageProps) {
  const { locale } = await params;
  const t = await getTranslations("LegalPages");
  const content = getLegalContent(locale, 'politique-cookies');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <MarkdownRenderer content={content} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-8">
        <Link
          href="/"
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/70 transition-colors inline-flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          {t("backToHome")}
        </Link>
      </div>
    </div>
  );
}
