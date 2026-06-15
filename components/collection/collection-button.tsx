"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { AddToCollectionModal } from "./modal-add-collection";
import type { AddToCollectionData, CollectionResponse } from "@/types/collection";
import { useTranslations } from "next-intl";

interface CollectionButtonProps {
  jerseyId: string;
  initialIsInCollection?: boolean;
}

export function CollectionButton({
  jerseyId,
  initialIsInCollection = false,
}: CollectionButtonProps) {
  const t = useTranslations("Collection.button");
  const [count, setCount] = useState(initialIsInCollection ? 1 : 0);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCollectionState = async () => {
      if (!user) return;

      try {
        const res = await fetch(`/api/jerseys/${jerseyId}/collection`, {
          method: "GET",
          cache: "no-store",
        });
        if (res.ok) {
          const data: CollectionResponse = await res.json();
          setCount(data.count ?? (data.isInCollection ? 1 : 0));
        }
      } catch (err) {
        console.error("Erreur de synchro collection:", err);
      }
    };

    fetchCollectionState();
  }, [jerseyId, user]);

  const handleAddToCollection = async (data: AddToCollectionData) => {
    if (!user) {
      toast.error(t("toast.mustBeConnected"));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/jerseys/${jerseyId}/collection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setCount((prev) => prev + 1);
        setShowModal(false);
        if (result.removedFromWishlist) {
          toast.custom(
            (id) => (
              <div className="flex items-center justify-between gap-4 bg-background border rounded-lg px-4 py-3 shadow-lg w-full">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="text-sm font-medium text-foreground">{t("toast.added")}</p>
                  <p className="text-sm text-muted-foreground">{t("toast.wishlistRemoved")}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 cursor-pointer"
                  onClick={async () => {
                    toast.dismiss(id);
                    await fetch(`/api/jerseys/${jerseyId}/wishlist`, { method: "POST" });
                  }}
                >
                  {t("toast.wishlistRemovedUndo")}
                </Button>
              </div>
            ),
            { duration: 9000 }
          );
        } else {
          toast.success(t("toast.added"));
        }
      } else {
        toast.error(result.error || t("toast.error"));
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout à la collection:", error);
      toast.error(t("toast.connectionError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (!user) {
      toast.error(t("toast.manageError"));
      return;
    }
    setShowModal(true);
  };

  return (
    <>
      <Button
        className="flex-1 h-11 font-medium shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleButtonClick}
        disabled={isLoading}
        variant={count > 0 ? "secondary" : "default"}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            <span>{t("loading")}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span>{t("addToCollection")}</span>
            {count > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                {count}
              </span>
            )}
          </div>
        )}
      </Button>

      <AddToCollectionModal
        open={showModal}
        onOpenChange={setShowModal}
        onSubmit={handleAddToCollection}
        isLoading={isLoading}
      />
    </>
  );
}
