"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Club } from "@prisma/client";

type Props = {
  club: Club;
  leagueId: string;
};

export function ClubCard({ club, leagueId }: Props) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/jerseys/${leagueId}/clubs/${club.id}`);
  };

  return (
    <Card
      onClick={handleClick}
      className="cursor-pointer transition-all hover:shadow-lg"
    >
      <CardContent className="flex flex-col items-center justify-center p-6">
        <div className="relative w-16 h-16 mb-4">
          <Image
            src={club.logoUrl}
            alt={club.name}
            fill
            className="object-contain"
          />
        </div>
        <p className="text-center text-sm font-medium">{club.name}</p>
      </CardContent>
    </Card>
  );
}
