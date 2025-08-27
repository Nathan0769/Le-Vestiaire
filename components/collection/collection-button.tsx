"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { AddToCollectionModal } from "./modal-add-collection";
import type {
  AddToCollectionData,
  CollectionResponse,
} from "@/types/collection";

interface CollectionButtonProps {
  jerseyId: string;
  initialIsInCollection?: boolean;
}

export function CollectionButton({
  jerseyId,
  initialIsInCollection = false,
}: CollectionButtonProps) {
  const [isInCollection, setIsInCollection] = useState(initialIsInCollection);
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
          setIsInCollection(data.isInCollection);
        }
      } catch (err) {
        console.error("Erreur de synchro collection:", err);
      }
    };

    fetchCollectionState();
  }, [jerseyId, user]);

  const handleAddToCollection = async (data: AddToCollectionData) => {
    if (!user) {
      toast.error("Vous devez être connecté pour ajouter à votre collection");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/jerseys/${jerseyId}/collection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsInCollection(true);
        setShowModal(false);
        toast.success("Maillot ajouté à votre collection");
      } else {
        toast.error(result.error || "Une erreur est survenue");
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout à la collection:", error);
      toast.error("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromCollection = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/jerseys/${jerseyId}/collection`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsInCollection(false);
        toast.success("Maillot retiré de votre collection");
      } else {
        toast.error(result.error || "Une erreur est survenue");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la collection:", error);
      toast.error("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (!user) {
      toast.error("Vous devez être connecté pour gérer votre collection");
      return;
    }

    if (isInCollection) {
      handleRemoveFromCollection();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <Button
        className="flex-1 h-11 font-medium shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleButtonClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            <span>Chargement...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {isInCollection ? (
              <>
                <span>Dans ma collection</span>
              </>
            ) : (
              <>
                <span>Ajouter à ma collection</span>
              </>
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
