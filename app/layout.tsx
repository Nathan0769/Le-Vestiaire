import { Metadata } from "next";
import ClientWrapper from "@/components/home/client-wrapper";

export const metadata: Metadata = {
  title: "Le Vestiaire Foot - Collection Maillots Football",
  description:
    "Découvrez la plus grande base de données de maillots de football. Collectionnez, évaluez et partagez votre passion avec une communauté de passionnés ⚽",
  keywords: [
    "maillots football",
    "collection maillots",
    "maillots vintage",
    "maillots rétro",
    "base données football",
    "collection football",
    "maillots clubs",
  ],
  authors: [{ name: "Le Vestiaire" }],
  creator: "Le Vestiaire",
  publisher: "Le Vestiaire",
  metadataBase: new URL("https://le-vestiaire-foot.fr"),
  alternates: {
    canonical: "https://le-vestiaire-foot.fr",
  },
  openGraph: {
    title: "Le Vestiaire Foot - Collection Maillots Football",
    description:
      "La plus grande base de données de maillots de football. Tous les clubs, toutes les saisons depuis 25 ans ⚽",
    url: "https://le-vestiaire-foot.fr",
    siteName: "Le Vestiaire",
    images: [
      {
        url: "https://le-vestiaire-foot.fr/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Collection de maillots de football Le Vestiaire",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Le Vestiaire - Collection Maillots Football",
    description: "Base de données complète des maillots de football ⚽",
    images: ["https://le-vestiaire-foot.fr/og-image.jpg"],
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
