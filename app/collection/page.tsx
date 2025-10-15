import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CollectionStats } from "@/components/collection/collection-stats";
import { CollectionGrid } from "@/components/collection/collection-grid";
import { Package } from "lucide-react";
import type { CollectionItemWithJersey } from "@/types/collection-page";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function CollectionPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const collectionItemsRaw = await prisma.userJersey.findMany({
    where: {
      userId: user.id,
    },
    include: {
      jersey: {
        include: {
          club: {
            include: {
              league: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const collectionItems: CollectionItemWithJersey[] = await Promise.all(
    collectionItemsRaw.map(async (item) => {
      let userPhotoUrl = null;

      if (item.userPhotoUrl) {
        const { data } = await supabaseAdmin.storage
          .from("user-jersey-photos")
          .createSignedUrl(item.userPhotoUrl, 60 * 60);
        userPhotoUrl = data?.signedUrl || null;
      }

      return {
        ...item,
        purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
        isGift: item.isGift,
        isFromMysteryBox: item.isFromMysteryBox,
        userPhotoUrl: userPhotoUrl,
        jersey: {
          ...item.jersey,
          retailPrice: item.jersey.retailPrice
            ? Number(item.jersey.retailPrice)
            : null,
        },
      };
    })
  );

  if (collectionItems.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <Package className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">Ma Collection</h1>
          <span className="px-3 py-1 bg-muted rounded-full text-sm font-medium">
            0 maillot
          </span>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="w-16 h-16 text-muted-foreground/30 mb-6" />
          <h2 className="text-xl font-medium text-muted-foreground mb-2">
            Votre collection est vide
          </h2>
          <p className="text-muted-foreground max-w-md">
            Commencez à construire votre collection en ajoutant vos premiers
            maillots !
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Package className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold">Ma Collection</h1>
        <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
          {collectionItems.length} maillot
          {collectionItems.length > 1 ? "s" : ""}
        </span>
      </div>

      <CollectionStats collectionItems={collectionItems} />

      <CollectionGrid collectionItems={collectionItems} />
    </div>
  );
}
