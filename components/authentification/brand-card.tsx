"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { BrandInfo } from "@/types/authentication";

interface BrandCardProps {
  brand: BrandInfo;
}

export function BrandCard({ brand }: BrandCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/authentification/${brand.id}`);
  };

  return (
    <Card
      onClick={handleClick}
      className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
    >
      <CardContent className="flex flex-col items-center justify-center p-6">
        <div className="relative w-20 h-20 mb-4">
          <Image
            src={brand.logo}
            alt={brand.name}
            fill
            sizes="80px"
            className="object-contain dark:hidden"
          />

          <Image
            src={brand.logoDark}
            alt={brand.name}
            fill
            sizes="80px"
            className="object-contain hidden dark:block"
          />
        </div>
        <h3 className="text-center text-lg font-semibold mb-2">{brand.name}</h3>
        <p className="text-center text-sm text-muted-foreground">
          {brand.description}
        </p>
      </CardContent>
    </Card>
  );
}
