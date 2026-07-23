import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import { hasPermission } from "@/lib/check-permission";
import { Flag } from "lucide-react";
import { CommunityReportsTable } from "@/components/admin/community-reports/community-reports-table";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "Moderation.admin",
  });
  return {
    title: t("metadataTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function AdminCommunityReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (!hasPermission(user.role, { postReport: ["list"] })) {
    redirect("/");
  }

  const t = await getTranslations("Moderation.admin");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Flag className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-semibold">{t("pageTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("pageSubtitle")}</p>
        </div>
      </div>
      <CommunityReportsTable />
    </div>
  );
}
