import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/profiles/user-avatar";
import { SupporterBadge } from "@/components/supporter/supporter-badge";
import { getFeaturedCollectors } from "@/lib/featured-collectors";
import { getR2PresignedUrl, AVATARS_BUCKET } from "@/lib/r2-storage";

export async function FeaturedCollectors() {
  const t = await getTranslations("HomePage.featuredCollectors");
  const collectors = await getFeaturedCollectors();

  if (collectors.length === 0) return null;

  // Presigning hors du cache : les URLs R2 expirent, on les régénère à chaque
  // rendu alors que les données du collectionneur restent cachées 1h.
  const withAvatars = await Promise.all(
    collectors.map(async (collector) => ({
      ...collector,
      avatarUrl: collector.avatarKey
        ? await getR2PresignedUrl(AVATARS_BUCKET, collector.avatarKey, 60 * 60)
        : undefined,
    }))
  );

  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">{t("title")}</h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {withAvatars.map((collector) => (
            <Link
              key={collector.username}
              href={`/u/${collector.username}/collection`}
              className="cursor-pointer"
            >
              <Card className="p-5 h-full items-center text-center gap-3 hover:border-primary/40 transition-colors">
                <UserAvatar
                  src={collector.avatarUrl}
                  name={collector.name}
                  size="lg"
                  frame={collector.avatarFrame}
                  isSupporter={collector.isSupporter}
                />
                <div className="w-full">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="font-semibold truncate">
                      @{collector.username}
                    </span>
                    {collector.isSupporter && (
                      <SupporterBadge size="sm" iconOnly />
                    )}
                  </div>
                  {collector.favoriteClubName && (
                    <div className="text-xs text-muted-foreground truncate">
                      {collector.favoriteClubName}
                    </div>
                  )}
                </div>

                {collector.jerseyThumbs.length > 0 && (
                  <div className="flex gap-1.5 justify-center">
                    {collector.jerseyThumbs.map((src, index) => (
                      <div
                        key={index}
                        className="relative w-10 h-10 rounded-md overflow-hidden bg-muted"
                      >
                        <Image
                          src={src}
                          alt=""
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                )}

                <span className="text-xs text-muted-foreground mt-auto">
                  {t("jerseysCount", { count: collector.collectionCount })}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
