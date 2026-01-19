"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Trophy, Pencil, Plus, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { ProposeDescriptionModal } from "./propose-description-modal";
import { PlayersDisplay } from "./players-display";
import Link from "next/link";

interface JerseyTabsProps {
  jerseyId: string;
  jerseyName: string;
  description?: string | null;
  clubId: string;
  season: string;
}

export function JerseyTabs({
  jerseyId,
  jerseyName,
  description,
  clubId,
  season,
}: JerseyTabsProps) {
  const t = useTranslations("JerseyDetail.tabs");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch("/api/user/is-admin");
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin);
        }
      } catch (err) {
        console.error("Error checking admin status:", err);
      }
    };

    checkAdmin();
  }, []);

  return (
    <div className="w-full overflow-x-hidden">
      <Tabs defaultValue="description" className="w-full">
        <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground w-full lg:w-auto">
          <TabsTrigger
            value="description"
            className="gap-1 lg:gap-2 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span className="text-xs lg:text-sm">{t("description")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="players"
            className="gap-1 lg:gap-2 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="text-xs lg:text-sm">{t("players")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="achievements"
            disabled
            className="gap-1 lg:gap-2 cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Trophy className="w-4 h-4 shrink-0" />
            <span className="text-xs lg:text-sm">{t("achievements")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-6">
          <Card className="border border-border shadow-lg overflow-hidden">
            <CardContent className="p-4 sm:p-6 min-w-0">
              {description ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <h3 className="text-xl font-semibold text-foreground">
                        {t("description")}
                      </h3>
                    </div>
                    <Button
                      onClick={() => setIsModalOpen(true)}
                      className="cursor-pointer gap-2"
                      variant="outline"
                      size="sm"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {t("suggestImprovement")}
                      </span>
                    </Button>
                  </div>
                  <div className="prose prose-sm max-w-none dark:prose-invert min-w-0">
                    <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap text-base break-words overflow-wrap-anywhere">
                      {description}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">
                      {t("description")}
                    </h3>
                  </div>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      {t("noDescription")}
                    </p>
                    <Button
                      onClick={() => setIsModalOpen(true)}
                      className="cursor-pointer gap-2"
                      variant="default"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {t("proposeDescription")}
                      </span>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="mt-6">
          <Card className="border border-border shadow-lg overflow-hidden">
            <CardContent className="p-4 sm:p-6 min-w-0">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">
                    {t("players")}
                  </h3>
                </div>
                {isAdmin && (
                  <Link
                    href={`/admin/players?clubId=${clubId}&season=${season}`}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Gérer les joueurs
                    </Button>
                  </Link>
                )}
              </div>
              <PlayersDisplay
                jerseyId={jerseyId}
                clubId={clubId}
                season={season}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <Card className="border border-border shadow-lg overflow-hidden">
            <CardContent className="p-4 sm:p-6 min-w-0">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
                <Trophy className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">
                  {t("achievements")}
                </h3>
              </div>
              <p className="text-muted-foreground text-center py-8">
                {t("comingSoon")}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ProposeDescriptionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        jerseyId={jerseyId}
        jerseyName={jerseyName}
        existingDescription={description || undefined}
      />
    </div>
  );
}
