"use client";

import { Coins } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CurrencySelect } from "@/components/collection/jersey-modal/forms/currency-select";
import { useUserCurrency } from "@/hooks/useUserCurrency";

export function CurrencySettings() {
  const t = useTranslations("Settings.currency");
  const { currency, suggested, loading, setCurrency } = useUserCurrency();

  const handleChange = async (next: string) => {
    try {
      await setCurrency(next);
      toast.success(t("saved"));
    } catch {
      toast.error(t("updateError"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-primary" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <p className="text-muted-foreground">{t("loading")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 space-y-1">
              <Label htmlFor="preferred-currency" className="text-base">
                {t("label")}
              </Label>
              <p className="text-sm text-muted-foreground">{t("hint")}</p>
            </div>
            <CurrencySelect
              id="preferred-currency"
              value={currency ?? suggested}
              onChange={handleChange}
              className="w-full sm:w-64"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
