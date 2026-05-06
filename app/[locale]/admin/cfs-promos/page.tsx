import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import { CfsPromosManager } from "@/components/admin/cfs-promos-manager";

export default async function AdminCfsPromosPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "superadmin") {
    redirect("/admin");
  }

  return <CfsPromosManager />;
}
