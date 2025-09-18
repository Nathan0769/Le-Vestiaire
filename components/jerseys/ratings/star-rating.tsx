"use client";

import { useState, useEffect, useRef } from "react";
import { Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface StarRatingProps {
  jerseyId: string;
  readonly?: boolean;
}

interface RatingData {
  averageRating: number;
  totalRatings: number;
  userRating?: number;
}

interface ApiResponse extends RatingData {
  message?: string;
}

export function StarRating({ jerseyId, readonly = false }: StarRatingProps) {
  const [ratingData, setRatingData] = useState<RatingData>({
    averageRating: 0,
    totalRatings: 0,
  });
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimisticRating, setOptimisticRating] = useState<number | null>(null);
  const { user } = useAuth();

  // Ref pour éviter les appels multiples
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchRatingData();

    // Cleanup lors du démontage
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [jerseyId]);

  const fetchRatingData = async () => {
    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`/api/jerseys/${jerseyId}/rating`, {
        signal: abortControllerRef.current.signal,
      });

      if (response.ok) {
        const data: RatingData = await response.json();
        setRatingData(data);
        setOptimisticRating(null); // Reset optimistic update
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Erreur lors du chargement des ratings:", error);
      }
    }
  };

  // Gérer le clic sur une étoile (avec support des demi-étoiles)
  const handleStarClick = async (
    event: React.MouseEvent<HTMLDivElement>,
    starIndex: number
  ) => {
    if (readonly || !user || isSubmitting) return;

    // Calculer si c'est un clic sur la moitié gauche ou droite
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const starWidth = rect.width;
    const isLeftHalf = clickX < starWidth / 2;

    const rating = starIndex + (isLeftHalf ? 0.5 : 1);

    // Optimistic update - affichage immédiat
    setOptimisticRating(rating);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/jerseys/${jerseyId}/rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating }),
      });

      if (response.ok) {
        const data: ApiResponse = await response.json();
        // Mettre à jour avec les vraies données du serveur
        setRatingData({
          averageRating: data.averageRating,
          totalRatings: data.totalRatings,
          userRating: data.userRating,
        });
        setOptimisticRating(null);
      } else {
        const errorData = await response.json();
        console.error("Erreur:", errorData.error);
        // Revenir en arrière en cas d'erreur
        setOptimisticRating(null);
        // Ici tu peux ajouter une notification d'erreur
      }
    } catch (error) {
      console.error("Erreur lors de la soumission du rating:", error);
      setOptimisticRating(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour déterminer l'affichage d'une étoile
  const getStarDisplay = (
    starIndex: number
  ): { fill: number; isHovered: boolean } => {
    const starValue = starIndex + 1;

    // Si on est en train de hover
    if (!readonly && user && hoverRating > 0) {
      const hoverFill =
        hoverRating >= starValue ? 1 : hoverRating >= starValue - 0.5 ? 0.5 : 0;
      return { fill: hoverFill, isHovered: true };
    }

    // Si on a un optimistic update
    const displayRating = optimisticRating || ratingData.averageRating;

    let fill = 0;
    if (displayRating >= starValue) {
      fill = 1;
    } else if (displayRating >= starValue - 0.5) {
      fill = 0.5;
    }

    return { fill, isHovered: false };
  };

  // Gérer le hover pour les demi-étoiles
  const handleStarHover = (
    event: React.MouseEvent<HTMLDivElement>,
    starIndex: number
  ) => {
    if (readonly || !user) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const hoverX = event.clientX - rect.left;
    const starWidth = rect.width;
    const isLeftHalf = hoverX < starWidth / 2;

    setHoverRating(starIndex + (isLeftHalf ? 0.5 : 1));
  };

  const handleMouseLeave = () => {
    if (!readonly && user) {
      setHoverRating(0);
    }
  };

  // Formatage de l'affichage
  const displayRating = (optimisticRating || ratingData.averageRating).toFixed(
    1
  );
  const totalVotes = ratingData.totalRatings.toLocaleString();

  return (
    <div className="space-y-3">
      {/* Étoiles */}
      <div className="flex items-center gap-1" onMouseLeave={handleMouseLeave}>
        {Array.from({ length: 5 }).map((_, index) => {
          const { fill, isHovered } = getStarDisplay(index);

          return (
            <div
              key={index}
              className={`relative ${
                !readonly && user ? "cursor-pointer" : ""
              } ${isSubmitting ? "opacity-50" : ""}`}
              onClick={(e) => handleStarClick(e, index)}
              onMouseMove={(e) => handleStarHover(e, index)}
            >
              {/* Étoile de base */}
              <Star
                className={`w-6 h-6 transition-colors ${
                  fill > 0 || isHovered
                    ? "text-yellow-500 stroke-yellow-500"
                    : "text-muted-foreground/40 stroke-muted-foreground/40"
                }`}
                strokeWidth={2}
                fill="none"
              />

              {/* Remplissage pour demi-étoile ou étoile complète */}
              {fill > 0 && (
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{
                    clipPath: fill === 0.5 ? "inset(0 50% 0 0)" : "none",
                  }}
                >
                  <Star
                    className="w-6 h-6 text-yellow-500 fill-yellow-500 stroke-yellow-500"
                    strokeWidth={2}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Affichage des données */}
      <div className="flex flex-col space-y-1">
        <div className="text-lg font-semibold text-foreground">
          {displayRating} / 5
        </div>
        <div className="text-sm text-muted-foreground">
          {ratingData.totalRatings === 0
            ? "Aucune évaluation"
            : `${totalVotes} évaluation${
                ratingData.totalRatings > 1 ? "s" : ""
              }`}
        </div>
        {!user && !readonly && (
          <div className="text-xs text-muted-foreground italic">
            Connectez-vous pour noter ce maillot
          </div>
        )}
        {user && (optimisticRating || ratingData.userRating) && (
          <div className="text-xs text-primary">
            Votre note : {optimisticRating || ratingData.userRating}/5
          </div>
        )}
        {optimisticRating && (
          <div className="text-xs text-orange-500 italic">
            Mise à jour en cours...
          </div>
        )}
      </div>
    </div>
  );
}
