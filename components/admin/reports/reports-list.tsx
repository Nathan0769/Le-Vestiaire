"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
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
  Check,
  X,
  ExternalLink,
  Loader2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Category = "LETTERING" | "SEASON" | "BRAND" | "IMAGE" | "OTHER";
type Status = "PENDING" | "RESOLVED" | "REJECTED";
type Action = "RESOLVED" | "REJECTED";

interface Report {
  id: string;
  category: Category;
  description: string | null;
  status: Status;
  createdAt: string;
  resolvedAt: string | null;
  user: {
    id: string;
    username: string | null;
    name: string;
    avatar: string | null;
  };
  resolver: {
    id: string;
    username: string | null;
    name: string;
  } | null;
  jersey: {
    id: string;
    name: string;
    season: string;
    type: string;
    variant: number;
    imageUrl: string;
    slug: string | null;
    club: {
      id: string;
      name: string;
      shortName: string;
      logoUrl: string;
      league: { id: string; name: string };
    };
  };
}

function getCategoryColor(category: Category): string {
  switch (category) {
    case "LETTERING":
      return "bg-purple-500/15 text-purple-700 border-purple-300";
    case "SEASON":
      return "bg-blue-500/15 text-blue-700 border-blue-300";
    case "BRAND":
      return "bg-orange-500/15 text-orange-700 border-orange-300";
    case "IMAGE":
      return "bg-pink-500/15 text-pink-700 border-pink-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function ReportsList() {
  const t = useTranslations("Reports.Admin");
  const [status, setStatus] = useState<Status>("PENDING");
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dialogReport, setDialogReport] = useState<Report | null>(null);
  const [pendingAction, setPendingAction] = useState<Action | null>(null);

  const loadReports = useCallback(
    async (s: Status) => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/reports?status=${s}`);
        if (!response.ok) throw new Error(t("errorLoading"));
        const data = await response.json();
        setReports(data.reports);
      } catch (err) {
        console.error(err);
        toast.error(t("errorLoading"));
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    loadReports(status);
  }, [status, loadReports]);

  const handleAction = async (report: Report, action: Action) => {
    setActionLoading(report.id);
    try {
      const response = await fetch(`/api/admin/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("errorAction"));
      }
      toast.success(
        action === "RESOLVED" ? t("successResolved") : t("successRejected")
      );
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorAction"));
    } finally {
      setActionLoading(null);
      setDialogReport(null);
      setPendingAction(null);
    }
  };

  const buildJerseyUrl = (jersey: Report["jersey"]) => {
    const id = jersey.slug || jersey.id;
    return `/jerseys/${jersey.club.league.id}/clubs/${jersey.club.id}/jerseys/${id}`;
  };

  return (
    <>
      <Tabs value={status} onValueChange={(v) => setStatus(v as Status)}>
        <TabsList>
          <TabsTrigger value="PENDING">{t("tabPending")}</TabsTrigger>
          <TabsTrigger value="RESOLVED">{t("tabResolved")}</TabsTrigger>
          <TabsTrigger value="REJECTED">{t("tabRejected")}</TabsTrigger>
        </TabsList>

        <TabsContent value={status} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Clock className="w-12 h-12 mb-3 opacity-30" />
              <p>{t("empty")}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-xl border bg-card p-4 flex flex-row gap-4"
                >
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-md bg-[#FAF5EE] overflow-hidden shrink-0">
                    <Image
                      src={report.jersey.imageUrl}
                      alt={report.jersey.name}
                      fill
                      className="object-contain p-1.5"
                      unoptimized
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-start gap-2">
                      <Badge
                        variant="outline"
                        className={getCategoryColor(report.category)}
                      >
                        {t(`categories.${report.category}`)}
                      </Badge>
                      <h3 className="font-semibold text-base leading-tight">
                        {report.jersey.name}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {report.jersey.club.name} ·{" "}
                      {report.jersey.club.league.name}
                    </p>

                    {report.description && (
                      <p className="text-sm bg-muted/50 rounded-md p-3 whitespace-pre-wrap">
                        {report.description}
                      </p>
                    )}

                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>
                        {t("reportedBy")}{" "}
                        <span className="font-medium text-foreground">
                          {report.user.username || report.user.name}
                        </span>{" "}
                        {t("reportedOn")}{" "}
                        {format(new Date(report.createdAt), "dd MMM yyyy HH:mm", {
                          locale: fr,
                        })}
                      </p>
                      {report.status === "RESOLVED" && report.resolvedAt && (
                        <p>
                          {t("resolvedOn")}{" "}
                          {format(
                            new Date(report.resolvedAt),
                            "dd MMM yyyy HH:mm",
                            { locale: fr }
                          )}
                          {report.resolver && (
                            <>
                              {" "}
                              {t("by")}{" "}
                              <span className="font-medium text-foreground">
                                {report.resolver.username ||
                                  report.resolver.name}
                              </span>
                            </>
                          )}
                        </p>
                      )}
                      {report.status === "REJECTED" && report.resolvedAt && (
                        <p>
                          {t("rejectedOn")}{" "}
                          {format(
                            new Date(report.resolvedAt),
                            "dd MMM yyyy HH:mm",
                            { locale: fr }
                          )}
                          {report.resolver && (
                            <>
                              {" "}
                              {t("by")}{" "}
                              <span className="font-medium text-foreground">
                                {report.resolver.username ||
                                  report.resolver.name}
                              </span>
                            </>
                          )}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Link href={buildJerseyUrl(report.jersey)} target="_blank">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          {t("viewJersey")}
                        </Button>
                      </Link>

                      {report.status === "PENDING" && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            disabled={actionLoading === report.id}
                            onClick={() => {
                              setDialogReport(report);
                              setPendingAction("RESOLVED");
                            }}
                            className="cursor-pointer"
                          >
                            {actionLoading === report.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span className="ml-1.5">{t("resolve")}</span>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={actionLoading === report.id}
                            onClick={() => {
                              setDialogReport(report);
                              setPendingAction("REJECTED");
                            }}
                            className="cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span className="ml-1.5">{t("reject")}</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={!!dialogReport}
        onOpenChange={(open) => {
          if (!open) {
            setDialogReport(null);
            setPendingAction(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction === "RESOLVED" ? t("resolve") : t("reject")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogReport?.jersey.name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              {t("confirmCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              onClick={() => {
                if (dialogReport && pendingAction) {
                  handleAction(dialogReport, pendingAction);
                }
              }}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : pendingAction === "RESOLVED" ? (
                <Check className="w-4 h-4" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
