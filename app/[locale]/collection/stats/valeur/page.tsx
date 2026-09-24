import { getCurrentUser } from "@/lib/get-current-user";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/routing";
import prisma from "@/lib/prisma";
import { isSupporter } from "@/lib/subscription";
import { MarketValueDashboard } from "@/components/collection/stats/market-value-dashboard";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("MarketValue");
  return { title: `${t("title")} | Le Vestiaire` };
}

export default async function CollectionValuePage() {
  const t = await getTranslations("MarketValue");
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Fonctionnalité réservée aux Supporters (plan PRO).
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { plan: true },
  });
  if (!isSupporter(dbUser)) {
    redirect("/soutien");
  }

  return (
    <div className="p-3 md:p-6">
      <Link
        href="/collection/stats"
        className="mb-4 inline-flex items-center gap-1 rounded-full bg-muted py-1.5 pl-2.5 pr-4 text-sm font-semibold text-primary transition-colors hover:bg-muted/70"
      >
        <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2.5} />
        {t("back")}
      </Link>

      <MarketValueDashboard />
    </div>
  );
}
