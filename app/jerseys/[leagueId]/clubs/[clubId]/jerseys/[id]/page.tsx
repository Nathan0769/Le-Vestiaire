import { notFound, redirect } from "next/navigation";
import { isSlug } from "@/lib/slug-generator";
import type { JerseyWithWishlistAndCollection } from "@/types/jersey";
import type { Metadata } from "next";
import Image from "next/image";
import { JerseyBreadcrumb } from "@/components/jerseys/jerseys/jerseys-bread-crumb";
import { StarRating } from "@/components/jerseys/ratings/star-rating";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { CollectionButton } from "@/components/collection/collection-button";
import { JerseyStats } from "@/components/jerseys/stats/jersey-stats";
import { JerseySchema } from "@/components/seo/jersey-schema";

interface JerseyPageProps {
  params: Promise<{
    leagueId: string;
    clubId: string;
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: JerseyPageProps): Promise<Metadata> {
  const { leagueId, clubId, id } = await params;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/jerseys/${id}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return {
        title: "Maillot introuvable - Le Vestiaire",
        description: "Ce maillot n'existe pas ou n'est plus disponible.",
      };
    }

    const jersey: JerseyWithWishlistAndCollection = await res.json();

    const getJerseyTypeLabel = (type: string): string => {
      const labels: Record<string, string> = {
        HOME: "Domicile",
        AWAY: "Extérieur",
        THIRD: "Third",
        FOURTH: "Fourth",
        GOALKEEPER: "Gardien",
        SPECIAL: "Spécial",
      };
      return labels[type.toUpperCase()] || type;
    };

    const typeLabel = getJerseyTypeLabel(jersey.type);
    const typeLower = typeLabel.toLowerCase();

    let ratingText = "";
    try {
      const ratingRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/jerseys/${id}/rating`,
        { cache: "no-store" }
      );
      if (ratingRes.ok) {
        const ratingData = await ratingRes.json();
        if (ratingData.totalRatings > 0) {
          ratingText = ` - Note ${ratingData.averageRating.toFixed(1)}/5 ⭐`;
        }
      }
    } catch {}

    const title = `Maillot ${jersey.club.name} ${typeLabel} ${jersey.season} ${jersey.brand}${ratingText} | Le Vestiaire`;
    const description = `Découvrez le maillot ${typeLower} du ${jersey.club.name} pour la saison ${jersey.season}. Conçu par ${jersey.brand}, ce maillot ${jersey.club.league.name} est une pièce de collection. Ajoutez-le à votre collection et évaluez-le !`;

    const keywords = [
      `maillot ${jersey.club.name}`,
      `${jersey.club.name} ${jersey.season}`,
      `maillot ${jersey.brand} ${jersey.club.name}`,
      `maillot foot ${jersey.club.name}`,
      `maillot ${typeLower} ${jersey.club.name}`,
      `collection maillot ${jersey.club.league.name}`,
      `maillot vintage ${jersey.club.name}`,
      `jersey ${jersey.club.name} ${jersey.season}`,
    ];

    const canonicalUrl = `https://le-vestiaire-foot.fr/jerseys/${leagueId}/clubs/${clubId}/jerseys/${
      jersey.slug || id
    }`;

    return {
      title,
      description,
      keywords: keywords.join(", "),

      openGraph: {
        title: `${jersey.club.name} ${typeLabel} ${jersey.season}`,
        description: `Maillot ${typeLower} ${jersey.club.name} par ${jersey.brand}. ${jersey.club.league.name} • Saison ${jersey.season}`,
        images: [
          {
            url: jersey.imageUrl,
            width: 800,
            height: 800,
            alt: `Maillot ${jersey.club.name} ${jersey.season} ${jersey.brand}`,
          },
        ],
        type: "website",
        siteName: "Le Vestiaire Foot",
        locale: "fr_FR",
      },

      twitter: {
        card: "summary_large_image",
        title: `${jersey.club.name} ${typeLabel} ${jersey.season}`,
        description: `Maillot ${jersey.brand} • ${jersey.club.league.name}`,
        images: [jersey.imageUrl],
      },

      alternates: {
        canonical: canonicalUrl,
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
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Maillot de football - Le Vestiaire",
      description: "Collection de maillots de football vintage et récents",
    };
  }
}

export default async function JerseyPage({ params }: JerseyPageProps) {
  const { leagueId, clubId, id } = await params;

  const isSlugParam = isSlug(id);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/jerseys/${id}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    notFound();
  }

  const jersey: JerseyWithWishlistAndCollection = await res.json();

  if (!isSlugParam && jersey.slug) {
    redirect(`/jerseys/${leagueId}/clubs/${clubId}/jerseys/${jersey.slug}`);
  }

  const [ratingRes, statsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jerseys/${id}/rating`, {
      cache: "no-store",
    }).catch(() => null),
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jerseys/${id}/stats`, {
      cache: "no-store",
    }).catch(() => null),
  ]);

  const ratingData = ratingRes && ratingRes.ok ? await ratingRes.json() : null;
  const statsData = statsRes && statsRes.ok ? await statsRes.json() : null;

  const getJerseyTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case "home":
        return "Domicile";
      case "away":
        return "Extérieur";
      case "third":
        return "Third";
      case "fourth":
        return "Fourth";
      case "special":
        return "Spécial";
      case "goalkeeper":
        return "Gardien";
      default:
        return type;
    }
  };

  return (
    <>
      <JerseySchema
        jersey={jersey}
        averageRating={ratingData?.averageRating}
        totalRatings={ratingData?.totalRatings}
        collectionCount={statsData?.collectionCount}
        wishlistCount={statsData?.wishlistCount}
      />

      <div className="p-6 space-y-8">
        <JerseyBreadcrumb
          leagueName={jersey.club.league.name}
          leagueId={jersey.club.league.id}
          clubName={jersey.club.name}
          clubId={jersey.club.id}
          jerseyName={jersey.name}
        />

        <main className="flex flex-col lg:flex-row gap-8 p-6 max-w-6xl mx-auto">
          <div className="w-full lg:w-1/2">
            <Image
              src={jersey.imageUrl}
              alt={`Maillot ${jersey.club.name} ${jersey.season} ${
                jersey.brand
              } - ${getJerseyTypeLabel(jersey.type)}`}
              width={800}
              height={800}
              className="rounded-xl object-contain w-full h-auto max-h-[600px] bg-white"
              priority
            />
          </div>

          <div className="w-full lg:w-1/2">
            <div className="bg-card border border-border rounded-xl shadow-lg p-6 h-full flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-4">
                    {jersey.name}
                  </h1>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-sm font-medium text-muted-foreground">
                        Club
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {jersey.club.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-sm font-medium text-muted-foreground">
                        Saison
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {jersey.season}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-sm font-medium text-muted-foreground">
                        Marque
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {jersey.brand}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-sm font-medium text-muted-foreground">
                        Type
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {getJerseyTypeLabel(jersey.type)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Note moyenne
                    </h3>
                    <StarRating jerseyId={jersey.id} />
                  </div>

                  <div>
                    <JerseyStats jerseyId={jersey.id} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-8 pt-6 border-t border-border/50">
                <div className="flex flex-col sm:flex-row gap-3">
                  <CollectionButton
                    jerseyId={jersey.id}
                    initialIsInCollection={jersey.isInCollection}
                  />
                  <WishlistButton
                    jerseyId={jersey.id}
                    initialIsInWishlist={jersey.isInWishlist}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
