import { PatchesManagement } from "@/components/admin/patches/patches-management";

export const metadata = {
  title: "Gestion des patches - Admin",
  description: "Gérer le catalogue de patches et leurs versions par saison",
};

export default function PatchesAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestion des patches</h2>
        <p className="text-muted-foreground">
          Catalogue des badges/patches et leurs versions par saison
        </p>
      </div>

      <PatchesManagement />
    </div>
  );
}
