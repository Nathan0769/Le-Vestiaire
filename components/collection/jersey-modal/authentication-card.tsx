"use client";

import { useTranslations } from "next-intl";
import { BadgeCheck, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { InfoCard } from "./info-card";
import { AuthenticationEditForm } from "./forms/authentication-edit-form";
import type { CollectionItemWithJersey } from "@/types/collection-page";
import type { UpdateCollectionData } from "@/types/collection";

interface AuthenticationCardProps {
  collectionItem: CollectionItemWithJersey;
  isEditing?: boolean;
  formData?: UpdateCollectionData;
  setFormData?: (data: UpdateCollectionData) => void;
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
  isEditing = false,
  formData,
  setFormData,
}: AuthenticationCardProps) {
  const t = useTranslations("Collection.modal.view");

  if (isEditing && formData && setFormData) {
    const accent = getAccent(formData.version);

    return (
      <InfoCard
        icon={BadgeCheck}
        title={t("cards.authentication")}
        accent={accent}
      >
        <AuthenticationEditForm formData={formData} setFormData={setFormData} />
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
