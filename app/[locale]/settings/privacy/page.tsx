import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { PrivacySettings } from "@/components/settings/privacy-settings";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Privacy" });
  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function PrivacyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isPrivate: true },
  });

  const t = await getTranslations("Privacy");

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <PrivacySettings initialIsPrivate={record?.isPrivate ?? false} />
    </div>
  );
}
