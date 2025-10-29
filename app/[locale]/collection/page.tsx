import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { CollectionStats } from "@/components/collection/collection-stats";
import { CollectionGrid } from "@/components/collection/collection-grid";
import CollectionLanding from "@/components/collection/collection-landing";
import { Package, AlertCircle, RefreshCw } from "lucide-react";
import type { CollectionItemWithJersey } from "@/types/collection-page";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Ma Collection de Maillots de Foot | Le Vestiaire - Gérez et Cataloguez vos Maillots",
  description:
    "Gérez votre collection de maillots de football : cataloguez tailles, états, prix, ajoutez vos photos et suivez vos statistiques. Comparez avec vos amis collectionneurs.",
  keywords: [
    "collection maillots foot",
    "gérer collection maillots football",
    "cataloguer maillots",
    "tracker maillots football",
    "application collection maillots",
    "organiser collection maillots",
    "statistiques collection maillots",
    "valeur collection maillots",
    "inventaire maillots football",
    "collectionneur maillots foot",
  ],
  openGraph: {
    title: "Collection de Maillots | Le Vestiaire Foot",
    description:
      "Cataloguez, organisez et suivez votre collection de maillots de football avec des statistiques détaillées",
    type: "website",
  },
};

export const revalidate = 3600;

export default async function CollectionPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <CollectionLanding />;
  }

  try {
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
          try {
            const { data, error } = await supabaseAdmin.storage
              .from("user-jersey-photos")
              .createSignedUrl(item.userPhotoUrl, 60 * 60);

            if (error) {
              console.error("Error creating signed URL:", error);
            } else {
              userPhotoUrl = data?.signedUrl || null;
            }
          } catch (error) {
            console.error("Exception creating signed URL:", error);
          }
        }

        return {
          ...item,
          purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
          isGift: item.isGift,
          isFromMysteryBox: item.isFromMysteryBox,
          userPhotoUrl,
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
  } catch (error) {
    console.error("Error loading collection:", error);

    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <Package className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">Ma Collection</h1>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-16 h-16 text-destructive/50 mb-6" />
          <h2 className="text-xl font-medium text-destructive mb-2">
            Erreur de chargement
          </h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Une erreur est survenue lors du chargement de votre collection.
            Veuillez rafraîchir la page ou réessayer ultérieurement.
          </p>
          <Link
            href="/collection"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Recharger la page
          </Link>
        </div>
      </div>
    );
  }
}
