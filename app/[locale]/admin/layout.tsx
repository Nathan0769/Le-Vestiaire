import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";

/**
 * Layout protégé pour les pages admin
 * Seuls les utilisateurs avec le rôle "admin" ou "superadmin" peuvent accéder
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Vérifier l'authentification
  if (!user) {
    redirect("/auth/login");
  }

  // Vérifier que l'utilisateur est admin ou superadmin
  if (user.role !== "admin" && user.role !== "superadmin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header admin */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Administration</h1>
          <p className="text-muted-foreground">
            Connecté en tant que{" "}
            <span className="font-semibold">{user.name}</span> (
            {user.role === "superadmin" ? "Super Admin" : "Admin"})
          </p>
        </div>

        {/* Contenu */}
        {children}
      </div>
    </div>
  );
}
