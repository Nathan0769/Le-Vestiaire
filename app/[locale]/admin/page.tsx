import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, ShieldCheck, UserCheck } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tableau de bord</h2>
        <p className="text-muted-foreground">
          Bienvenue dans l&apos;interface d&apos;administration
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Gestion des utilisateurs</CardTitle>
            </div>
            <CardDescription>
              Gérer les rôles et permissions des utilisateurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users">
              <Button className="w-full cursor-pointer">
                Voir les utilisateurs
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              <CardTitle>Propositions de maillots</CardTitle>
            </div>
            <CardDescription>
              Approuver ou rejeter les propositions de nouveaux maillots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/proposals">
              <Button className="w-full cursor-pointer">
                Gérer les propositions
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              <CardTitle>Gestion des joueurs</CardTitle>
            </div>
            <CardDescription>
              Ajouter et gérer les joueurs par club et saison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/players">
              <Button className="w-full cursor-pointer">
                Gérer les joueurs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
