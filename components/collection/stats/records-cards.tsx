"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Calendar, Clock, Award, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RecordsCardsProps {
  records: {
    oldestAcquisition: {
      jerseyName: string;
      clubName: string;
      date: string;
    };
    newestAcquisition: {
      jerseyName: string;
      clubName: string;
      date: string;
    };
  };
  additional: {
    withTags: number;
    withPersonalization: number;
    withCustomPhoto: number;
    tagsPercentage: number;
    personalizationPercentage: number;
    customPhotoPercentage: number;
  };
}

export function RecordsCards({ records, additional }: RecordsCardsProps) {
  const t = useTranslations("CollectionStats.records");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {t("oldestAcquisition")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-lg font-semibold">
              {records.oldestAcquisition.jerseyName}
            </p>
            <p className="text-sm text-muted-foreground">
              {records.oldestAcquisition.clubName}
            </p>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(records.oldestAcquisition.date), "PPP", {
                locale: fr,
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            {t("newestAcquisition")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-lg font-semibold">
              {records.newestAcquisition.jerseyName}
            </p>
            <p className="text-sm text-muted-foreground">
              {records.newestAcquisition.clubName}
            </p>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(records.newestAcquisition.date), "PPP", {
                locale: fr,
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            {t("customizationStats")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">{t("withTags")}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{additional.withTags}</span>
              <span className="text-xs text-muted-foreground">
                ({additional.tagsPercentage}%)
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">{t("withPersonalization")}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {additional.withPersonalization}
              </span>
              <span className="text-xs text-muted-foreground">
                ({additional.personalizationPercentage}%)
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">{t("withCustomPhoto")}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {additional.withCustomPhoto}
              </span>
              <span className="text-xs text-muted-foreground">
                ({additional.customPhotoPercentage}%)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
