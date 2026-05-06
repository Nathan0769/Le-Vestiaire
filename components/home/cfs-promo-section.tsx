import { Button } from "@/components/ui/button";
import { CFS_CLEARANCE_URL } from "@/lib/cfs-affiliate";

interface CfsPromo {
  id: string;
  name: string;
  imageUrl: string;
  price: string;
  promoPrice: string;
  affiliateUrl: string;
  club: string | null;
  brand: string | null;
}

interface CfsPromoSectionProps {
  promos: CfsPromo[];
}

export function CfsPromoSection({ promos }: CfsPromoSectionProps) {
  if (promos.length === 0) return null;

  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Complétez votre collection à petit prix
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Sélection de maillots en destockage chez notre partenaire Classic Football Shirts
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
          {promos.map((promo) => {
            const price = parseFloat(promo.price);
            const promoPrice = parseFloat(promo.promoPrice);
            const discount = Math.round(((price - promoPrice) / price) * 100);

            return (
              <a
                key={promo.id}
                href={promo.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="group relative"
              >
                <div className="relative">
                  {discount > 0 && (
                    <div className="absolute -top-2 -right-2 z-10 bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                      -{discount}%
                    </div>
                  )}

                  <div className="aspect-square bg-white rounded-lg border border-border overflow-hidden mb-3 group-hover:shadow-lg transition-all duration-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={promo.imageUrl}
                      alt={promo.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {promo.name}
                    </h3>

                    {(promo.club || promo.brand) && (
                      <p className="text-xs text-muted-foreground">
                        {[promo.club, promo.brand].filter(Boolean).join(" • ")}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground line-through">
                        {price.toFixed(2)} €
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        {promoPrice.toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-3">
          <Button asChild className="gap-2">
            <a
              href={CFS_CLEARANCE_URL}
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              Voir tous les bons plans
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">
            Lien partenaire — nous percevons une commission sur les achats effectués via ces liens.
          </p>
        </div>
      </div>
    </section>
  );
}
