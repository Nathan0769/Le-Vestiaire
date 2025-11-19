import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import { ProposalsTabs } from "@/components/admin/proposals/proposals-tabs";
import { Shield } from "lucide-react";
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

      <ProposalsTabs />
    </div>
  );
}
