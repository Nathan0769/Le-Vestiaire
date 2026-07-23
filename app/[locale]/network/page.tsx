import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { redirect } from "next/navigation";
import { NetworkClient } from "@/components/follow/network-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Follow" });
  return {
    title: t("metadataNetworkTitle"),
    description: t("metadataNetworkDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function NetworkPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  return <NetworkClient />;
}
