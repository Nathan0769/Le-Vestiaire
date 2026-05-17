import type { Metadata } from "next";

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
  };

  const titles: Record<string, string> = {
    fr: "Catalogue de Maillots de Football - Toutes les Ligues et Clubs | Le Vestiaire",
    en: "Football Jersey Catalogue - All Leagues and Clubs | The Locker Room",
    es: "Catálogo de Camisetas de Fútbol - Todas las Ligas y Clubes | El Vestuario",
    de: "Fußballtrikot-Katalog - Alle Ligen und Clubs | Le Vestiaire",
    pt: "Catálogo de Camisolas de Futebol - Todas as Ligas e Clubes | Le Vestiaire",
  };

  const descriptions: Record<string, string> = {
    fr: "Explorez notre catalogue complet de maillots de football : Premier League, Ligue 1, Liga, Champions League et toutes les ligues majeures. Trouvez le maillot de votre club favori, notez-le et ajoutez-le à votre collection.",
    en: "Explore our complete football jersey catalogue: Premier League, Ligue 1, La Liga, Champions League and all major leagues. Find your favourite club's jersey, rate it and add it to your collection.",
    es: "Explora nuestro catálogo completo de camisetas de fútbol: Premier League, Ligue 1, Liga, Champions League y todas las ligas principales. Encuentra la camiseta de tu club favorito y añádela a tu colección.",
    de: "Durchsuche unseren vollständigen Fußballtrikot-Katalog: Premier League, Ligue 1, Bundesliga, Champions League und alle großen Ligen. Finde das Trikot deines Lieblingsclubs und füge es deiner Sammlung hinzu.",
    pt: "Explora o nosso catálogo completo de camisolas de futebol: Premier League, Ligue 1, La Liga, Champions League e todas as principais ligas. Encontra a camisola do teu clube favorito e adiciona-a à tua coleção.",
  };

  const keywords: Record<string, string> = {
    fr: "catalogue maillots football, maillots Premier League, maillots Ligue 1, maillots Liga, maillots Champions League, maillots par club, maillots foot toutes ligues, trouver maillot foot, maillots football vintage, maillots de foot par ligue",
    en: "football jersey catalogue, Premier League jerseys, Ligue 1 jerseys, La Liga jerseys, Champions League jerseys, jerseys by club, vintage football shirts, find football jersey",
    es: "catálogo camisetas fútbol, camisetas Premier League, camisetas Ligue 1, camisetas Liga, camisetas Champions League, camisetas por club, camisetas fútbol vintage",
    de: "Fußballtrikot Katalog, Premier League Trikots, Ligue 1 Trikots, Bundesliga Trikots, Champions League Trikots, Trikots nach Club, vintage Fußballtrikots, Trikot finden",
    pt: "catálogo camisolas futebol, camisolas Premier League, camisolas Ligue 1, camisolas La Liga, camisolas Champions League, camisolas por clube, camisolas futebol vintage",
  };

  return {
    title: titles[locale] || titles.fr,
    description: descriptions[locale] || descriptions.fr,
    keywords: keywords[locale] || keywords.fr,
    openGraph: {
      title: titles[locale] || titles.fr,
      description: descriptions[locale] || descriptions.fr,
      url: `https://le-vestiaire-foot.fr/${locale}/jerseys`,
      siteName: "Le Vestiaire Foot",
      images: [
        {
          url: "https://le-vestiaire-foot.fr/icon.png",
          width: 1200,
          height: 630,
          alt: "Catalogue de maillots de football - Le Vestiaire",
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
    alternates: {
      canonical: `https://le-vestiaire-foot.fr/${locale}/jerseys`,
      languages: {
        fr: "https://le-vestiaire-foot.fr/fr/jerseys",
        en: "https://le-vestiaire-foot.fr/en/jerseys",
        es: "https://le-vestiaire-foot.fr/es/jerseys",
        de: "https://le-vestiaire-foot.fr/de/jerseys",
        pt: "https://le-vestiaire-foot.fr/pt/jerseys",
      },
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

export default function JerseysLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
