"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Shirt } from "lucide-react";
import { useTranslations } from "next-intl";
import { ProposalsList } from "./proposals-list";
import { DescriptionProposalsList } from "../description-proposals/description-proposals-list";

export function ProposalsTabs() {
  const t = useTranslations("Proposals.Admin");
  const tDesc = useTranslations("Proposals.Admin.DescriptionProposals");

  return (
    <Tabs defaultValue="jerseys" className="w-full">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="jerseys" className="gap-2">
          <Shirt className="w-4 h-4" />
          {t("tabJerseys")}
        </TabsTrigger>
        <TabsTrigger value="descriptions" className="gap-2">
          <FileText className="w-4 h-4" />
          {t("tabDescriptions")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="jerseys" className="mt-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="mb-6">
            <h2 className="font-semibold mb-1">{t("about")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("aboutDescription")}
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-2">
              <li>
                <strong>{t("approveLabel")}</strong> {t("approveDescription")}
              </li>
              <li>
                <strong>{t("rejectLabel")}</strong> {t("rejectDescription")}
              </li>
            </ul>
          </div>
          <ProposalsList />
        </div>
      </TabsContent>

      <TabsContent value="descriptions" className="mt-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="mb-6">
            <h2 className="font-semibold mb-1">{tDesc("aboutTitle")}</h2>
            <p className="text-sm text-muted-foreground">
              {tDesc("aboutDescription")}
            </p>
          </div>
          <DescriptionProposalsList />
        </div>
      </TabsContent>
    </Tabs>
  );
}
