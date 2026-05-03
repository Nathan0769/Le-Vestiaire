import type { JerseyWithWishlistAndCollection } from "@/types/jersey";

interface FaqSchemaProps {
  jersey: JerseyWithWishlistAndCollection;
  translatedJerseyName: string;
  translatedType: string;
  collectionCount?: number;
  totalRatings?: number;
  averageRating?: number;
}

export function FaqSchema({
  jersey,
  translatedJerseyName,
  translatedType,
  collectionCount = 0,
  totalRatings = 0,
  averageRating,
}: FaqSchemaProps) {
  const typeLower = translatedType.toLowerCase();
  const { club, season, brand } = jersey;

  const mainEntity = [
    {
      "@type": "Question",
      name: `Qui est l'équipementier du maillot ${typeLower} de ${club.name} en ${season} ?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `Le maillot ${typeLower} de ${club.name} pour la saison ${season} est fabriqué par ${brand}.`,
      },
    },
    {
      "@type": "Question",
      name: `Dans quelle compétition évolue ${club.name} lors de la saison ${season} ?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `${club.name} participe à la ${club.league.name} lors de la saison ${season}.`,
      },
    },
    ...(collectionCount > 0
      ? [
          {
            "@type": "Question",
            name: `Combien de collectionneurs possèdent le maillot ${club.shortName} ${season} sur Le Vestiaire ?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${collectionCount} ${
                collectionCount > 1
                  ? "collectionneurs possèdent"
                  : "collectionneur possède"
              } ce maillot sur la plateforme Le Vestiaire.`,
            },
          },
        ]
      : []),
    ...(averageRating && totalRatings > 0
      ? [
          {
            "@type": "Question",
            name: `Quelle est la note communautaire du maillot ${translatedJerseyName} ?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Le maillot ${translatedJerseyName} a une note moyenne de ${averageRating.toFixed(
                1
              )}/5 basée sur ${totalRatings} évaluation${
                totalRatings > 1 ? "s" : ""
              } sur Le Vestiaire.`,
            },
          },
        ]
      : []),
    {
      "@type": "Question",
      name: `Où acheter le maillot ${translatedJerseyName} ?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `Le maillot ${translatedJerseyName} est disponible sur Classic Football Shirts, spécialiste en maillots de football vintage et de collection.`,
      },
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity,
        }),
      }}
    />
  );
}
