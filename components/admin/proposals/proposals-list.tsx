"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { JerseyType } from "@prisma/client";
import { toast } from "sonner";
import { Check, X, Clock, Loader2 } from "lucide-react";

const JERSEY_TYPE_LABELS: Record<JerseyType, string> = {
  HOME: "Domicile",
  AWAY: "Extérieur",
  THIRD: "Third",
  FOURTH: "Fourth",
  GOALKEEPER: "Gardien",
  SPECIAL: "Spécial",
};

interface ProposalUser {
  id: string;
  name: string;
  email: string;
  username: string | null;
  contributionsCount: number;
  approvedContributionsCount: number;
}

interface ProposalClub {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string;
}

interface Proposal {
  id: string;
  name: string;
  season: string;
  type: JerseyType;
  brand: string;
  imageUrl: string;
  description: string | null;
  createdAt: string;
  user: ProposalUser;
  club: ProposalClub;
}

type ActionType = "approve" | "reject" | null;

export function ProposalsList() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null
  );
  const [actionType, setActionType] = useState<ActionType>(null);

  const loadProposals = async () => {
    try {
      const response = await fetch("/api/admin/proposals");
      if (!response.ok) {
        throw new Error("Erreur chargement propositions");
      }
      const data = await response.json();
      setProposals(data.proposals);
    } catch (error) {
      console.error("Erreur chargement propositions:", error);
      toast.error("Impossible de charger les propositions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, []);

  const openDialog = (proposal: Proposal, type: "approve" | "reject") => {
    setSelectedProposal(proposal);
    setActionType(type);
    setDialogOpen(true);
  };

  const handleAction = async () => {
    if (!selectedProposal || !actionType) return;

    setActionLoading(selectedProposal.id);
    setDialogOpen(false);

    try {
      const response = await fetch(
        `/api/admin/proposals/${selectedProposal.id}/${actionType}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'action");
      }

      toast.success(
        actionType === "approve"
          ? "Proposition approuvée avec succès !"
          : "Proposition rejetée"
      );

      await loadProposals();
    } catch (error) {
      console.error("Erreur action:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'action"
      );
    } finally {
      setActionLoading(null);
      setSelectedProposal(null);
      setActionType(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
          Aucune proposition en attente
        </h2>
        <p className="text-muted-foreground max-w-md">
          Il n&apos;y a actuellement aucune proposition de maillot à examiner.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {proposals.map((proposal) => {
          const isProcessing = actionLoading === proposal.id;

          return (
            <div
              key={proposal.id}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex gap-6">
                <div className="relative w-32 h-32 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={proposal.imageUrl}
                    alt={proposal.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      {proposal.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Image
                        src={proposal.club.logoUrl}
                        alt={proposal.club.name}
                        width={20}
                        height={20}
                        className="object-contain"
                        unoptimized
                      />
                      <span>{proposal.club.name}</span>
                      <span>•</span>
                      <span>{proposal.season}</span>
                      <span>•</span>
                      <Badge variant="secondary" className="text-xs">
                        {JERSEY_TYPE_LABELS[proposal.type]}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-sm">
                    <p>
                      <span className="font-medium">Marque:</span>{" "}
                      {proposal.brand}
                    </p>
                    {proposal.description && (
                      <p className="text-muted-foreground mt-1">
                        {proposal.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <div>
                      <span className="font-medium">Proposé par:</span>{" "}
                      {proposal.user.name} ({proposal.user.email})
                    </div>
                    <div>
                      <span className="font-medium">Contributions:</span>{" "}
                      {proposal.user.approvedContributionsCount}/
                      {proposal.user.contributionsCount}
                    </div>
                    <div>
                      <span className="font-medium">Le:</span>{" "}
                      {formatDate(proposal.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 justify-center">
                  <Button
                    onClick={() => openDialog(proposal, "approve")}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                    size="sm"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Approuver
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => openDialog(proposal, "reject")}
                    disabled={isProcessing}
                    variant="destructive"
                    className="cursor-pointer"
                    size="sm"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Rejeter
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve"
                ? "Approuver cette proposition ?"
                : "Rejeter cette proposition ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "approve" ? (
                <>
                  Le maillot <strong>{selectedProposal?.name}</strong> sera
                  ajouté à la base de données et le contributeur sera crédité.
                </>
              ) : (
                <>
                  La proposition <strong>{selectedProposal?.name}</strong> sera
                  supprimée définitivement. Cette action est irréversible.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={
                actionType === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-destructive hover:bg-destructive/90"
              }
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
