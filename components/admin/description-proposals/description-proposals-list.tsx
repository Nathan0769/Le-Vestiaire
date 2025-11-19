"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Check, X, Clock, Loader2, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { JerseyType } from "@prisma/client";
import Link from "next/link";

interface ProposalUser {
  id: string;
  name: string;
  email: string;
  username: string | null;
}

interface ProposalJersey {
  id: string;
  name: string;
  season: string;
  type: JerseyType;
  description: string | null;
  club: {
    id: string;
    name: string;
    shortName: string;
    league: {
      id: string;
      name: string;
    };
  };
}

interface DescriptionProposal {
  id: string;
  description: string;
  createdAt: string;
  user: ProposalUser;
  jersey: ProposalJersey;
}

type ActionType = "approve" | "reject" | null;

export function DescriptionProposalsList() {
  const tJerseyType = useTranslations("JerseyType");
  const t = useTranslations("Proposals.Admin.DescriptionProposals");
  const [proposals, setProposals] = useState<DescriptionProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<DescriptionProposal | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadProposals = async () => {
    try {
      const response = await fetch("/api/admin/description-proposals");
      if (!response.ok) {
        throw new Error(t("errorLoading"));
      }
      const data = await response.json();
      setProposals(data);
    } catch (error) {
      console.error("Error loading proposals:", error);
      toast.error(t("errorLoading"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, []);

  const openDialog = (proposal: DescriptionProposal, type: "approve" | "reject") => {
    setSelectedProposal(proposal);
    setActionType(type);
    if (type === "approve") {
      setDialogOpen(true);
    } else {
      setRejectDialogOpen(true);
    }
  };

  const handleApprove = async () => {
    if (!selectedProposal) return;

    setActionLoading(selectedProposal.id);
    setDialogOpen(false);

    try {
      const response = await fetch(
        `/api/admin/description-proposals/${selectedProposal.id}/approve`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t("errorApprove"));
      }

      toast.success(t("approveSuccess"));
      await loadProposals();
    } catch (error) {
      console.error("Error approving proposal:", error);
      toast.error(
        error instanceof Error ? error.message : t("errorApprove")
      );
    } finally {
      setActionLoading(null);
      setSelectedProposal(null);
      setActionType(null);
    }
  };

  const handleReject = async () => {
    if (!selectedProposal) return;

    setActionLoading(selectedProposal.id);
    setRejectDialogOpen(false);

    try {
      const response = await fetch(
        `/api/admin/description-proposals/${selectedProposal.id}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: rejectionReason || undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t("errorReject"));
      }

      toast.success(t("rejectSuccess"));
      await loadProposals();
    } catch (error) {
      console.error("Error rejecting proposal:", error);
      toast.error(
        error instanceof Error ? error.message : t("errorReject")
      );
    } finally {
      setActionLoading(null);
      setSelectedProposal(null);
      setActionType(null);
      setRejectionReason("");
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Clock className="w-16 h-16 text-muted-foreground/30 mb-6" />
        <h2 className="text-xl font-medium text-muted-foreground mb-2">
          {t("emptyStateTitle")}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {t("emptyStateDescription")}
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
              <div className="space-y-4">
                {/* Header avec infos du maillot */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      {proposal.jersey.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{proposal.jersey.club.name}</span>
                      <span>•</span>
                      <span>{proposal.jersey.season}</span>
                      <span>•</span>
                      <Badge variant="secondary" className="text-xs">
                        {tJerseyType(proposal.jersey.type)}
                      </Badge>
                      <span>•</span>
                      <Link
                        href={`/jerseys/${proposal.jersey.club.league.id}/clubs/${proposal.jersey.club.id}/jerseys/${proposal.jersey.id}`}
                        className="text-primary hover:underline text-xs"
                      >
                        {t("viewJersey")}
                      </Link>
                    </div>
                  </div>
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>

                {/* Description actuelle */}
                {proposal.jersey.description && (
                  <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
                    <Label className="text-sm font-medium mb-2 block">
                      {t("currentDescription")}
                    </Label>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {proposal.jersey.description}
                    </p>
                  </div>
                )}

                {/* Nouvelle description proposée */}
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                  <Label className="text-sm font-medium mb-2 block text-primary">
                    {proposal.jersey.description ? t("proposedImprovement") : t("proposedDescription")}
                  </Label>
                  <p className="text-sm whitespace-pre-wrap">
                    {proposal.description}
                  </p>
                </div>

                {/* Infos utilisateur et date */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="font-medium">{t("proposedBy")}</span>{" "}
                      {proposal.user.name} ({proposal.user.email})
                    </div>
                    <div>
                      <span className="font-medium">{t("date")}</span>{" "}
                      {formatDate(proposal.createdAt)}
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => openDialog(proposal, "approve")}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                      size="sm"
                    >
                      {isProcessing && actionType === "approve" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          {t("approve")}
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
                      {isProcessing && actionType === "reject" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          {t("reject")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialog d'approbation */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("approveDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("approveDialogDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              {t("confirmApprove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de rejet */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rejectDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("rejectDialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejectionReason">{t("rejectionReason")}</Label>
            <Textarea
              id="rejectionReason"
              placeholder={t("rejectionReasonPlaceholder")}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              className="cursor-pointer"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              className="cursor-pointer"
            >
              {t("confirmReject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
