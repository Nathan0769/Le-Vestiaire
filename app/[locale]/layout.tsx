import type { Metadata } from "next";
import ClientWrapper from "@/components/home/client-wrapper";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const localeMap: Record<string, string> = {
    fr: "fr_FR",
    en: "en_US",
    es: "es_ES",
  };

  const titles: Record<string, string> = {
    fr: "Le Vestiaire Foot - Gérez votre Collection de Maillots de Foot | Application Gratuite",
    en: "The Locker Room - Manage Your Football Jersey Collection | Free App",
    es: "El Vestuario - Gestiona tu Colección de Camisetas de Fútbol | App Gratuita",
  };

  const descriptions: Record<string, string> = {
    fr: "Cataloguez et gérez votre collection de maillots de football gratuitement. Créez votre wishlist à partager, identifiez les vrais des faux, et rejoignez une communauté de collectionneurs passionnés.",
    en: "Catalog and manage your football jersey collection for free. Create your shareable wishlist, authenticate real from fake, and join a passionate community of collectors.",
    es: "Cataloga y gestiona tu colección de camisetas de fútbol gratis. Crea tu lista de deseos para compartir, identifica las auténticas, y únete a una comunidad apasionada de coleccionistas.",
  };

  return {
    title: titles[locale] || titles.fr,
    description: descriptions[locale] || descriptions.fr,
    authors: [{ name: "Le Vestiaire" }],
    creator: "Le Vestiaire",
    publisher: "Le Vestiaire",
    metadataBase: new URL("https://le-vestiaire-foot.fr"),
    alternates: {
      canonical: `https://le-vestiaire-foot.fr/${locale}`,
      languages: {
        fr: "https://le-vestiaire-foot.fr/fr",
        en: "https://le-vestiaire-foot.fr/en",
        es: "https://le-vestiaire-foot.fr/es",
      },
    },
    openGraph: {
      title: titles[locale] || titles.fr,
      description: descriptions[locale] || descriptions.fr,
      url: `https://le-vestiaire-foot.fr/${locale}`,
      siteName: "Le Vestiaire",
      images: [
        {
          url: "https://le-vestiaire-foot.fr/icon.png",
          width: 1200,
          height: 630,
          alt: "Le Vestiaire Foot",
        },
      ],
      locale: localeMap[locale] || "fr_FR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: titles[locale] || titles.fr,
      description: descriptions[locale] || descriptions.fr,
      images: ["https://le-vestiaire-foot.fr/icon.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ClientWrapper>{children}</ClientWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
