"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { League } from "../../../types/league";

type Props = {
  league: League;
};

export function LeagueCard({ league }: Props) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/jerseys/${league.id}`);
  };

  return (
    <Card
      onClick={handleClick}
      className="cursor-pointer transition-all hover:shadow-lg"
    >
      <CardContent className="flex flex-col items-center justify-center p-6">
        <div className="relative w-16 h-16 mb-4">
          {league.logoDarkUrl ? (
            <>
              <Image
                src={league.logoUrl}
                alt={league.name}
                fill
                sizes="64px"
                className="object-contain dark:hidden"
              />

              <Image
                src={league.logoDarkUrl}
                alt={league.name}
                fill
                sizes="64px"
                className="object-contain hidden dark:block"
              />
            </>
          ) : (
            <Image
              src={league.logoUrl}
              alt={league.name}
              fill
              sizes="64px"
              className="object-contain"
            />
          )}
        </div>
        <p className="text-center text-sm font-medium">{league.name}</p>
      </CardContent>
    </Card>
  );
}
