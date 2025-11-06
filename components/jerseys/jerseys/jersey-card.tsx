"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { JerseyType } from "@prisma/client";
import { Club } from "@prisma/client";
import { getJerseyUrl } from "@/lib/jersey-url";
import { useTranslations, useLocale } from "next-intl";
import { translateJerseyName } from "@/lib/translate-jersey-name";

type Props = {
  jersey: {
    id: string;
    name: string;
    imageUrl: string;
    type: JerseyType;
    slug?: string | null;
    season?: string;
  };
  leagueId: string;
  club: Club;
  showFullInfo?: boolean;
};

export function JerseyCard({ jersey, leagueId, club, showFullInfo }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const tJerseyType = useTranslations("JerseyType");

  const translatedJerseyName = translateJerseyName({
    jersey: {
      name: jersey.name,
      type: jersey.type as JerseyType,
      season: jersey.season || "",
      clubShortName: club.shortName,
    },
    locale,
    typeTranslation: tJerseyType(jersey.type),
  });

  const handleClick = () => {
    const identifier = jersey.slug || jersey.id;
    const url = getJerseyUrl(leagueId, club.id, identifier);
    router.push(url);
  };

  return (
    <Card
      onClick={handleClick}
      className="cursor-pointer transition-all hover:shadow-lg"
    >
      <CardContent className="flex flex-col items-center justify-center p-4">
        <div className="relative w-24 h-24 mb-2">
          <Image
            src={jersey.imageUrl}
            alt={jersey.name}
            fill
            className="object-contain"
          />
        </div>
        {showFullInfo ? (
          <div className="space-y-1 w-full">
            <p className="text-sm font-medium text-center line-clamp-2">
              {club.name}
            </p>
            <p className="text-xs text-muted-foreground text-center">
              {tJerseyType(
                jersey.type as
                  | "HOME"
                  | "AWAY"
                  | "THIRD"
                  | "FOURTH"
                  | "GOALKEEPER"
                  | "SPECIAL"
              )}{" "}
              • {jersey.season}
            </p>
          </div>
        ) : (
          <p className="text-sm font-medium text-center">
            {tJerseyType(
              jersey.type as
                | "HOME"
                | "AWAY"
                | "THIRD"
                | "FOURTH"
                | "GOALKEEPER"
                | "SPECIAL"
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
