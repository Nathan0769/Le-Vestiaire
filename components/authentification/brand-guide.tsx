"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import type { BrandGuide } from "@/types/authentication";
import { VisualExample } from "./visual-examples";
import { useTranslations } from "next-intl";

interface BrandGuideComponentProps {
  guide: BrandGuide;
}

export function BrandGuideComponent({ guide }: BrandGuideComponentProps) {
  const t = useTranslations("Authentication.common");
  const showVisualExamples = guide.brand === "adidas" || guide.brand === "nike";

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{guide.title}</h1>
        <p className="text-lg text-muted-foreground">{guide.description}</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">{t("authenticationSteps")}</h2>
        </div>

        <div className="grid gap-4 md:gap-6">
          {guide.criteria.map((criterion, index) => (
            <div key={index} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{criterion.title}</CardTitle>
                  <CardDescription>{criterion.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {criterion.points.map((point, pointIndex) => (
                      <li
                        key={pointIndex}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {showVisualExamples && (
                <VisualExample stepNumber={index + 1} brand={guide.brand} />
              )}
            </div>
          ))}
        </div>
      </div>

      {guide.commonFakes.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <XCircle className="w-5 h-5" />
              {t("commonFakes")}
            </CardTitle>
            <CardDescription>{t("commonFakesDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {guide.commonFakes.map((fake, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <span>{fake}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {guide.tips.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Lightbulb className="w-5 h-5" />
              {t("buyingTips")}
            </CardTitle>
            <CardDescription>{t("buyingTipsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {guide.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
