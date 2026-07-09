import type { ClubWithLeague } from "@/types/jersey";

interface ClubSchemaProps {
  club: ClubWithLeague;
  url: string;
  totalJerseys: number;
  averageRating: number;
  totalRatings: number;
  favoriteCount: number;
}

export function ClubSchema({
  club,
  url,
  totalJerseys,
  averageRating,
  totalRatings,
  favoriteCount,
}: ClubSchemaProps) {
  const hasRatings = totalRatings > 0;

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Maillots ${club.name} - ${club.league.name}`,
    url,
    description: `Collection complète des maillots du ${club.name} (${club.league.name}). ${totalJerseys} maillots référencés.`,
    isPartOf: {
      "@type": "WebSite",
      name: "Le Vestiaire Foot",
      url: "https://le-vestiaire-foot.fr",
    },
    about: {
      "@type": "SportsTeam",
      name: club.name,
      logo: club.logoUrl,
      sport: "Football",
      memberOf: {
        "@type": "SportsOrganization",
        name: club.league.name,
      },
      ...(hasRatings && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: averageRating.toFixed(1),
          reviewCount: totalRatings,
          bestRating: "5",
          worstRating: "0.5",
          itemReviewed: {
            "@type": "Thing",
            name: `Maillots ${club.name}`,
          },
        },
      }),
      ...(favoriteCount > 0 && {
        interactionStatistic: {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/FollowAction",
          userInteractionCount: favoriteCount,
          name: "Fans du club",
        },
      }),
    },
    mainContentOfPage: {
      "@type": "WebPageElement",
      name: `Collection ${totalJerseys} maillots`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
