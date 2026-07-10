import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import { CfsAliasesManager } from "@/components/admin/cfs-aliases-manager";

export default async function AdminCfsAliasesPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "superadmin") {
    redirect("/admin");
  }

  return <CfsAliasesManager />;
}
