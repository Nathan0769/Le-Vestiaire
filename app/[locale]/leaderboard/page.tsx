import { Trophy } from "lucide-react";
import { LeaderboardTabs } from "@/components/leaderboard/leaderboard-tabs";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Leaderboard.page" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LeaderboardPage() {
  const t = await getTranslations("Leaderboard.page");

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Trophy className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold">{t("heading")}</h1>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {t("howItWorks")}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t("howItWorksDescription")}
            </p>
          </div>
        </div>
      </div>

      <LeaderboardTabs />
    </div>
  );
}
