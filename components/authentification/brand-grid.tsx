import type { BrandInfo } from "@/types/authentication";
import { BrandCard } from "./brand-card";

interface BrandGridProps {
  brands: BrandInfo[];
}

export function BrandGrid({ brands }: BrandGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {brands.map((brand) => (
        <BrandCard key={brand.id} brand={brand} />
      ))}
    </div>
  );
}
