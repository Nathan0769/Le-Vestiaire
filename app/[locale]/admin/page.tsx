import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  ShieldCheck,
  UserCheck,
  Tag,
  Sparkles,
  Flag,
  CalendarRange,
} from "lucide-react";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const isSuperAdmin = user.role === "superadmin";

  const pendingReportsCount = await prisma.jerseyReport.count({
    where: { status: "PENDING" },
  });

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
              <Flag className="h-5 w-5" />
              <CardTitle className="flex-1">Signalements</CardTitle>
              {pendingReportsCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                  {pendingReportsCount}
                </span>
              )}
            </div>
            <CardDescription>
              Signalements de maillots envoyés par les utilisateurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/reports">
              <Button className="w-full cursor-pointer">
                Voir les signalements
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

        {isSuperAdmin && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                <CardTitle>Promos CFS</CardTitle>
              </div>
              <CardDescription>
                Gérer les maillots en promo affichés sur la homepage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/cfs-promos">
                <Button className="w-full cursor-pointer">
                  Gérer les promos
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {isSuperAdmin && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                <CardTitle>Alias CFS</CardTitle>
              </div>
              <CardDescription>
                Mapper les noms de clubs CFS vers les Clubs internes pour activer le matching wishlist
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/cfs-aliases">
                <Button className="w-full cursor-pointer">
                  Gérer les alias
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {isSuperAdmin && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <CardTitle>Patches</CardTitle>
              </div>
              <CardDescription>
                Catalogue des patches/badges et leurs versions par saison
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/patches">
                <Button className="w-full cursor-pointer">
                  Gérer les patches
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {isSuperAdmin && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarRange className="h-5 w-5" />
                <CardTitle>Ligues par saison</CardTitle>
              </div>
              <CardDescription>
                Associer un club à une ligue pour une saison passée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/club-leagues">
                <Button className="w-full cursor-pointer">
                  Gérer les associations
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
