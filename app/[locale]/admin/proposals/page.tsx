import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import { ProposalsList } from "@/components/admin/proposals/proposals-list";
import { Shield, Lightbulb } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Proposals.Admin" });

  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  };
}

export default async function AdminProposalsPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("Proposals.Admin");

  if (!user) {
    redirect("/auth/login");
  }

  if (!user.role || !["admin", "superadmin"].includes(user.role)) {
    redirect("/?error=insufficient-permissions");
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold">{t("heading")}</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-3 mb-6">
          <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
          <div>
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
        </div>

        <ProposalsList />
      </div>
    </div>
  );
}
