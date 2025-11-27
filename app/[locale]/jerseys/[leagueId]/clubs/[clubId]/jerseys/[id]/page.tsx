import { notFound, redirect } from "next/navigation";
import { isSlug } from "@/lib/slug-generator";
import type { JerseyWithWishlistAndCollection, JerseyType } from "@/types/jersey";
import type { Metadata } from "next";
import Image from "next/image";
import { JerseyBreadcrumb } from "@/components/jerseys/jerseys/jerseys-bread-crumb";
import { StarRating } from "@/components/jerseys/ratings/star-rating";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { CollectionButton } from "@/components/collection/collection-button";
import { JerseyStats } from "@/components/jerseys/stats/jersey-stats";
import { JerseySchema } from "@/components/seo/jersey-schema";
import { JerseyTabs } from "@/components/jerseys/jersey-tabs";
import { getTranslations, getLocale } from "next-intl/server";
import { translateJerseyName } from "@/lib/translate-jersey-name";
import { EditableBrand } from "@/components/jerseys/editable-brand";
import { getCurrentUser } from "@/lib/get-current-user";

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
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return {
        title: "Maillot introuvable - Le Vestiaire",
        description: "Ce maillot n'existe pas ou n'est plus disponible.",
      };
    }

    const jersey: JerseyWithWishlistAndCollection = await res.json();
    const locale = await getLocale();
    const tJerseyType = await getTranslations("JerseyType");

    const typeLabel = tJerseyType(jersey.type as JerseyType);
    const typeLower = typeLabel.toLowerCase();

    const translatedJerseyName = translateJerseyName({
      jersey: {
        name: jersey.name,
        type: jersey.type as JerseyType,
        season: jersey.season,
        clubShortName: jersey.club.shortName,
      },
      locale,
      typeTranslation: typeLabel,
    });

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

    const title = `${translatedJerseyName} ${jersey.brand}${ratingText} | Le Vestiaire`;
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
        title: translatedJerseyName,
        description: `Maillot ${typeLower} ${jersey.club.name} par ${jersey.brand}. ${jersey.club.league.name} • Saison ${jersey.season}`,
        images: [
          {
            url: jersey.imageUrl,
            width: 800,
            height: 800,
            alt: translatedJerseyName,
          },
        ],
        type: "website",
        siteName: "Le Vestiaire Foot",
        locale: "fr_FR",
      },

      twitter: {
        card: "summary_large_image",
        title: translatedJerseyName,
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

  // Check if current user is admin or superadmin
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "superadmin";

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

  const locale = await getLocale();
  const tJerseyType = await getTranslations("JerseyType");
  const t = await getTranslations("Jerseys");
  const getJerseyTypeLabel = (type: string) => {
    return tJerseyType(type as JerseyType);
  };

  const translatedJerseyName = translateJerseyName({
    jersey: {
      name: jersey.name,
      type: jersey.type as JerseyType,
      season: jersey.season,
      clubShortName: jersey.club.shortName,
    },
    locale,
    typeTranslation: getJerseyTypeLabel(jersey.type),
  });

  return (
    <>
      <JerseySchema
        jersey={jersey}
        translatedJerseyName={translatedJerseyName}
        averageRating={ratingData?.averageRating}
        totalRatings={ratingData?.totalRatings}
        collectionCount={statsData?.collectionCount}
        wishlistCount={statsData?.wishlistCount}
      />

      <div className="p-6 space-y-8 overflow-x-hidden">
        <JerseyBreadcrumb
          leagueName={jersey.club.league.name}
          leagueId={jersey.club.league.id}
          clubName={jersey.club.name}
          clubId={jersey.club.id}
          jerseyName={translatedJerseyName}
        />

        <main className="flex flex-col lg:flex-row gap-8 p-4 sm:p-6 max-w-6xl mx-auto overflow-x-hidden">
          <div className="w-full lg:w-1/2 min-w-0">
            <Image
              src={jersey.imageUrl}
              alt={translatedJerseyName}
              width={800}
              height={800}
              className="rounded-xl object-contain w-full h-auto max-h-[600px] bg-white"
              priority
            />
          </div>

          <div className="w-full lg:w-1/2 min-w-0">
            <div className="bg-card border border-border rounded-xl shadow-lg p-4 sm:p-6 h-full flex flex-col justify-between min-w-0 overflow-hidden">
              <div className="space-y-6 min-w-0">
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 break-words">
                    {translatedJerseyName}
                  </h1>

                  <div className="space-y-3 min-w-0">
                    <div className="flex items-center justify-between gap-2 py-2 border-b border-border/50 min-w-0">
                      <span className="text-sm font-medium text-muted-foreground shrink-0">
                        {t("club")}
                      </span>
                      <span className="text-sm font-semibold text-foreground text-right break-words">
                        {jersey.club.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 py-2 border-b border-border/50 min-w-0">
                      <span className="text-sm font-medium text-muted-foreground shrink-0">
                        {t("season")}
                      </span>
                      <span className="text-sm font-semibold text-foreground text-right break-words">
                        {jersey.season}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 py-2 border-b border-border/50 min-w-0">
                      <span className="text-sm font-medium text-muted-foreground shrink-0">
                        {t("brand")}
                      </span>
                      <EditableBrand
                        jerseyId={jersey.id}
                        currentBrand={jersey.brand}
                        isAdmin={isAdmin}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 py-2 border-b border-border/50 min-w-0">
                      <span className="text-sm font-medium text-muted-foreground shrink-0">
                        {t("type")}
                      </span>
                      <span className="text-sm font-semibold text-foreground text-right break-words">
                        {getJerseyTypeLabel(jersey.type)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      {t("averageRating")}
                    </h3>
                    <StarRating jerseyId={jersey.id} />
                  </div>

                  <div>
                    <JerseyStats jerseyId={jersey.id} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-8 pt-6 border-t border-border/50 min-w-0">
                <div className="flex flex-col xl:flex-row gap-3 min-w-0">
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

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8 overflow-x-hidden">
          <JerseyTabs
            jerseyId={jersey.id}
            jerseyName={translatedJerseyName}
            description={jersey.description}
            clubId={jersey.club.id}
            season={jersey.season}
          />
        </div>
      </div>
    </>
  );
}
