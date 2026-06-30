import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { isSlug } from "@/lib/slug-generator";
import type {
  JerseyWithWishlistAndCollection,
  JerseyType,
} from "@/types/jersey";
import type { Metadata } from "next";
import Image from "next/image";
import { JerseyBreadcrumb } from "@/components/jerseys/jerseys/jerseys-bread-crumb";
import { StarRating } from "@/components/jerseys/ratings/star-rating";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { CollectionButton } from "@/components/collection/collection-button";
import { JerseyStats } from "@/components/jerseys/stats/jersey-stats";
import { JerseySchema } from "@/components/seo/jersey-schema";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { WebPageSchema } from "@/components/seo/webpage-schema";
import { FaqSchema } from "@/components/seo/faq-schema";
import { JerseyTabs } from "@/components/jerseys/jersey-tabs";
import { getTranslations, getLocale } from "next-intl/server";
import { translateJerseyName } from "@/lib/translate-jersey-name";
import { jerseyTypeLabel } from "@/lib/jersey-utils";
import { EditableBrand } from "@/components/jerseys/editable-brand";
import { EditableMainColor } from "@/components/jerseys/editable-main-color";
import { JerseyReportButton } from "@/components/jerseys/jersey-report-button";
import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { JerseyNavigator } from "@/components/jerseys/jersey-navigator";

export const dynamic = "force-dynamic";

interface JerseyPageProps {
  params: Promise<{
    leagueId: string;
    clubId: string;
    id: string;
  }>;
}

const getCachedUser = cache(() => getCurrentUser());

const getCachedJersey = cache(async (id: string) => {
  const user = await getCachedUser();
  const searchBySlug = isSlug(id);

  const jersey = await prisma.jersey.findUnique({
    where: searchBySlug ? { slug: id } : { id },
    include: {
      club: { include: { league: true } },
      ...(user && {
        wishlist: {
          where: { userId: user.id },
          select: { id: true },
        },
      }),
    },
  });

  if (!jersey) return null;
  const { wishlist, retailPrice, ...rest } = jersey as typeof jersey & {
    wishlist?: { id: string }[];
  };
  return {
    ...rest,
    retailPrice: retailPrice == null ? undefined : Number(retailPrice),
    isInWishlist: user ? (wishlist?.length ?? 0) > 0 : false,
    isInCollection: false,
  } as unknown as JerseyWithWishlistAndCollection;
});

const getCachedRating = cache(async (jerseyId: string) => {
  const aggregate = await prisma.rating.aggregate({
    where: { jerseyId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  return {
    averageRating: aggregate._avg.rating ? Number(aggregate._avg.rating) : 0,
    totalRatings: aggregate._count.rating || 0,
  };
});

const getCachedStats = cache(async (jerseyId: string) => {
  const [collectionCount, wishlistCount] = await Promise.all([
    prisma.userJersey.count({ where: { jerseyId } }),
    prisma.wishlist.count({ where: { jerseyId } }),
  ]);
  return { collectionCount, wishlistCount };
});

export async function generateMetadata({
  params,
}: JerseyPageProps): Promise<Metadata> {
  const { leagueId, clubId, id } = await params;

  try {
    const jersey = await getCachedJersey(id);

    if (!jersey) {
      return {
        title: "Maillot introuvable - Le Vestiaire",
        description: "Ce maillot n'existe pas ou n'est plus disponible.",
      };
    }

    const locale = await getLocale();
    const tJerseyType = await getTranslations("JerseyType");

    const typeLabel = jerseyTypeLabel(tJerseyType(jersey.type as JerseyType), jersey.type, jersey.variant ?? 1);
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
    const rating = await getCachedRating(jersey.id);
    if (rating.totalRatings > 0) {
      ratingText = ` - Note ${rating.averageRating.toFixed(1)}/5 ⭐`;
    }

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

  const currentUser = await getCachedUser();
  const isAdmin =
    currentUser?.role === "admin" || currentUser?.role === "superadmin";
  const isSuperAdmin = currentUser?.role === "superadmin";

  const jersey = await getCachedJersey(id);
  if (!jersey) notFound();

  if (!isSlugParam && jersey.slug) {
    redirect(`/jerseys/${leagueId}/clubs/${clubId}/jerseys/${jersey.slug}`);
  }

  const [ratingData, statsData] = await Promise.all([
    getCachedRating(jersey.id),
    getCachedStats(jersey.id),
  ]);

  const typeOrder: Record<string, number> = {
    HOME: 1,
    AWAY: 2,
    THIRD: 3,
    FOURTH: 4,
    SPECIAL: 5,
    GOALKEEPER: 20,
  };

  const [clubJerseys, seasonLeagueEntry] = await Promise.all([
    prisma.jersey.findMany({
      where: { clubId: jersey.clubId },
      select: { id: true, slug: true, season: true, type: true, imageUrl: true },
      orderBy: { season: "desc" },
    }),
    prisma.clubSeasonLeague.findUnique({
      where: { clubId_season: { clubId: jersey.clubId, season: jersey.season } },
      select: { league: { select: { id: true, name: true, logoUrl: true } } },
    }),
  ]);

  const displayLeague = seasonLeagueEntry?.league ?? jersey.club.league;

  const sortedJerseys = [...clubJerseys].sort((a, b) => {
    if (b.season !== a.season) return b.season.localeCompare(a.season);
    return (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99);
  });

  const currentIndex = sortedJerseys.findIndex((j) => j.id === jersey.id);
  const prevJersey = currentIndex > 0 ? sortedJerseys[currentIndex - 1] : null;
  const nextJersey =
    currentIndex < sortedJerseys.length - 1
      ? sortedJerseys[currentIndex + 1]
      : null;

  const relatedJerseys = sortedJerseys
    .filter((j) => j.id !== jersey.id)
    .slice(0, 8);

  const locale = await getLocale();
  const tJerseyType = await getTranslations("JerseyType");
  const t = await getTranslations("Jerseys");
  const getJerseyTypeLabel = (type: string) =>
    jerseyTypeLabel(tJerseyType(type as JerseyType), type, jersey.variant ?? 1);

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

  const breadcrumbItems = [
    { name: "Maillots", url: "https://le-vestiaire-foot.fr/jerseys" },
    {
      name: jersey.club.league.name,
      url: `https://le-vestiaire-foot.fr/jerseys/${jersey.club.league.id}`,
    },
    {
      name: jersey.club.name,
      url: `https://le-vestiaire-foot.fr/jerseys/${jersey.club.league.id}/clubs/${jersey.club.id}`,
    },
    {
      name: translatedJerseyName,
      url: `https://le-vestiaire-foot.fr/jerseys/${jersey.club.league.id}/clubs/${jersey.club.id}/jerseys/${jersey.slug || jersey.id}`,
    },
  ];

  const canonicalUrl = `https://le-vestiaire-foot.fr/jerseys/${leagueId}/clubs/${clubId}/jerseys/${jersey.slug || id}`;
  const pageDescription = `Maillot ${getJerseyTypeLabel(jersey.type).toLowerCase()} du ${jersey.club.name} pour la saison ${jersey.season}, conçu par ${jersey.brand}. ${displayLeague.name}.`;

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
      <BreadcrumbSchema items={breadcrumbItems} />
      <WebPageSchema
        url={canonicalUrl}
        name={`${translatedJerseyName} ${jersey.brand} | Le Vestiaire`}
        description={pageDescription}
        breadcrumbItems={breadcrumbItems}
      />
      <FaqSchema
        jersey={jersey}
        translatedJerseyName={translatedJerseyName}
        translatedType={getJerseyTypeLabel(jersey.type)}
        collectionCount={statsData?.collectionCount}
        totalRatings={ratingData?.totalRatings}
        averageRating={ratingData?.averageRating}
      />

      <div className="p-6 space-y-8 overflow-x-hidden">
        <JerseyBreadcrumb
          leagueName={jersey.club.league.name}
          leagueId={jersey.club.league.id}
          clubName={jersey.club.name}
          clubId={jersey.club.id}
          jerseyName={translatedJerseyName}
        />

        <JerseyNavigator
          prevJersey={prevJersey}
          nextJersey={nextJersey}
          currentName={translatedJerseyName}
          leagueId={leagueId}
          clubId={clubId}
        >
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
                  <EditableMainColor
                    jerseyId={jersey.id}
                    currentMainColor={jersey.mainColor ?? null}
                    clubPrimaryColor={jersey.club.primaryColor}
                    isSuperAdmin={isSuperAdmin}
                  >
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 break-words">
                      {translatedJerseyName}
                    </h1>
                  </EditableMainColor>

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
                        {jersey.season} | {displayLeague.name}
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

                    {process.env.NEXT_PUBLIC_AFFILIATE_LINK_CFS && (
                      <div className="flex items-center justify-between gap-2 py-2 border-b border-border/50 min-w-0">
                        <span className="text-sm font-medium text-muted-foreground shrink-0">
                          {t("findOnCFS")}
                        </span>
                        <a
                          href={`https://www.classicfootballshirts.co.uk/catalogsearch/result/?ref=mgi4mta&utm_source=Affiliates&utm_medium=referral&utm_campaign=Tapfiliate&q=${encodeURIComponent(jersey.club.name)}`}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors flex items-center gap-1.5"
                        >
                          <span>Classic Football Shirts</span>
                          <Image
                            src="https://pub-ad003198168b4f5c8a2c78eb57da8afd.r2.dev/logo-app/logo-cfs.png"
                            alt="Classic Football Shirts"
                            width={16}
                            height={16}
                            className="object-contain"
                          />
                        </a>
                      </div>
                    )}
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
                    jersey={jersey}
                    clubId={jersey.club.id}
                    leagueId={jersey.club.league.id}
                    initialIsInCollection={jersey.isInCollection}
                  />
                  <WishlistButton
                    jerseyId={jersey.id}
                    initialIsInWishlist={jersey.isInWishlist}
                    jersey={{ name: translatedJerseyName, imageUrl: jersey.imageUrl }}
                    clubId={jersey.club.id}
                    leagueId={jersey.club.league.id}
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
            descriptionTranslations={jersey.descriptionTranslations}
            clubId={jersey.club.id}
            season={jersey.season}
          />

          <div className="mt-8 flex justify-center">
            <JerseyReportButton
              jerseyId={jersey.id}
              isAuthenticated={!!currentUser}
              jersey={{ name: translatedJerseyName, imageUrl: jersey.imageUrl }}
            />
          </div>
        </div>
        </JerseyNavigator>

      </div>
    </>
  );
}
