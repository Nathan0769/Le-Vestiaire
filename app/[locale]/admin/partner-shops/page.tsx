import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import { PartnerShopsManager } from "@/components/admin/partner-shops-manager";

export default async function AdminPartnerShopsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "superadmin") {
    redirect("/admin");
  }

  return <PartnerShopsManager />;
}
