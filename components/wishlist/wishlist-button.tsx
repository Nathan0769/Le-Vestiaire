"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, HeartOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface WishlistButtonProps {
  jerseyId: string;
  initialIsInWishlist: boolean;
}

export function WishlistButton({
  jerseyId,
  initialIsInWishlist,
}: WishlistButtonProps) {
  const t = useTranslations("Wishlist.button");
  const [isInWishlist, setIsInWishlist] = useState(initialIsInWishlist);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchWishlistState = async () => {
      if (!user) return;

      try {
        const res = await fetch(`/api/jerseys/${jerseyId}/wishlist`, {
          method: "GET",
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setIsInWishlist(data.isInWishlist);
        }
      } catch (err) {
        console.error("Erreur de synchro wishlist:", err);
      }
    };

    fetchWishlistState();
  }, [jerseyId, user]);

  const handleWishlistToggle = async () => {
    if (!user) {
      toast.error(t("toast.mustBeConnected"));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/jerseys/${jerseyId}/wishlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsInWishlist(data.isInWishlist);

        if (data.isInWishlist) {
          toast.success(t("toast.added"));
        } else {
          toast.success(t("toast.removed"));
        }
      } else {
        toast.error(data.error || t("toast.error"));
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la wishlist:", error);
      toast.error(t("toast.connectionError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="flex-1 h-11 font-medium shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleWishlistToggle}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          <span>{t("loading")}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {isInWishlist ? (
            <>
              <HeartOff className="w-4 h-4" />
              <span>{t("removeFromWishlist")}</span>
            </>
          ) : (
            <>
              <Heart className="w-4 h-4" />
              <span>{t("addToWishlist")}</span>
            </>
          )}
        </div>
      )}
    </Button>
  );
}
