import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import { ProposeJerseyForm } from "@/components/proposals/propose-jersey-form";
import { Lightbulb } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proposer un maillot | Le Vestiaire",
  description: "Proposez un nouveau maillot à ajouter dans la base de données",
};

export default async function ProposeJerseyPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (!user.role || !["contributor", "admin", "superadmin"].includes(user.role)) {
    redirect("/?error=insufficient-permissions");
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Lightbulb className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold">Proposer un maillot</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-muted-foreground mb-6">
          Vous pouvez proposer un nouveau maillot à ajouter dans notre base de
          données. Les administrateurs examineront votre proposition avant de
          l&apos;approuver.
        </p>

        <ProposeJerseyForm />
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="font-semibold mb-2">
          Conseils pour une bonne proposition
        </h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>Vérifiez que le maillot n&apos;existe pas déjà dans la base</li>
          <li>Utilisez une photo claire et de bonne qualité</li>
          <li>
            Renseignez la saison au format YYYY-YY (ex: 2025-26, 2024-25) pour
            les clubs et au format YYYY (2025, 2022, etc..) pour les sélections
            nationales
          </li>
          <li>Soyez précis dans le nom et la description</li>
        </ul>
      </div>
    </div>
  );
}
