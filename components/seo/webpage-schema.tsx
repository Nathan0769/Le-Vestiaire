interface WebPageSchemaProps {
  url: string;
  name: string;
  description: string;
  breadcrumbItems: Array<{ name: string; url: string }>;
}

export function WebPageSchema({
  url,
  name,
  description,
  breadcrumbItems,
}: WebPageSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": url,
    name,
    description,
    url,
    inLanguage: "fr",
    isPartOf: {
      "@type": "WebSite",
      name: "Le Vestiaire Foot",
      url: "https://le-vestiaire-foot.fr",
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
