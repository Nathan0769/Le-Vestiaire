import { PlayersManagement } from "@/components/admin/players/players-management";

export const metadata = {
  title: "Gestion des joueurs - Admin",
  description: "Gérer les joueurs par club et saison",
};

export default function PlayersAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestion des joueurs</h2>
        <p className="text-muted-foreground">
          Ajouter, modifier ou supprimer des joueurs pour chaque club et saison
        </p>
      </div>

      <PlayersManagement />
    </div>
  );
}
