"use client";

import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  JerseyVersion,
  UpdateCollectionData,
} from "@/types/collection";

const VERSIONS_WITH_MATCH_INFO: JerseyVersion[] = [
  "PLAYER_ISSUE",
  "MATCH_WORN",
];

interface AuthenticationEditFormProps {
  formData: UpdateCollectionData;
  setFormData: (data: UpdateCollectionData) => void;
}

export function AuthenticationEditForm({
  formData,
  setFormData,
}: AuthenticationEditFormProps) {
  const t = useTranslations("Collection.modal.view");

  const showMatchInfo = VERSIONS_WITH_MATCH_INFO.includes(
    formData.version as JerseyVersion
  );

  return (
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
  );
}
