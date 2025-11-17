import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import { ProposeJerseyForm } from "@/components/proposals/propose-jersey-form";
import { Lightbulb } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Proposals.User" });

  return {
    title: t("proposeJerseyTitle"),
    description: t("proposeJerseyDescription"),
  };
}

export default async function ProposeJerseyPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("Proposals.User");

  if (!user) {
    redirect("/auth/login");
  }

  if (!user.role || !["contributor", "admin", "superadmin"].includes(user.role)) {
    redirect("/?error=insufficient-permissions");
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Lightbulb className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold">{t("proposeJerseyHeading")}</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-muted-foreground mb-6">
          {t("proposeJerseyInfo")}
        </p>

        <ProposeJerseyForm />
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="font-semibold mb-2">
          {t("tipsHeading")}
        </h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>{t("tip1")}</li>
          <li>{t("tip2")}</li>
          <li>{t("tip3")}</li>
          <li>{t("tip4")}</li>
        </ul>
      </div>
    </div>
  );
}
