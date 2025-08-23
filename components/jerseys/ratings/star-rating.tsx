"use client";

import { useState, useEffect } from "react";
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

export function StarRating({ jerseyId, readonly = false }: StarRatingProps) {
  const [ratingData, setRatingData] = useState<RatingData>({
    averageRating: 0,
    totalRatings: 0,
  });
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRatingData = async () => {
      try {
        const response = await fetch(`/api/jerseys/${jerseyId}/rating`);
        if (response.ok) {
          const data: RatingData = await response.json();
          setRatingData(data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des ratings:", error);
      }
    };

    fetchRatingData();
  }, [jerseyId]);

  // Gérer le clic sur une étoile
  const handleStarClick = async (rating: number) => {
    if (readonly || !user || isSubmitting) return;

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
        // Recharger les données après mise à jour
        const updatedResponse = await fetch(`/api/jerseys/${jerseyId}/rating`);
        if (updatedResponse.ok) {
          const data: RatingData = await updatedResponse.json();
          setRatingData(data);
        }
      } else {
        const errorData = await response.json();
        console.error("Erreur:", errorData.error);
        // Ici vous pourriez ajouter une notification d'erreur
      }
    } catch (error) {
      console.error("Erreur lors de la soumission du rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatage de l'affichage
  const displayRating = ratingData.averageRating.toFixed(2);
  const totalVotes = ratingData.totalRatings.toLocaleString();

  return (
    <div className="space-y-3">
      {/* Étoiles */}
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => {
          const starValue = index + 1;
          const isHovered = !readonly && hoverRating >= starValue;

          // Logique pour afficher les étoiles en fonction de la note moyenne
          const averageRating = ratingData.averageRating;
          let starDisplay: "empty" | "half" | "full";

          if (averageRating >= starValue) {
            starDisplay = "full";
          } else if (averageRating >= starValue - 0.5) {
            starDisplay = "half";
          } else {
            starDisplay = "empty";
          }

          return (
            <div key={index} className="relative">
              {/* Étoile de base (contour) */}
              <Star
                className={`w-6 h-6 transition-colors ${
                  readonly
                    ? starDisplay !== "empty"
                      ? "text-yellow-500 stroke-yellow-500"
                      : "text-muted-foreground/40 stroke-muted-foreground/40"
                    : user
                    ? `cursor-pointer ${
                        isHovered
                          ? "text-yellow-500 fill-yellow-500 stroke-yellow-500"
                          : starDisplay !== "empty"
                          ? "text-yellow-500 stroke-yellow-500 stroke-2 hover:fill-yellow-400"
                          : "text-muted-foreground/40 stroke-muted-foreground/40 hover:stroke-yellow-400"
                      }`
                    : starDisplay !== "empty"
                    ? "text-yellow-500 stroke-yellow-500 stroke-2"
                    : "text-muted-foreground/40 stroke-muted-foreground/40"
                } ${isSubmitting ? "opacity-50" : ""} fill-none`}
                strokeWidth={2}
                onMouseEnter={() =>
                  !readonly && user && setHoverRating(starValue)
                }
                onMouseLeave={() => !readonly && user && setHoverRating(0)}
                onClick={() => handleStarClick(starValue)}
              />

              {/* Remplissage pour demi-étoile ou étoile complète */}
              {!isHovered && starDisplay !== "empty" && (
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{
                    clipPath:
                      starDisplay === "half"
                        ? "inset(0 50% 0 0)" // Moitié gauche seulement
                        : "none",
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
        {user && ratingData.userRating && (
          <div className="text-xs text-primary">
            Votre note : {ratingData.userRating}/5
          </div>
        )}
      </div>
    </div>
  );
}
