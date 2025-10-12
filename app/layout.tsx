import { Metadata } from "next";
import ClientWrapper from "@/components/home/client-wrapper";

export const metadata: Metadata = {
  title:
    "Le Vestiaire Foot - Gérez votre Collection de Maillots de Foot | Application Gratuite",

  description:
    "Cataloguez et gérez votre collection de maillots de football gratuitement. Créez votre wishlist à partager, identifiez les vrais des faux, et rejoignez une communauté de collectionneurs passionnés.",

  keywords: [
    "gérer collection maillots foot",
    "application collection maillots football",
    "cataloguer maillots football",
    "tracker collection maillots",

    "reconnaître faux maillot",
    "authentifier maillot football",
    "wishlist maillots football",
    "partager collection maillots",

    "organiser ma collection maillots",
    "communauté collectionneurs maillots",
    "maillots vintage authentiques",
    "base de données maillots foot",
  ],

  authors: [{ name: "Le Vestiaire" }],
  creator: "Le Vestiaire",
  publisher: "Le Vestiaire",
  metadataBase: new URL("https://le-vestiaire-foot.fr"),

  alternates: {
    canonical: "https://le-vestiaire-foot.fr",
  },

  openGraph: {
    title: "Le Vestiaire Foot - Gérez votre Collection de Maillots de Foot",
    description:
      "L'application gratuite pour collectionner, organiser et partager vos maillots de football.",
    url: "https://le-vestiaire-foot.fr",
    siteName: "Le Vestiaire",
    images: [
      {
        url: "https://le-vestiaire-foot.fr/icon.png",
        width: 1200,
        height: 630,
        alt: "Interface de gestion de collection de maillots - Le Vestiaire Foot",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Le Vestiaire Foot - Votre Collection de Maillots en un Clic",
    description:
      "Cataloguez, partagez et gérez votre collection de maillots de foot gratuitement",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
