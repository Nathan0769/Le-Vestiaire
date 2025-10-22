"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { JerseyType } from "@prisma/client";
import { Club } from "@prisma/client";
import { getJerseyUrl } from "@/lib/jersey-url";

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

  const handleClick = () => {
    const identifier = jersey.slug || jersey.id;
    const url = getJerseyUrl(leagueId, club.id, identifier);
    router.push(url);
  };

  const getJerseyTypeLabel = (type: string) => {
    const typeLabels = {
      HOME: "Domicile",
      AWAY: "Extérieur",
      THIRD: "Third",
      FOURTH: "Fourth",
      GOALKEEPER: "Gardien",
      SPECIAL: "Spécial",
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
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
              {getJerseyTypeLabel(jersey.type)} • {jersey.season}
            </p>
          </div>
        ) : (
          <p className="text-sm font-medium capitalize text-center">
            {jersey.type.toLowerCase()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
