"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { JerseyType } from "@prisma/client";
import { toast } from "sonner";
import { Clock } from "lucide-react";

const JERSEY_TYPE_LABELS: Record<JerseyType, string> = {
  HOME: "Domicile",
  AWAY: "Extérieur",
  THIRD: "Third",
  FOURTH: "Fourth",
  GOALKEEPER: "Gardien",
  SPECIAL: "Spécial",
};

interface Proposal {
  id: string;
  name: string;
  season: string;
  type: JerseyType;
  brand: string;
  imageUrl: string;
  description: string | null;
  createdAt: string;
  club: {
    id: string;
    name: string;
    shortName: string;
    logoUrl: string;
  };
}

export function MyProposalsList() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProposals = async () => {
      try {
        const response = await fetch("/api/jersey-proposals");
        if (!response.ok) {
          throw new Error("Erreur chargement propositions");
        }
        const data = await response.json();
        setProposals(data);
      } catch (error) {
        console.error("Erreur chargement propositions:", error);
        toast.error("Impossible de charger vos propositions");
      } finally {
        setIsLoading(false);
      }
    };

    loadProposals();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Clock className="w-16 h-16 text-muted-foreground/30 mb-6" />
        <h2 className="text-xl font-medium text-muted-foreground mb-2">
          Aucune proposition
        </h2>
        <p className="text-muted-foreground max-w-md">
          Vous n&apos;avez pas encore soumis de proposition de maillot.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {proposals.map((proposal) => (
        <div
          key={proposal.id}
          className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className="relative aspect-square bg-muted">
            <Image
              src={proposal.imageUrl}
              alt={proposal.name}
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          <div className="p-4">
            <h3 className="font-medium text-sm line-clamp-2 mb-3">
              {proposal.name}
            </h3>

            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <Image
                src={proposal.club.logoUrl}
                alt={proposal.club.name}
                width={16}
                height={16}
                className="object-contain"
                unoptimized
              />
              <span className="truncate">{proposal.club.name}</span>
              <span>•</span>
              <span>{proposal.season}</span>
              <span>•</span>
              <span>{JERSEY_TYPE_LABELS[proposal.type]}</span>
            </div>

            <div className="text-xs text-muted-foreground mb-3">
              <span>Marque: {proposal.brand}</span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <Badge
                variant="default"
                className="bg-yellow-500 hover:bg-yellow-600 text-xs"
              >
                En attente
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDate(proposal.createdAt)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
