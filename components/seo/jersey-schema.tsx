import type { JerseyWithWishlistAndCollection } from "@/types/jersey";
import {
  buildJerseyProductDescription,
  buildJerseyKeywords,
  localizedCategory,
  localizedJerseyWord,
} from "@/lib/seo-jersey-i18n";

interface JerseySchemaProps {
  jersey: JerseyWithWishlistAndCollection;
  locale: string;
  translatedType: string;
  translatedJerseyName?: string;
  averageRating?: number;
  totalRatings?: number;
  collectionCount?: number;
  wishlistCount?: number;
  cfsAvailability?: {
    price: number;
    promoPrice: number | null;
    affiliateUrl: string;
  } | null;
}

export function JerseySchema({
  jersey,
  locale,
  translatedType,
  translatedJerseyName,
  averageRating = 0,
  totalRatings = 0,
  collectionCount = 0,
  wishlistCount = 0,
  cfsAvailability = null,
}: JerseySchemaProps) {
  const displayName = translatedJerseyName || jersey.name;
  const typeLower = translatedType.toLowerCase();

  // Offer réel basé sur la disponibilité CFS (prix EUR, dispo en stock, lien affilié).
  // Signal commercial fort pour les moteurs IA + rend le Product valide même sans notes.
  const cfsOffer = cfsAvailability
    ? {
        "@type": "Offer",
        price: (cfsAvailability.promoPrice ?? cfsAvailability.price).toFixed(2),
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/UsedCondition",
        url: cfsAvailability.affiliateUrl,
        seller: {
          "@type": "Organization",
          name: "Classic Football Shirts",
        },
      }
    : null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${displayName} - ${jersey.club.name}`,
    description: buildJerseyProductDescription(locale, {
      typeLower,
      clubName: jersey.club.name,
      season: jersey.season,
      brand: jersey.brand,
      collectionCount,
    }),
    image: {
      "@type": "ImageObject",
      url: jersey.imageUrl,
      contentUrl: jersey.imageUrl,
      width: 800,
      height: 800,
      name: displayName,
      description: `${localizedJerseyWord(locale)} ${typeLower} ${jersey.club.name} ${jersey.season} ${jersey.brand}`,
    },
    brand: {
      "@type": "Brand",
      name: jersey.brand,
    },
    manufacturer: {
      "@type": "Organization",
      name: jersey.brand,
    },
    category: localizedCategory(locale),
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

    ...(cfsOffer && { offers: cfsOffer }),

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

    keywords: buildJerseyKeywords(locale, {
      clubName: jersey.club.name,
      season: jersey.season,
      brand: jersey.brand,
      leagueName: jersey.club.league.name,
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
