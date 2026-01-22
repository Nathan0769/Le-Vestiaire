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
import { Check, X, Clock, Loader2, CheckCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/hooks/useCurrentUser";

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
  const tJerseyType = useTranslations("JerseyType");
  const t = useTranslations("Proposals.Admin");
  const user = useCurrentUser();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null
  );
  const [actionType, setActionType] = useState<ActionType>(null);
  const [approveAllDialogOpen, setApproveAllDialogOpen] = useState(false);
  const [approveAllLoading, setApproveAllLoading] = useState(false);

  const isSuperAdmin = user?.role === "superadmin";

  const loadProposals = async () => {
    try {
      const response = await fetch("/api/admin/proposals");
      if (!response.ok) {
        throw new Error(t("errorLoading"));
      }
      const data = await response.json();
      setProposals(data.proposals);
    } catch (error) {
      console.error("Error loading proposals:", error);
      toast.error(t("errorLoadingToast"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, [t]);

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
          ? t("approveSuccess")
          : t("rejectSuccess")
      );

      await loadProposals();
    } catch (error) {
      console.error("Error performing action:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'action"
      );
    } finally {
      setActionLoading(null);
      setSelectedProposal(null);
      setActionType(null);
    }
  };

  const handleApproveAll = async () => {
    setApproveAllDialogOpen(false);
    setApproveAllLoading(true);

    let approved = 0;
    let failed = 0;

    for (const proposal of proposals) {
      try {
        const response = await fetch(
          `/api/admin/proposals/${proposal.id}/approve`,
          { method: "POST" }
        );

        if (response.ok) {
          approved++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    setApproveAllLoading(false);

    if (failed === 0) {
      toast.success(t("approveAllSuccess", { count: approved }));
    } else {
      toast.warning(t("approveAllPartial", { approved, failed }));
    }

    await loadProposals();
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
      {isSuperAdmin && proposals.length > 1 && (
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => setApproveAllDialogOpen(true)}
            disabled={approveAllLoading}
            className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
          >
            {approveAllLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4 mr-2" />
            )}
            {approveAllLoading
              ? t("approveAllLoading")
              : t("approveAllButton", { count: proposals.length })}
          </Button>
        </div>
      )}

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
                        {tJerseyType(proposal.type)}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-sm">
                    <p>
                      <span className="font-medium">{t("brandLabel")}</span>{" "}
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
                      <span className="font-medium">{t("proposedByLabel")}</span>{" "}
                      {proposal.user.name} ({proposal.user.email})
                    </div>
                    <div>
                      <span className="font-medium">{t("contributionsLabel")}</span>{" "}
                      {proposal.user.approvedContributionsCount}/
                      {proposal.user.contributionsCount}
                    </div>
                    <div>
                      <span className="font-medium">{t("dateLabel")}</span>{" "}
                      {formatDate(proposal.createdAt)}
                    </div>
                  </div>
                </div>

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
                        {t("approveButton")}
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
                        {t("rejectButton")}
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
                ? t("approveDialogTitle")
                : t("rejectDialogTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "approve"
                ? t.rich("approveDialogDescription", {
                    jerseyName: selectedProposal?.name || "",
                    strong: (chunks) => <strong>{chunks}</strong>,
                  })
                : t.rich("rejectDialogDescription", {
                    jerseyName: selectedProposal?.name || "",
                    strong: (chunks) => <strong>{chunks}</strong>,
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={
                actionType === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-destructive hover:bg-destructive/90"
              }
            >
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={approveAllDialogOpen} onOpenChange={setApproveAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("approveAllDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("approveAllDialogDescription", { count: proposals.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveAll}
              className="bg-green-600 hover:bg-green-700"
            >
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
