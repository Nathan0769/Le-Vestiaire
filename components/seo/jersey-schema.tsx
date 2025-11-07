import type { JerseyWithWishlistAndCollection } from "@/types/jersey";

interface JerseySchemaProps {
  jersey: JerseyWithWishlistAndCollection;
  translatedJerseyName?: string;
  averageRating?: number;
  totalRatings?: number;
  collectionCount?: number;
  wishlistCount?: number;
}

export function JerseySchema({
  jersey,
  translatedJerseyName,
  averageRating = 0,
  totalRatings = 0,
  collectionCount = 0,
  wishlistCount = 0,
}: JerseySchemaProps) {
  const displayName = translatedJerseyName || jersey.name;

  const schema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: `${displayName} - ${jersey.club.name}`,
    description: `Maillot ${jersey.type.toLowerCase()} du ${
      jersey.club.name
    } pour la saison ${jersey.season}, conçu par ${jersey.brand}. ${
      collectionCount > 0
        ? `${collectionCount} collectionneurs possèdent ce maillot.`
        : "Maillot de collection recherché par les passionnés."
    }`,
    image: {
      "@type": "ImageObject",
      url: jersey.imageUrl,
      width: 800,
      height: 800,
    },
    creator: {
      "@type": "Brand",
      name: jersey.brand,
    },
    about: {
      "@type": "SportsTeam",
      name: jersey.club.name,
      sport: "Football",
      memberOf: {
        "@type": "SportsOrganization",
        name: jersey.club.league.name,
      },
    },
    datePublished: jersey.season.split("-")[0],
    url: `https://le-vestiaire-foot.fr/jerseys/${jersey.club.league.id}/clubs/${
      jersey.club.id
    }/jerseys/${jersey.slug || jersey.id}`,

    ...(totalRatings > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: averageRating.toFixed(1),
        reviewCount: totalRatings,
        bestRating: "5",
        worstRating: "0.5",
      },
    }),

    interactionStatistic: [
      ...(wishlistCount > 0
        ? [
            {
              "@type": "InteractionCounter",
              interactionType: "https://schema.org/WantAction",
              userInteractionCount: wishlistCount,
              name: "Ajouts en wishlist",
            },
          ]
        : []),
      ...(collectionCount > 0
        ? [
            {
              "@type": "InteractionCounter",
              interactionType: "https://schema.org/CollectAction",
              userInteractionCount: collectionCount,
              name: "Collectionneurs",
            },
          ]
        : []),
    ],

    keywords: [
      `maillot ${jersey.club.name}`,
      `${jersey.club.name} ${jersey.season}`,
      `${jersey.brand}`,
      jersey.club.league.name,
      "collection maillot football",
      "football vintage",
    ].join(", "),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
