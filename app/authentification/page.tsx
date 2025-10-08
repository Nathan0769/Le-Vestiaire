import { Shield } from "lucide-react";
import { BrandGrid } from "@/components/authentification/brand-grid";
import { BRANDS } from "@/lib/authentication-content";

export const metadata = {
  title: "Authentification de maillots - Le Vestiaire",
  description:
    "Vérifiez l'authenticité de vos maillots de football. Guides détaillés pour Adidas, Nike, Puma et Hummel.",
};

export default function AuthentificationPage() {
  return (
    <div className="p-6 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">Authentification de maillots</h1>
        </div>
        <p className="text-md text-muted-foreground ">
          Apprenez à reconnaître un véritable maillot d&apos;une contrefaçon.
          Sélectionnez la marque de votre maillot pour accéder au guide détaillé
          d&apos;authentification.
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Protégez votre investissement
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Le marché des maillots de football est malheureusement inondé de
              contrefaçons. Nos guides vous aident à identifier les vrais
              maillots et à éviter les arnaques.
            </p>
          </div>
        </div>
      </div>

      <BrandGrid brands={BRANDS} />

      <div className="bg-muted/50 rounded-lg p-6 space-y-3">
        <h3 className="font-semibold text-lg">
          Pourquoi l&apos;authentification est importante ?
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>
              Les contrefaçons représentent jusqu&apos;à 30% du marché des
              maillots en ligne
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>
              Un faux maillot se détériore rapidement et n&apos;a aucune valeur
              de revente
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>
              Acheter une contrefaçon finance des réseaux de contrebande
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>
              Les maillots authentiques garantissent qualité, confort et
              durabilité
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
