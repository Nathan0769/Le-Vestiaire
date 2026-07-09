import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { JerseyCard } from "@/components/jerseys/jerseys/jersey-card";
import type { JerseyType } from "@prisma/client";

type BrandJersey = {
  id: string;
  name: string;
  imageUrl: string;
  type: JerseyType;
  slug: string | null;
  season: string;
  variant: number;
  club: {
    id: string;
    name: string;
    shortName: string;
    logoUrl: string;
    primaryColor: string;
    leagueId: string;
  };
};

type Props = {
  brand: string;
  jerseyCount: number;
  clubCount: number;
  seasonCount: number;
  jerseysBySeason: Array<{
    season: string;
    jerseys: BrandJersey[];
  }>;
};

export function BrandHubView({
  brand,
  jerseyCount,
  clubCount,
  seasonCount,
  jerseysBySeason,
}: Props) {
  const t = useTranslations("BrandPage");

  return (
    <div className="p-4 md:p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">{brand}</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          {t("heroSubtitle", { brand })}
        </p>
      </header>

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <StatCard label={t("totalJerseysLabel")} value={jerseyCount} />
        <StatCard label={t("clubsEquippedLabel")} value={clubCount} />
        <StatCard label={t("seasonsCoveredLabel")} value={seasonCount} />
      </div>

      {jerseysBySeason.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          {t("emptyState", { brand })}
        </p>
      ) : (
        <div className="space-y-8">
          {jerseysBySeason.map(({ season, jerseys }) => (
            <section key={season} className="space-y-3">
              <h2 className="text-xl font-semibold">
                {t("seasonHeading", { season })}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {jerseys.map((jersey) => (
                  <JerseyCard
                    key={jersey.id}
                    jersey={jersey}
                    leagueId={jersey.club.leagueId}
                    club={jersey.club}
                    showFullInfo
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-4 md:p-6">
        <span className="text-2xl md:text-3xl font-bold">{value}</span>
        <span className="text-xs md:text-sm text-muted-foreground text-center">
          {label}
        </span>
      </CardContent>
    </Card>
  );
}
