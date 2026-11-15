"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Gift, PackageCheck } from "lucide-react";
import type { Size } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { AddToCollectionModal, type AddToCollectionJersey } from "@/components/collection/modal-add-collection";
import { WishlistGiftDialog, type WishlistGift } from "@/components/wishlist/wishlist-gift-dialog";
import type { AddToCollectionData } from "@/types/collection";

interface Props {
  wishlistId: string;
  jersey: AddToCollectionJersey;
  gift: WishlistGift;
  /** Taille la plus portée dans la collection, proposée si aucune n'est choisie. */
  suggestedSize: Size | null;
}

/** Infos cadeau d'une envie + « Je l'ai reçu » (ajout collection prérempli). */
export function WishlistGiftActions({ wishlistId, jersey, gift, suggestedSize }: Props) {
  const t = useTranslations("Wishlist.gift");
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [receivedOpen, setReceivedOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const size = gift.size ?? suggestedSize;

  const addReceived = async (data: AddToCollectionData) => {
    setSaving(true);
    try {
      // La route retire l'envie de la wishlist (et sa réservation avec) à l'ajout.
      const res = await fetch(`/api/jerseys/${jersey.id}/collection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        toast.error(body.error ?? t("error"));
        return;
      }
      setReceivedOpen(false);
      toast.success(t("receivedDone"));
      router.refresh();
    } catch {
      toast.error(t("error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Côte à côte s'il y a la place, sinon l'un sous l'autre (carte étroite en 4 colonnes). */}
      <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
        <Button variant="outline" size="sm" className="flex-1 basis-32 min-w-0 cursor-pointer" onClick={() => setEditOpen(true)}>
          <Gift className="w-3.5 h-3.5" /> {t("edit")}
        </Button>
        <Button variant="outline" size="sm" className="flex-1 basis-32 min-w-0 cursor-pointer" onClick={() => setReceivedOpen(true)}>
          <PackageCheck className="w-3.5 h-3.5" /> {t("received")}
        </Button>
      </div>

      <WishlistGiftDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        wishlistId={wishlistId}
        gift={gift}
        suggestedSize={suggestedSize}
        onSaved={() => router.refresh()}
      />

      <AddToCollectionModal
        open={receivedOpen}
        onOpenChange={setReceivedOpen}
        onSubmit={addReceived}
        isLoading={saving}
        jersey={jersey}
        initialValues={{
          ...(size ? { size } : {}),
          ...(gift.version ? { version: gift.version } : {}),
          playerName: gift.flockName || undefined,
          playerNumber: gift.flockNumber ?? undefined,
          condition: "MINT",
          isGift: true,
        }}
      />
    </>
  );
}
