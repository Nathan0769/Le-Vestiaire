"use client";

import { useTranslations } from "next-intl";
import { BadgeCheck, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { InfoCard } from "./info-card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CollectionItemWithJersey } from "@/types/collection-page";
import type { JerseyVersion, UpdateCollectionData } from "@/types/collection";

const VERSIONS_WITH_MATCH_INFO: JerseyVersion[] = [
  "PLAYER_ISSUE",
  "MATCH_WORN",
];

interface AuthenticationCardProps {
  collectionItem: CollectionItemWithJersey;
  isEditing: boolean;
  formData: UpdateCollectionData;
  setFormData: (data: UpdateCollectionData) => void;
}

function getAccent(
  version: string | null | undefined
): "violet" | "amber" | undefined {
  if (version === "MATCH_WORN") return "amber";
  if (version === "PLAYER_ISSUE") return "violet";
  return undefined;
}

export function AuthenticationCard({
  collectionItem,
  isEditing,
  formData,
  setFormData,
}: AuthenticationCardProps) {
  const t = useTranslations("Collection.modal.view");

  if (isEditing) {
    const accent = getAccent(formData.version);
    const showMatchInfo = VERSIONS_WITH_MATCH_INFO.includes(
      formData.version as JerseyVersion
    );

    return (
      <InfoCard
        icon={BadgeCheck}
        title={t("cards.authentication")}
        accent={accent}
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isSigned"
                checked={formData.isSigned}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    isSigned: !!checked,
                    signedBy: checked ? formData.signedBy : "",
                  })
                }
              />
              <Label htmlFor="isSigned">{t("isSigned")}</Label>
            </div>

            {formData.isSigned && (
              <div className="pl-6">
                <Input
                  placeholder={t("signedByPlaceholder")}
                  value={formData.signedBy || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, signedBy: e.target.value })
                  }
                />
              </div>
            )}

            {(formData.isSigned || formData.version === "MATCH_WORN") && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasAuthCertificate"
                  checked={formData.hasAuthCertificate}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      hasAuthCertificate: !!checked,
                      certificateUrl: checked ? formData.certificateUrl : "",
                    })
                  }
                />
                <Label htmlFor="hasAuthCertificate">
                  {t("hasAuthCertificate")}
                </Label>
              </div>
            )}

            {formData.hasAuthCertificate && (
              <div className="pl-6">
                <Input
                  id="certificateUrl"
                  type="url"
                  placeholder={t("certificateUrlPlaceholder")}
                  value={formData.certificateUrl || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      certificateUrl: e.target.value,
                    })
                  }
                />
              </div>
            )}
          </div>

          {showMatchInfo && (
            <div className="space-y-2 rounded-lg border p-3">
              <div className="space-y-1.5">
                <Label htmlFor="matchDescription">{t("matchDescription")}</Label>
                <Input
                  id="matchDescription"
                  placeholder={t("matchDescriptionPlaceholder")}
                  value={formData.matchDescription || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      matchDescription: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="matchDate">{t("matchDate")}</Label>
                <Input
                  id="matchDate"
                  type="date"
                  value={
                    formData.matchDate
                      ? formData.matchDate instanceof Date
                        ? formData.matchDate.toISOString().split("T")[0]
                        : new Date(formData.matchDate)
                            .toISOString()
                            .split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      matchDate: e.target.value
                        ? new Date(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>
      </InfoCard>
    );
  }

  // View mode
  const accent = getAccent(collectionItem.version);

  return (
    <InfoCard
      icon={BadgeCheck}
      title={t("cards.authentication")}
      accent={accent}
    >
      {collectionItem.isSigned && collectionItem.signedBy && (
        <Row label={t("signedBy")} value={collectionItem.signedBy} />
      )}

      {collectionItem.hasAuthCertificate && collectionItem.certificateUrl && (
        <Row
          label={t("authCertificate")}
          value={
            <a
              href={collectionItem.certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              {t("cards.viewCertificate")}
              <ExternalLink className="h-3 w-3" />
            </a>
          }
        />
      )}

      {collectionItem.matchDescription && (
        <Row
          label={t("matchDescription")}
          value={
            <span className="text-right max-w-[60%]">
              {collectionItem.matchDescription}
            </span>
          }
        />
      )}

      {collectionItem.matchDate && (
        <Row
          label={t("matchDate")}
          value={format(
            new Date(collectionItem.matchDate),
            "dd MMMM yyyy",
            { locale: fr }
          )}
        />
      )}
    </InfoCard>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
