import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import { ProposalsList } from "@/components/admin/proposals/proposals-list";
import { Shield, Lightbulb } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestion des propositions | Admin | Le Vestiaire",
  description:
    "Gérez les propositions de maillots soumises par les contributeurs",
};

export default async function AdminProposalsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (!user.role || !["admin", "superadmin"].includes(user.role)) {
    redirect("/?error=insufficient-permissions");
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold">Gestion des propositions</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-3 mb-6">
          <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
          <div>
            <h2 className="font-semibold mb-1">À propos des propositions</h2>
            <p className="text-sm text-muted-foreground">
              Les utilisateurs avec le rôle <strong>contributor</strong> (ou
              supérieur) peuvent proposer de nouveaux maillots à ajouter dans la
              base de données. Vous pouvez approuver ou rejeter ces
              propositions.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-2">
              <li>
                <strong>Approuver:</strong> Le maillot sera créé dans la base et
                le contributeur sera crédité
              </li>
              <li>
                <strong>Rejeter:</strong> La proposition sera supprimée
                définitivement
              </li>
            </ul>
          </div>
        </div>

        <ProposalsList />
      </div>
    </div>
  );
}
