import { notFound } from "next/navigation";
import type { JerseyWithWishlistAndCollection } from "@/types/jersey";
import Image from "next/image";
import { JerseyBreadcrumb } from "@/components/jerseys/jerseys/jerseys-bread-crumb";
import { StarRating } from "@/components/jerseys/ratings/star-rating";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { CollectionButton } from "@/components/collection/collection-button";

interface JerseyPageProps {
  params: Promise<{
    clubId: string;
    id: string;
  }>;
}

export default async function JerseyPage({ params }: JerseyPageProps) {
  const { id } = await params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/jerseys/${id}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    notFound();
  }

  const jersey: JerseyWithWishlistAndCollection = await res.json();

  const getJerseyTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case "home":
        return "Domicile";
      case "away":
        return "Extérieur";
      case "third":
        return "Third";
      case "fourth":
        return "Fourth";
      case "special":
        return "Spécial";
      case "goalkeeper":
        return "Gardien";
      default:
        return type;
    }
  };

  return (
    <div className="p-6 space-y-8">
      <JerseyBreadcrumb
        leagueName={jersey.club.league.name}
        leagueId={jersey.club.league.id}
        clubName={jersey.club.name}
        clubId={jersey.club.id}
        jerseyName={jersey.name}
      />

      <main className="flex flex-col lg:flex-row gap-8 p-6 max-w-6xl mx-auto">
        {/* Jersey Image */}
        <div className="w-full lg:w-1/2">
          <Image
            src={jersey.imageUrl}
            alt={jersey.name}
            width={800}
            height={800}
            className="rounded-xl object-contain w-full h-auto max-h-[600px] bg-white"
          />
        </div>

        {/* Jersey Info Card */}
        <div className="w-full lg:w-1/2">
          <div className="bg-card border border-border rounded-xl shadow-lg p-6 h-full flex flex-col justify-between">
            {/* Header Section */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-4">
                  {jersey.name}
                </h1>

                {/* Jersey Details - One per line */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm font-medium text-muted-foreground">
                      Club
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {jersey.club.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm font-medium text-muted-foreground">
                      Saison
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {jersey.season}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm font-medium text-muted-foreground">
                      Marque
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {jersey.brand}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm font-medium text-muted-foreground">
                      Type
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {getJerseyTypeLabel(jersey.type)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Star Rating Component */}
              <div className="pt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Évaluation communautaire
                </h3>
                <StarRating jerseyId={jersey.id} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-8 pt-6 border-t border-border/50">
              <div className="flex flex-col sm:flex-row gap-3">
                <CollectionButton
                  jerseyId={jersey.id}
                  initialIsInCollection={jersey.isInCollection}
                />
                <WishlistButton
                  jerseyId={jersey.id}
                  initialIsInWishlist={jersey.isInWishlist}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
