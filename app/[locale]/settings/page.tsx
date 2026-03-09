import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/get-current-user";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/settings/settings-client";

export const metadata: Metadata = {
  title: "Paramètres - Le Vestiaire Foot",
  description: "Gérez les paramètres de votre compte Le Vestiaire Foot.",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <SettingsClient />;
}
