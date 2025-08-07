"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { JerseyType } from "@prisma/client";

type Props = {
  jersey: {
    id: string;
    name: string;
    imageUrl: string;
    type: JerseyType;
  };
};

export function JerseyCard({ jersey }: Props) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/jerseys/${jersey.id}`);
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
        <p className="text-sm font-medium capitalize text-center">
          {jersey.type.toLowerCase()}
        </p>
      </CardContent>
    </Card>
  );
}
