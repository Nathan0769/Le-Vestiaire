"use client";

import { Button } from "@/components/ui/button";
import { Camera, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface ScanPlaceholderProps {
  brand: string;
}

export function ScanPlaceholder({ brand }: ScanPlaceholderProps) {
  const t = useTranslations("Authentication.common.scanPlaceholder");

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-primary/5 w-full max-w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5 flex-shrink-0" />
          <span className="break-words">{t("title")}</span>
        </CardTitle>
        <CardDescription className="break-words">{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-background rounded-lg border min-w-0 w-full">
          <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-2 min-w-0 flex-1">
            <p className="text-sm font-medium break-words">{t("comingSoon")}</p>
            <p className="text-sm text-muted-foreground break-words">
              {t.rich("kitlegitInfo", {
                kitlegit: (chunks) => (
                  <span className="font-semibold text-foreground">
                    {chunks}
                  </span>
                ),
              })}
            </p>
            <p className="text-sm text-muted-foreground break-words">
              {t("manualGuide", { brand })}
            </p>
          </div>
        </div>

        <Button disabled className="w-full max-w-full" size="lg">
          <Camera className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="truncate">{t("scanButton")}</span>
        </Button>

        <div className="text-xs text-center text-muted-foreground break-words">
          {t("photosRequired")}
        </div>
      </CardContent>
    </Card>
  );
}
