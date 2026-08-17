import type { JerseyWithWishlistAndCollection } from "@/types/jersey";
import { buildJerseyFaq } from "@/lib/seo-jersey-i18n";

interface FaqSchemaProps {
  jersey: JerseyWithWishlistAndCollection;
  locale: string;
  translatedJerseyName: string;
  translatedType: string;
  collectionCount?: number;
  totalRatings?: number;
  averageRating?: number;
  cfsPrice?: number;
}

export function FaqSchema({
  jersey,
  locale,
  translatedJerseyName,
  translatedType,
  collectionCount = 0,
  totalRatings = 0,
  averageRating,
  cfsPrice,
}: FaqSchemaProps) {
  const { club, season, brand } = jersey;

  const mainEntity = buildJerseyFaq(locale, {
    clubName: club.name,
    clubShortName: club.shortName,
    leagueName: club.league.name,
    season,
    brand,
    typeLower: translatedType.toLowerCase(),
    translatedJerseyName,
    collectionCount,
    totalRatings,
    averageRating,
    cfsPrice,
  }).map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  }));

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
