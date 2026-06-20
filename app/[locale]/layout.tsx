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
    de: "de_DE",
    pt: "pt_PT",
    nl: "nl_NL",
  };

  const titles: Record<string, string> = {
    fr: "Le Vestiaire Foot - Gérez votre Collection de Maillots de Foot | Application Gratuite",
    en: "The Locker Room - Manage Your Football Jersey Collection | Free App",
    es: "El Vestuario - Gestiona tu Colección de Camisetas de Fútbol | App Gratuita",
    de: "Le Vestiaire Foot - Verwalte deine Fußballtrikot-Sammlung | Kostenlose App",
    pt: "Le Vestiaire Foot - Gere a tua Coleção de Camisolas de Futebol | App Gratuita",
    nl: "Le Vestiaire Foot - Beheer je Voetbalshirts Collectie | Gratis App",
  };

  const descriptions: Record<string, string> = {
    fr: "Cataloguez et gérez votre collection de maillots de football gratuitement. Créez votre wishlist à partager, identifiez les vrais des faux, et rejoignez une communauté de collectionneurs passionnés.",
    en: "Catalog and manage your football jersey collection for free. Create your shareable wishlist, authenticate real from fake, and join a passionate community of collectors.",
    es: "Cataloga y gestiona tu colección de camisetas de fútbol gratis. Crea tu lista de deseos para compartir, identifica las auténticas, y únete a una comunidad apasionada de coleccionistas.",
    de: "Katalogisiere und verwalte deine Fußballtrikot-Sammlung kostenlos. Erstelle eine teilbare Wunschliste, erkenne Fälschungen und tritt einer leidenschaftlichen Sammlergemeinschaft bei.",
    pt: "Cataloga e gere a tua coleção de camisolas de futebol gratuitamente. Cria a tua lista de desejos partilhável, autentica camisolas e junta-te a uma comunidade apaixonada de colecionadores.",
    nl: "Catalogiseer en beheer je voetbalshirts-collectie gratis. Maak je deelbare verlanglijst, herken echte van valse shirts en sluit je aan bij een gepassioneerde community van verzamelaars.",
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
        de: "https://le-vestiaire-foot.fr/de",
        pt: "https://le-vestiaire-foot.fr/pt",
        nl: "https://le-vestiaire-foot.fr/nl",
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
    other: {
      "google-adsense-account": "ca-pub-1296292175464272",
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

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Le Vestiaire Foot",
    url: "https://le-vestiaire-foot.fr",
    logo: "https://le-vestiaire-foot.fr/icon.png",
    sameAs: [],
    description:
      "Application gratuite pour gérer et partager votre collection de maillots de football.",
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Le Vestiaire Foot",
    url: "https://le-vestiaire-foot.fr",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate:
          "https://le-vestiaire-foot.fr/jerseys?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <NextIntlClientProvider messages={messages}>
          <ClientWrapper>{children}</ClientWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
