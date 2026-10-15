import { PatchesManagement } from "@/components/admin/patches/patches-management";
import { CustomPatchesPanel } from "@/components/admin/patches/custom-patches-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog" className="cursor-pointer">
            Catalogue
          </TabsTrigger>
          <TabsTrigger value="custom" className="cursor-pointer">
            Patchs perso
          </TabsTrigger>
        </TabsList>
        <TabsContent value="catalog">
          <PatchesManagement />
        </TabsContent>
        <TabsContent value="custom">
          <CustomPatchesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
