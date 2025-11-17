import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/get-current-user";
import { MyProposalsList } from "@/components/proposals/my-proposals-list";
import { Button } from "@/components/ui/button";
import { Plus, Clock } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Proposals.User" });

  return {
    title: t("myProposalsTitle"),
    description: t("myProposalsDescription"),
  };
}

export default async function MyProposalsPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("Proposals.User");

  if (!user) {
    redirect("/auth/login");
  }

  const isContributor = user.role && ["contributor", "admin", "superadmin"].includes(user.role);

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">{t("myProposalsHeading")}</h1>
        </div>

        {isContributor && (
          <Link href="/community/propose-jersey">
            <Button className="cursor-pointer">
              <Plus className="w-4 h-4 mr-2" />
              {t("newProposal")}
            </Button>
          </Link>
        )}
      </div>

      <MyProposalsList />
    </div>
  );
}
