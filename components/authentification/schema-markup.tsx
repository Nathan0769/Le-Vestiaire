import type { BrandGuide } from "@/types/authentication";

interface SchemaMarkupProps {
  guide: BrandGuide;
  brandName: string;
}

export function SchemaMarkup({ guide, brandName }: SchemaMarkupProps) {
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `Comment authentifier un maillot ${brandName}`,
    description: guide.description,
    image: `https://le-vestiaire-foot.fr/icon.png`,
    totalTime: "PT10M",
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "EUR",
      value: "0",
    },
    tool: [
      {
        "@type": "HowToTool",
        name: "Smartphone ou ordinateur",
      },
      {
        "@type": "HowToTool",
        name: "Accès à Google Images",
      },
    ],
    step: guide.criteria.map((criterion, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: criterion.title,
      text: criterion.description,
      itemListElement: criterion.points.map((point, pIndex) => ({
        "@type": "HowToDirection",
        position: pIndex + 1,
        text: point,
      })),
    })),
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    image: `https://le-vestiaire-foot.fr/icon.png`,
    author: {
      "@type": "Organization",
      name: "Le Vestiaire Foot",
      url: "https://le-vestiaire-foot.fr",
    },
    publisher: {
      "@type": "Organization",
      name: "Le Vestiaire Foot",
      logo: {
        "@type": "ImageObject",
        url: "https://le-vestiaire-foot.fr/icon.png",
      },
    },
    datePublished: "2024-10-01",
    dateModified: new Date().toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://le-vestiaire-foot.fr/authentification/${guide.brand}`,
    },
  };

  const faqSchema =
    guide.tips.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: `Comment vérifier l'authenticité d'un maillot ${brandName} ?`,
              acceptedAnswer: {
                "@type": "Answer",
                text: guide.description,
              },
            },
            ...guide.commonFakes.slice(0, 3).map((fake) => ({
              "@type": "Question",
              name: `Quels sont les signes d'un faux maillot ${brandName} ?`,
              acceptedAnswer: {
                "@type": "Answer",
                text: fake,
              },
            })),
          ],
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
    </>
  );
}
